/* ═══ Assistant IA Taxis Van Paris — actif de 21 h à 6 h (heure de Paris) ═══
   Répond aux clients (prix forfaits, services) et prend les réservations,
   enregistrées dans le tableau de bord comme une réservation du site.        */
(function () {
  "use strict";
  var APPS = "https://script.google.com/macros/s/AKfycbynqJeRA8W1AoYiHWQhS-ZPGHrEHyQBW8xp4xFGAYgP68lAugMsNZqWYkleYV1P4Va6/exec";
  var TEST = !!window.TVP_IA_TEST;          // page de test : toujours visible, rien n'est enregistré
  var lang = (document.documentElement.lang || "fr").slice(0, 2);

  function heureParis() {
    try { return +new Intl.DateTimeFormat("fr-FR", { hour: "numeric", hourCycle: "h23", timeZone: "Europe/Paris" }).format(new Date()); }
    catch (e) { return new Date().getHours(); }
  }
  function actif() { var h = heureParis(); return TEST || h >= 21 || h < 6; }

  var TOUS = {
    fr: { titre: "Assistant Taxis Van Paris", sous: "Réponse immédiate · 21 h – 6 h", bonjour: "Bonsoir 👋 Je suis l'assistant de Taxis Van Paris. Je peux vous donner un prix, répondre à vos questions ou réserver votre course. Comment puis-je vous aider ?", ph: "Votre message…", btn: "Une question ? Écrivez-nous", ok: "Confirmer la réservation", okDone: "✅ Réservation envoyée ! Un chauffeur vous confirme par WhatsApp ou SMS dès que possible.", err: "Désolé, l'assistant est momentanément indisponible. Appelez ou écrivez-nous sur WhatsApp au +33 6 67 40 20 05.", recap: "Récapitulatif", test: "(Page de test : la réservation n'est pas enregistrée.)" },
    en: { titre: "Taxis Van Paris Assistant", sous: "Instant reply · 9 pm – 6 am", bonjour: "Good evening 👋 I'm the Taxis Van Paris assistant. I can give you a price, answer your questions or book your ride. How can I help?", ph: "Your message…", btn: "A question? Chat with us", ok: "Confirm booking", okDone: "✅ Booking sent! A driver will confirm by WhatsApp or SMS as soon as possible.", err: "Sorry, the assistant is temporarily unavailable. Call or WhatsApp us at +33 6 67 40 20 05.", recap: "Summary", test: "(Test page: the booking is not saved.)" },
    es: { titre: "Asistente Taxis Van Paris", sous: "Respuesta inmediata · 21 h – 6 h", bonjour: "Buenas noches 👋 Soy el asistente de Taxis Van Paris. Puedo darle un precio, responder a sus preguntas o reservar su trayecto. ¿En qué puedo ayudarle?", ph: "Su mensaje…", btn: "¿Una pregunta? Escríbanos", ok: "Confirmar la reserva", okDone: "✅ ¡Reserva enviada! Un conductor le confirmará por WhatsApp o SMS lo antes posible.", err: "Lo sentimos, el asistente no está disponible. Llámenos o escríbanos por WhatsApp al +33 6 67 40 20 05.", recap: "Resumen", test: "(Página de prueba: la reserva no se guarda.)" },
    it: { titre: "Assistente Taxis Van Paris", sous: "Risposta immediata · 21 – 6", bonjour: "Buonasera 👋 Sono l'assistente di Taxis Van Paris. Posso darle un prezzo, rispondere alle sue domande o prenotare la sua corsa. Come posso aiutarla?", ph: "Il suo messaggio…", btn: "Una domanda? Scriveteci", ok: "Conferma la prenotazione", okDone: "✅ Prenotazione inviata! Un autista le confermerà via WhatsApp o SMS al più presto.", err: "Spiacenti, l'assistente non è disponibile. Ci chiami o scriva su WhatsApp al +33 6 67 40 20 05.", recap: "Riepilogo", test: "(Pagina di prova: la prenotazione non viene salvata.)" },
    ar: { titre: "مساعد Taxis Van Paris", sous: "رد فوري · من 21:00 إلى 6:00", bonjour: "مساء الخير 👋 أنا مساعد Taxis Van Paris. يمكنني إعطاؤك السعر أو الإجابة عن أسئلتك أو حجز رحلتك. كيف يمكنني مساعدتك؟", ph: "رسالتك…", btn: "سؤال؟ راسلنا", ok: "تأكيد الحجز", okDone: "✅ تم إرسال الحجز! سيؤكد لك السائق عبر واتساب أو رسالة نصية في أقرب وقت.", err: "عذرًا، المساعد غير متاح حاليًا. اتصل بنا أو راسلنا على واتساب ‎+33 6 67 40 20 05.", recap: "ملخص", test: "(صفحة تجريبية: لا يتم حفظ الحجز.)" }
  };
  if (!TOUS[lang]) lang = "fr";
  var TXT = TOUS[lang];

  var SYSTEME = [
    "Tu es l'assistant de nuit de Taxis Van Paris (taxisvanparis.fr), société de taxi et transferts privés basée à Nanterre (AB Taxis Services).",
    "Réponds TOUJOURS dans la langue du client, en phrases courtes, poli et chaleureux, comme un standardiste. Pas de listes longues.",
    "",
    "SERVICES : berline (jusqu'à 4 passagers) et van Mercedes Classe V (jusqu'à 7 passagers, 8 sur demande). Disponible 24 h/24, 7 j/7.",
    "Transferts aéroports (CDG, Orly, Beauvais), gares parisiennes, Disneyland Paris, Paris et banlieue, longues distances.",
    "Siège bébé et rehausseur GRATUITS, il suffit de les demander. À l'aéroport, le chauffeur attend aux arrivées avec une pancarte au nom du client et suit l'heure du vol en cas de retard.",
    "Paiement : carte bancaire pour tous les montants (Visa, Mastercard, American Express, Apple Pay, Google Pay) ou espèces, à bord.",
    "Contact humain : +33 6 67 40 20 05 (téléphone et WhatsApp).",
    "",
    "PRIX FIXES (prix garantis) — berline / van jusqu'à 5 pers. / van 6 pers. et plus :",
    "- Paris → Aéroport CDG : 75 € / 85 € / 95 €",
    "- Aéroport CDG → Paris : 85 € / 95 € / 105 €",
    "- Paris → Aéroport Orly : 70 € / 80 € / 95 € (van jusqu'à 6 pers. à 80 €)",
    "- Aéroport Orly → Paris : 80 € / 90 € / 105 € (van jusqu'à 6 pers. à 90 €)",
    "- Paris → Aéroport Beauvais : 175 € / 188 € / 205 € (van jusqu'à 6 pers. à 188 €)",
    "- Aéroport Beauvais → Paris : 185 € / 198 € / 215 €",
    "- CDG ⇄ Orly : 80 € en berline, 109 € en van",
    "- Gare parisienne ⇄ Paris : 50 € en berline, 60 € en van",
    "- Course dans Paris : minimum 50 € en berline (60 € avec siège enfant), minimum 60 € en van (70 € avec siège enfant)",
    "- Gare parisienne ⇄ banlieue en van : minimum 70 €",
    "« Paris » pour ces prix = Paris intra-muros et les villes limitrophes (Boulogne, Neuilly, Levallois, Issy, Montreuil, Vincennes, Saint-Ouen, etc.).",
    "Pour TOUT autre trajet (banlieue, Disneyland, Versailles, province…), le prix dépend de la distance réelle : NE DONNE JAMAIS DE CHIFFRE INVENTÉ.",
    "Dis que le prix exact s'affiche en 10 secondes avec le bouton « Calculer le tarif » de la page, ou que tu peux enregistrer la demande et qu'un chauffeur confirmera le prix.",
    "Ne parle jamais de prise en charge, de prix au kilomètre ni de supplément passager.",
    "",
    "RÉSERVATION : pour réserver, demande (sans tout demander d'un coup) : adresse de départ, adresse d'arrivée, date, heure, nombre de passagers, berline ou van, siège enfant éventuel, numéro de vol si aéroport, nom et téléphone.",
    "Ne demande rien d'autre (pas d'adresse email obligatoire, jamais de données bancaires).",
    "Quand tu as TOUT et que le client a dit oui au récapitulatif, termine ta réponse par une seule ligne exactement de cette forme (JSON valide, sans retour à la ligne) :",
    "<resa>{\"nom\":\"…\",\"tel\":\"…\",\"dep\":\"…\",\"arr\":\"…\",\"date\":\"AAAA-MM-JJ\",\"heure\":\"HH:MM\",\"pax\":\"2\",\"vehicule\":\"berline\" ou \"van\",\"siege\":\"Aucune\" ou \"Siège bébé\" ou \"Rehausseur\" ou \"Siège bébé + Rehausseur\",\"vol\":\"\",\"prix\":\"75 €\" si prix fixe connu sinon \"À confirmer\"}</resa>",
    "Après cette ligne, dis au client de cliquer sur le bouton de confirmation qui apparaît.",
    "Si la demande sort du cadre (sujet sans rapport, réclamation, objet perdu, urgence), donne le numéro +33 6 67 40 20 05.",
    "Nous sommes le " + new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" }) + ", il est " + new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }) + " à Paris."
  ].join("\n");

  var css = "#tvpia-btn{position:fixed;left:14px;bottom:18px;z-index:9998;display:flex;align-items:center;gap:8px;padding:12px 16px;border:none;border-radius:999px;background:#0A1522;color:#C9A84C;font:600 14px/1.2 'DM Sans',system-ui,sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.35);cursor:pointer;border:1px solid rgba(201,168,76,.6)}" +
    "#tvpia-btn .d{width:9px;height:9px;border-radius:50%;background:#3ddc84;box-shadow:0 0 0 3px rgba(61,220,132,.25)}" +
    "#tvpia{position:fixed;left:14px;bottom:18px;z-index:9999;width:min(380px,calc(100vw - 28px));height:min(560px,calc(100vh - 110px));display:none;flex-direction:column;background:#0A1522;border:1px solid rgba(201,168,76,.45);border-radius:16px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,.5);font:15px/1.45 'DM Sans',system-ui,sans-serif;color:#f3efe6}" +
    "#tvpia.open{display:flex}#tvpia header{display:flex;align-items:center;gap:10px;padding:12px 14px;background:#111f30;border-bottom:1px solid rgba(201,168,76,.25)}" +
    "#tvpia header b{display:block;color:#C9A84C;font-size:15px}#tvpia header small{color:#aab3c0;font-size:12px}#tvpia header button{margin-inline-start:auto;background:none;border:none;color:#aab3c0;font-size:22px;cursor:pointer;line-height:1}" +
    "#tvpia-log{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px}" +
    ".tvpia-m{max-width:85%;padding:9px 12px;border-radius:14px;white-space:pre-wrap;overflow-wrap:anywhere}.tvpia-m.ia{background:#16263a;align-self:flex-start;border-end-start-radius:4px}.tvpia-m.cl{background:#C9A84C;color:#0A1522;align-self:flex-end;border-end-end-radius:4px}" +
    ".tvpia-m.att{opacity:.7;font-style:italic}.tvpia-card{align-self:stretch;background:#111f30;border:1px solid rgba(201,168,76,.5);border-radius:12px;padding:12px;font-size:14px}.tvpia-card b{color:#C9A84C}.tvpia-card div{margin:3px 0}" +
    ".tvpia-card button{margin-top:10px;width:100%;padding:11px;border:none;border-radius:10px;background:#C9A84C;color:#0A1522;font-weight:700;font-size:15px;cursor:pointer}.tvpia-card button:disabled{opacity:.6}" +
    "#tvpia form{display:flex;gap:8px;padding:10px;border-top:1px solid rgba(201,168,76,.25);background:#0d1a29}#tvpia input{flex:1;min-width:0;padding:11px 12px;border-radius:10px;border:1px solid rgba(201,168,76,.35);background:#0A1522;color:#f3efe6;font-size:16px}" +
    "#tvpia form button{padding:0 14px;border:none;border-radius:10px;background:#C9A84C;color:#0A1522;font-weight:700;font-size:18px;cursor:pointer}";

  var histo = [], enCours = false, el = {};

  function monter() {
    if (document.getElementById("tvpia-btn")) return;
    var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
    var b = document.createElement("button"); b.id = "tvpia-btn"; b.type = "button";
    b.innerHTML = '<span class="d"></span><span></span>'; b.lastChild.textContent = TXT.btn;
    var p = document.createElement("div"); p.id = "tvpia"; p.dir = lang === "ar" ? "rtl" : "ltr";
    p.innerHTML = '<header><div><b></b><small></small></div><button type="button" aria-label="Fermer">×</button></header><div id="tvpia-log"></div><form><input autocomplete="off" enterkeyhint="send"><button type="submit" aria-label="Envoyer">➤</button></form>';
    p.querySelector("b").textContent = TXT.titre; p.querySelector("small").textContent = TXT.sous;
    p.querySelector("input").placeholder = TXT.ph;
    document.body.appendChild(b); document.body.appendChild(p);
    el = { b: b, p: p, log: p.querySelector("#tvpia-log"), f: p.querySelector("form"), i: p.querySelector("input") };
    b.onclick = function () { p.classList.add("open"); b.style.display = "none"; if (!el.log.childNodes.length) bulle(TXT.bonjour, "ia"); el.i.focus(); };
    p.querySelector("header button").onclick = function () { p.classList.remove("open"); b.style.display = ""; };
    el.f.onsubmit = function (e) { e.preventDefault(); var t = el.i.value.trim(); if (!t || enCours) return; el.i.value = ""; envoyer(t); };
  }

  function bulle(t, qui) { var d = document.createElement("div"); d.className = "tvpia-m " + qui; d.textContent = t; el.log.appendChild(d); el.log.scrollTop = el.log.scrollHeight; return d; }

  // La clé Gemini reste cachée dans le script Google (Apps Script) : le site ne fait que lui transmettre la conversation.
  function appel() {
    return fetch(APPS, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "ia", systeme: SYSTEME, contents: histo.slice(-30) }) })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (j) { if (!j || !j.texte) throw new Error("vide"); return j.texte; });
  }

  function envoyer(t) {
    bulle(t, "cl"); histo.push({ role: "user", parts: [{ text: t }] });
    enCours = true; var att = bulle("…", "ia att");
    appel().then(function (rep) {
      att.remove(); histo.push({ role: "model", parts: [{ text: rep }] });
      var m = rep.match(/<resa>([\s\S]*?)<\/resa>/), resa = null;
      if (m) { try { resa = JSON.parse(m[1]); } catch (e) {} }
      var texte = rep.replace(/<resa>[\s\S]*?<\/resa>/g, "").trim();
      if (texte) bulle(texte, "ia");
      if (resa) carte(resa);
    }).catch(function () { att.remove(); bulle(TXT.err, "ia"); histo.pop(); })
      .then(function () { enCours = false; });
  }

  function carte(r) {
    var vh = String(r.vehicule || "").toLowerCase().indexOf("van") > -1 ? "Van Mercedes Classe V 🚐" : "Berline 🚗";
    var c = document.createElement("div"); c.className = "tvpia-card";
    var lignes = [["👤", r.nom], ["📞", r.tel], ["📍", r.dep], ["🏁", r.arr], ["📅", (r.date || "") + " · " + (r.heure || "")], ["👥", (r.pax || "") + " · " + vh], ["🪑", r.siege || "Aucune"], ["✈️", r.vol || ""], ["💰", r.prix || "À confirmer"]];
    var h = document.createElement("b"); h.textContent = TXT.recap; c.appendChild(h);
    lignes.forEach(function (l) { if (!l[1]) return; var d = document.createElement("div"); d.textContent = l[0] + " " + l[1]; c.appendChild(d); });
    var b = document.createElement("button"); b.type = "button"; b.textContent = TXT.ok; c.appendChild(b);
    el.log.appendChild(c); el.log.scrollTop = el.log.scrollHeight;
    b.onclick = function () {
      b.disabled = true;
      var resa = { nom: String(r.nom || ""), tel: String(r.tel || ""), dep: String(r.dep || ""), arr: String(r.arr || ""), vol: String(r.vol || "").toUpperCase(),
        vol_provenance: "", vol_arrivee: "", dep_zone: "", arr_zone: "", pax: String(r.pax || ""), vh: vh, vehicule: vh, siege: String(r.siege || "Aucune"),
        langue: lang, date: String(r.date || ""), heure: String(r.heure || ""), prix: String(r.prix || "À confirmer"),
        statut: "en attente", source: "site", date_creation: new Date().toISOString() };
      var note = "Réservation prise par l'assistant IA (nuit)" + (resa.prix === "À confirmer" ? " — prix à confirmer au client" : "");
      if (TEST) { bulle(TXT.okDone + "\n" + TXT.test, "ia"); return; }
      var fb = typeof window.enregistrerReservation === "function"
        ? Promise.resolve(window.enregistrerReservation(Object.assign({}, resa, { note: note }))).catch(function () { return Promise.resolve(window.enregistrerReservation(resa)).catch(function () {}); })
        : Promise.resolve();
      var d = resa.date;
      var alerte = fetch(APPS, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(Object.assign({ action: "site", email: "", note: note }, resa, { date: /^\d{4}-\d{2}-\d{2}$/.test(d) ? d.split("-").reverse().join("/") : d })) }).catch(function () {});
      Promise.race([Promise.all([fb, alerte]), new Promise(function (ok) { setTimeout(ok, 6000); })]).then(function () { bulle(TXT.okDone, "ia"); });
    };
  }

  function verifier() {
    var b = document.getElementById("tvpia-btn"), p = document.getElementById("tvpia");
    if (actif()) { if (!b) monter(); }
    else if (b && !(p && p.classList.contains("open"))) { b.remove(); if (p) p.remove(); }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", verifier); else verifier();
  setInterval(verifier, 60000);
})();
