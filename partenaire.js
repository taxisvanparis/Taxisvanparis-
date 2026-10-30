/* Taxis Van Paris — Mode « partenaire » du calculateur du site
 * Lien : taxisvanparis.fr/?h=CODE  (ou le QR /hotel/?h=CODE d'un partenaire marqué site:true)
 *  - ouvre directement la page Réserver
 *  - remplit le départ avec l'adresse du logement / de l'hôtel
 *  - propose cette adresse en premier quand la case départ ou arrivée est vide
 *  - marque la réservation « via <partenaire> » dans le tableau de bord
 * Pour ajouter un partenaire : une ligne dans PARTENAIRES (même liste que hotel/index.html).
 */
(function () {
  var PARTENAIRES = {
    richelieu38: { nom: "38 rue de Richelieu", adresse: "38 Rue de Richelieu, 75001 Paris" }
  };
  var TXT = {
    fr: { via: "Réservation via", stay: "Votre hébergement" },
    en: { via: "Booking via", stay: "Your accommodation" },
    es: { via: "Reserva a través de", stay: "Su alojamiento" },
    it: { via: "Prenotazione tramite", stay: "Il tuo alloggio" },
    ar: { via: "الحجز عبر", stay: "مكان إقامتك" }
  };

  var code = "";
  try {
    code = (new URLSearchParams(location.search).get("h") || "").toLowerCase();
    if (code) sessionStorage.setItem("tvp_partenaire", code);
    else code = sessionStorage.getItem("tvp_partenaire") || "";
  } catch (e) {}
  var P = PARTENAIRES[code];
  if (!P) return;
  var lang = (document.documentElement.lang || "fr").slice(0, 2);
  var t = TXT[lang] || TXT.en;
  window.TVP_PARTENAIRE = { code: code, nom: P.nom, adresse: P.adresse };

  function $(id) { return document.getElementById(id); }

  // Bandeau « Réservation via … » en haut du calculateur
  function bandeau() {
    var w = document.querySelector("#page-booking .booking-wrap");
    if (!w || $("tvp-part")) return;
    var d = document.createElement("div");
    d.id = "tvp-part";
    d.style.cssText = "display:flex;align-items:center;gap:12px;margin:0 0 18px;padding:12px 14px;border:1px solid rgba(201,168,76,.45);background:rgba(201,168,76,.08);border-radius:12px";
    var ic = document.createElement("div");
    ic.textContent = "📍";
    ic.style.cssText = "font-size:1.3rem;line-height:1";
    var tx = document.createElement("div");
    var s = document.createElement("small");
    s.textContent = t.via;
    s.style.cssText = "display:block;opacity:.7;font-size:.75rem";
    var b = document.createElement("strong");
    b.textContent = P.nom;
    tx.appendChild(s); tx.appendChild(b);
    d.appendChild(ic); d.appendChild(tx);
    w.insertBefore(d, w.firstChild);
  }

  // Choisit une adresse avec la même fonction que la liste Google du site (pickItem)
  function choisir(id) {
    if (typeof autocompleteService === "undefined" || !autocompleteService || typeof pickItem !== "function") return false;
    autocompleteService.getPlacePredictions({ input: P.adresse, language: "fr", componentRestrictions: { country: "fr" } }, function (preds, st) {
      if (st !== google.maps.places.PlacesServiceStatus.OK || !preds || !preds[0]) { $(id).value = P.adresse; return; }
      var el = document.createElement("div");
      el.dataset.place = preds[0].place_id;
      el.dataset.main = encodeURIComponent(P.adresse);
      pickItem(id, el);
    });
    return true;
  }

  // Proposition « 📍 adresse · Votre hébergement » quand la case est vide
  function proposer(id) {
    var input = $(id), list = $("list-" + id), autre = $(id === "dep" ? "arr" : "dep");
    if (!input || !list || input.value.trim().length >= 3) return;
    if (autre && autre.value === P.adresse) return;
    var deja = list.querySelector(".tvp-home"); if (deja) deja.remove();
    var it = document.createElement("div");
    it.className = "ac-item tvp-home";
    it.style.background = "rgba(201,168,76,.12)";
    var ico = document.createElement("span"); ico.className = "ac-icon"; ico.textContent = "🏠";
    var box = document.createElement("span");
    var m = document.createElement("span"); m.className = "ac-main"; m.textContent = P.adresse; m.style.fontWeight = "700";
    var sub = document.createElement("span"); sub.className = "ac-sub"; sub.textContent = t.stay + " · " + P.nom;
    box.appendChild(m); box.appendChild(sub); it.appendChild(ico); it.appendChild(box);
    it.addEventListener("mousedown", function (e) { e.preventDefault(); list.classList.remove("open"); choisir(id); });
    var autreList = $("list-" + (id === "dep" ? "arr" : "dep")); if (autreList) autreList.classList.remove("open");
    list.insertBefore(it, list.firstChild);
    list.classList.add("open");
  }

  function brancher() {
    ["dep", "arr"].forEach(function (id) {
      var input = $(id);
      if (!input) return;
      // après la liste rapide du site (Aéroports, Gares…) : on ajoute le logement en tête
      input.addEventListener("focus", function () { setTimeout(function () { proposer(id); }, 60); });
      input.addEventListener("input", function () { if (input.value.trim().length < 3) setTimeout(function () { proposer(id); }, 60); });
    });
  }

  // Réservation marquée « via partenaire » dans le tableau de bord (sans commission)
  function marquer() {
    var orig = window.enregistrerReservation;
    if (typeof orig !== "function" || orig.__tvpPart) return false;
    var w = function (data) {
      var d = Object.assign({}, data, { partenaire: P.nom, partenaire_code: code });
      if (d.nom && String(d.nom).indexOf("📍") !== 0) d.nom = "📍 " + d.nom + " (" + P.nom + ")";
      return orig(d);
    };
    w.__tvpPart = true;
    window.enregistrerReservation = w;
    return true;
  }

  function demarrer() {
    if (typeof goPage === "function") goPage("booking");
    bandeau();
    brancher();
    var essais = 0;
    (function attendre() {
      var ok = choisir("dep");
      if (!ok && essais++ < 60) return setTimeout(attendre, 250);
    })();
    var e2 = 0;
    (function attendreFb() { if (!marquer() && e2++ < 80) setTimeout(attendreFb, 250); })();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(demarrer, 0); });
  else setTimeout(demarrer, 0);
})();
