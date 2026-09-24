// Taxis Van Paris — enregistrement des réservations dans Firebase
// au moment où le client envoie sa réservation sur WhatsApp.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBN8uBFONIt1tDTH9C-NIQKeulFdJ2m26Q",
  authDomain: "taxis-van-paris-by-abts.firebaseapp.com",
  projectId: "taxis-van-paris-by-abts",
  storageBucket: "taxis-van-paris-by-abts.firebasestorage.app",
  messagingSenderId: "53887245170",
  appId: "1:53887245170:web:2a3b785d734c54e01f9beb"
};

const db = getFirestore(initializeApp(firebaseConfig, "site-resa"));

const isWhatsApp = (url) => /(wa\.me|api\.whatsapp\.com|whatsapp:\/\/)/i.test(String(url || ""));

function messageFromUrl(url) {
  try {
    const u = new URL(url, location.href);
    return u.searchParams.get("text") || "";
  } catch (e) {
    const m = String(url).match(/[?&]text=([^&]*)/);
    return m ? decodeURIComponent(m[1].replace(/\+/g, " ")) : "";
  }
}

function lineValue(msg, ...keys) {
  const lines = msg.split(/\r?\n/).map(l => l.replace(/[*_~]/g, "").trim());
  for (const k of keys) {
    const re = new RegExp("^[^\\wÀ-ÿ]*" + k + "\\b[^:：]{0,25}[:：]\\s*(.+)$", "i");
    for (const line of lines) {
      const m = line.match(re);
      if (m && m[1].trim()) return m[1].trim();
    }
  }
  return "";
}

function formValues() {
  const val = (el) => (el && el.value ? el.value.trim() : "");
  const q = (s) => document.querySelector(s);
  const acInputs = document.querySelectorAll(".ac-wrap input");
  const selectedCard = q(".vcard.active, .vcard.selected, .vcard.sel, .vcard[aria-pressed='true']");
  const selectedSeat = q(".sopt.active, .sopt.selected, .sopt.sel");
  return {
    dep: val(acInputs[0]) || val(q("#depart, #dep, [name=depart], [name=dep]")),
    arr: val(acInputs[1]) || val(q("#arrivee, #arr, [name=arrivee], [name=arr], #destination")),
    date: val(q("input[type=date]")),
    heure: val(q("input[type=time]")),
    pax: val(q("#passagers, #pax, [name=passagers], select")),
    nom: val(q("#nom, [name=nom], #name, input[type=text][placeholder*='om' i]")),
    tel: val(q("input[type=tel]")),
    vehicule: selectedCard ? selectedCard.textContent.replace(/\s+/g, " ").trim().slice(0, 40) : "",
    siege: selectedSeat ? selectedSeat.textContent.replace(/\s+/g, " ").trim().slice(0, 40) : ""
  };
}

function buildReservation(url) {
  const msg = messageFromUrl(url);
  const f = formValues();
  const r = {
    dep: lineValue(msg, "d[ée]part", "prise en charge", "adresse de d[ée]part", "from") || f.dep,
    arr: lineValue(msg, "arriv[ée]e", "destination", "d[ée]pose", "to") || f.arr,
    date: lineValue(msg, "date", "jour") || f.date,
    heure: lineValue(msg, "heure", "horaire", "time") || f.heure,
    pax: lineValue(msg, "passagers?", "personnes?", "pax") || f.pax || "1",
    vehicule: lineValue(msg, "v[ée]hicule", "voiture", "type de v[ée]hicule") || f.vehicule,
    siege: lineValue(msg, "si[èe]ges?", "enfant", "b[ée]b[ée]") || f.siege,
    nom: lineValue(msg, "nom", "name", "client") || f.nom,
    tel: lineValue(msg, "t[ée]l[ée]phone", "t[ée]l", "phone", "portable") || f.tel,
    prix: lineValue(msg, "prix", "tarif", "total", "montant", "estimation") ||
          ((msg.match(/(\d+[.,]?\d*)\s?€/) || [])[0] || ""),
    message: msg.slice(0, 1500),
    page: location.pathname,
    source: "site",
    statut: "en attente",
    date_creation: new Date().toISOString()
  };
  Object.keys(r).forEach(k => { if (typeof r[k] === "string") r[k] = r[k].slice(0, k === "message" ? 1500 : 200); });
  return r;
}

function looksLikeBooking(r) {
  return Boolean((r.dep && r.arr) || /r[ée]serv/i.test(r.message));
}

let lastSaved = { key: "", t: 0 };
function save(url) {
  const r = buildReservation(url);
  if (!looksLikeBooking(r)) return Promise.resolve();
  const key = r.message || (r.dep + r.arr + r.date + r.heure);
  if (key === lastSaved.key && Date.now() - lastSaved.t < 15000) return Promise.resolve();
  lastSaved = { key, t: Date.now() };
  return addDoc(collection(db, "reservations"), r).catch(err => console.error("Réservation non enregistrée :", err));
}

const withTimeout = (p, ms) => Promise.race([p, new Promise(res => setTimeout(res, ms))]);

document.addEventListener("click", (e) => {
  const a = e.target.closest && e.target.closest("a[href]");
  if (!a || !isWhatsApp(a.href)) return;
  const url = a.href;
  if (a.target === "_blank") { save(url); return; }
  e.preventDefault();
  withTimeout(save(url), 2500).then(() => { location.href = url; });
}, true);

const originalOpen = window.open;
window.open = function (url, ...rest) {
  if (isWhatsApp(url)) save(url);
  return originalOpen.call(window, url, ...rest);
};

document.addEventListener("submit", (e) => {
  const action = e.target.getAttribute("action") || "";
  if (isWhatsApp(action)) save(action);
}, true);
