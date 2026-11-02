/* Taxis Van Paris — « Réponse au client » dans la fenêtre Nouvelle réservation
 * Après « Coller un message » + « Remplir les champs » :
 *  1. calcule le prix avec la grille du site (vraie distance Google Maps),
 *  2. écrit la réponse dans la langue du client (FR, EN, ES, IT, AR),
 *  3. l'envoie sur WhatsApp directement dans la conversation du client (sans copier-coller).
 */
(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  if (!$("modal-reservation") || !$("btn-save-resa")) return;

  /* ---------- Bloc dans la fenêtre ---------- */
  const css = document.createElement("style");
  css.textContent = `
  .rc-box{border:1px solid var(--border);border-radius:12px;padding:12px;margin:4px 0 14px;display:grid;gap:10px;background:rgba(201,162,75,.07)}
  .rc-top{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
  .rc-top b{font-size:15px}
  .rc-langs{display:flex;gap:4px;flex-wrap:wrap}
  .rc-langs button{border:1px solid var(--border);background:transparent;color:inherit;border-radius:999px;padding:5px 10px;font-weight:600;font-size:12.5px;font-family:inherit;cursor:pointer}
  .rc-langs button[aria-pressed="true"]{background:var(--gold);border-color:var(--gold);color:#141008}
  .rc-prix{font-size:14px}.rc-prix strong{font-size:20px}
  .rc-msg{width:100%;box-sizing:border-box;min-height:190px;padding:10px 12px;border:1px solid var(--border);border-radius:10px;font-size:14px;line-height:1.45;font-family:inherit;background:transparent;color:inherit;resize:vertical}
  .rc-acts{display:flex;gap:8px;flex-wrap:wrap}
  .rc-acts .btn-gold,.rc-acts .btn-ghost{flex:1 1 140px;text-align:center}
  .rc-wa{background:#25D366!important;color:#0B2414!important;border:0;border-radius:10px;padding:11px 14px;font-weight:700;text-decoration:none;flex:1 1 180px;text-align:center}
  .rc-etat{font-size:12.5px;opacity:.75;margin:0}`;
  document.head.appendChild(css);

  const box = document.createElement("div");
  box.className = "rc-box";
  box.innerHTML = `
    <div class="rc-top"><b>💬 Réponse au client</b><div class="rc-langs" id="rc-langs"></div></div>
    <button type="button" class="btn-gold" id="rc-go">💶 Calculer le prix et écrire la réponse</button>
    <div class="rc-prix" id="rc-prix" hidden></div>
    <textarea class="rc-msg" id="rc-msg" hidden></textarea>
    <div class="rc-acts" id="rc-acts" hidden>
      <a class="rc-wa" id="rc-wa" target="_blank" rel="noopener">📲 Envoyer sur WhatsApp</a>
      <button type="button" class="btn-ghost" id="rc-copy">📋 Copier</button>
    </div>
    <p class="rc-etat" id="rc-etat"></p>`;
  const actions = $("btn-save-resa").closest(".modal-actions");
  actions.parentNode.insertBefore(box, actions);

  /* ---------- Langue du client ---------- */
  const LANGS = [["fr", "FR"], ["en", "EN"], ["es", "ES"], ["it", "IT"], ["ar", "ع"]];
  let lang = "en", langAuto = true;
  function detecter(t) {
    t = " " + String(t || "").toLowerCase() + " ";
    if (/[؀-ۿ]/.test(t)) return "ar";
    const sc = {
      fr: (t.match(/\b(bonjour|bonsoir|merci|je|nous|vous|une?|pour|aéroport|gare|valises?|demain|svp|s'il)\b/g) || []).length,
      en: (t.match(/\b(hello|hi|the|i|we|to|from|please|need|would|like|airport|suitcases?|tomorrow|thanks?|how much)\b/g) || []).length,
      es: (t.match(/\b(hola|gracias|quiero|necesito|para|somos|maletas?|aeropuerto|mañana|cuánto|por favor|buenas)\b|[¿¡]/g) || []).length,
      it: (t.match(/\b(ciao|buongiorno|buonasera|grazie|vorrei|siamo|valigie|aeroporto|domani|quanto|per favore|della)\b/g) || []).length
    };
    let best = "en", n = 0;
    Object.keys(sc).forEach(k => { if (sc[k] > n) { n = sc[k]; best = k; } });
    return best;
  }
  function dessinerLangs() {
    $("rc-langs").innerHTML = LANGS.map(([c, l]) => `<button type="button" data-l="${c}" aria-pressed="${c === lang}">${l}</button>`).join("");
    $("rc-langs").querySelectorAll("button").forEach(b => b.onclick = () => { lang = b.dataset.l; langAuto = false; dessinerLangs(); if (dernier) ecrire(); });
  }
  dessinerLangs();
  $("f-dictee").addEventListener("input", () => { if (langAuto) { lang = detecter($("f-dictee").value); dessinerLangs(); } });
  $("f-dictee").addEventListener("paste", () => setTimeout(() => { if (langAuto) { lang = detecter($("f-dictee").value); dessinerLangs(); } }, 60));

  /* ---------- Grille de prix (mêmes règles que le site) ---------- */
  const gps = (a, b, c, d) => { const r = Math.PI / 180, x = (c - a) * r, y = (d - b) * r, h = Math.sin(x / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(y / 2) ** 2; return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)); };
  const creuse = hs => { if (!hs) return false; const p = hs.split(":").map(Number), m = p[0] * 60 + p[1]; return m >= 1200 || m < 360 || (m >= 600 && m < 900); };
  const montantKm = (km, cr) => km <= 20 ? km * 2.9 : km <= 50 ? 58 + (km - 20) * (cr ? 2.2 : 2.4) : 58 + 30 * (cr ? 2.2 : 2.4) + (km - 50) * (cr ? 2.3 : 2.5);
  const VILLES = ["paris", "boulogne-billancourt", "issy-les-moulineaux", "neuilly-sur-seine", "levallois-perret", "clichy", "saint-ouen", "aubervilliers", "pantin", "pré-saint-gervais",
    "les lilas", "bagnolet", "montreuil", "vincennes", "charenton-le-pont", "saint-mandé", "malakoff", "montrouge", "ivry-sur-seine", "vitry-sur-seine"];
  const low = p => (p.address || "").toLowerCase();
  const villeForfait = p => p.dept === "75" || VILLES.some(v => low(p).indexOf(v) >= 0);
  const roissy = p => /cdg|charles de gaulle|roissy|9570[012]|mesnil.amelot/.test(low(p)) || gps(p.lat, p.lon, 49.0097, 2.5479) < 8;
  const orly = p => /orly|94390|94547/.test(low(p)) || gps(p.lat, p.lon, 48.7262, 2.3652) < 5;
  const beauvais = p => /beauvais|till[ée]|60000/.test(low(p)) || gps(p.lat, p.lon, 49.4544, 2.1128) < 6;
  const GARES = [[48.8809, 2.3553], [48.8449, 2.3735], [48.8408, 2.3205], [48.8760, 2.3245], [48.8765, 2.3590], [48.8426, 2.3655], [48.8402, 2.3793]];
  const gareParis = p => GARES.some(g => gps(p.lat, p.lon, g[0], g[1]) < 0.7) || /\bgare\b/.test(low(p));
  const zone = p => ["75", "92", "93", "94"].indexOf(p.dept) >= 0;

  function tarif(dep, arr, km, van, pax, heure, siege) {
    const cr = creuse(heure), supp = pax > 3 ? (pax - 3) * 5.5 : 0;
    let total = 15 + montantKm(km, cr) + supp, forfait = "", fGare = false;
    const dP = villeForfait(dep), aP = villeForfait(arr);
    if ((roissy(dep) && orly(arr)) || (orly(dep) && roissy(arr))) { total = van ? 109 : 80; forfait = "Roissy ⇄ Orly"; }
    else if (dP && roissy(arr)) { total = !van ? 75 : pax <= 5 ? 85 : 95; forfait = "Paris → CDG"; }
    else if (aP && roissy(dep)) { total = !van ? 85 : pax <= 5 ? 95 : 105; forfait = "CDG → Paris"; }
    else if (dP && orly(arr)) { total = !van ? 70 : pax <= 6 ? 80 : 95; forfait = "Paris → Orly"; }
    else if (aP && orly(dep)) { total = !van ? 80 : pax <= 6 ? 90 : 105; forfait = "Orly → Paris"; }
    else if (dP && beauvais(arr)) { total = !van ? 175 : pax <= 6 ? 188 : 205; forfait = "Paris → Beauvais"; }
    else if (aP && beauvais(dep)) { total = !van ? 185 : pax <= 6 ? 198 : 215; forfait = "Beauvais → Paris"; }
    else if ((dP && gareParis(arr)) || (aP && gareParis(dep)) || (gareParis(dep) && gareParis(arr))) { total = 50 + supp; forfait = "gare"; fGare = true; }
    if (!forfait && zone(dep) && zone(arr)) { const gv = van && pax >= 6, plafond = km < 29 ? (gv ? 95 : 85) : (gv ? 110 : 100); total = Math.min(total, plafond); }
    if (dep.dept === "75" && arr.dept === "75") total = Math.max(total, siege ? 60 : 50);
    if ((/cr[ée]teil|94000/.test(low(dep)) && orly(arr)) || (orly(dep) && /cr[ée]teil|94000/.test(low(arr)))) total = Math.max(total, 60);
    if (van && pax <= 4 && (!forfait || fGare)) total += 10;
    if (van) { const enParis = p => gareParis(p) || p.dept === "75"; if ((gareParis(dep) && !enParis(arr)) || (gareParis(arr) && !enParis(dep))) total = Math.max(total, 70); }
    return { prix: Math.round(total), forfait, km };
  }

  /* ---------- Google Maps : adresse → point, puis distance par la route ---------- */
  // Même méthode que le site (Places) : prédiction Google puis détails du lieu
  function pointDe(adr) {
    return new Promise((ok, ko) => {
      if (!window.google || !google.maps || !google.maps.places) return ko("maps");
      const ac = new google.maps.places.AutocompleteService(), pl = new google.maps.places.PlacesService(document.createElement("div"));
      ac.getPlacePredictions({ input: adr, language: "fr" }, (preds, st) => {
        if (st !== "OK" || !preds || !preds[0]) return ko("adresse");
        pl.getDetails({ placeId: preds[0].place_id, fields: ["geometry", "address_components"] }, (r, st2) => {
          if (st2 !== "OK" || !r || !r.geometry) return ko("adresse");
          const cp = (r.address_components || []).find(c => c.types.indexOf("postal_code") >= 0);
          const loc = (r.address_components || []).find(c => c.types.indexOf("locality") >= 0);
          const dept = cp ? cp.long_name.slice(0, 2) : (loc && loc.long_name.toLowerCase() === "paris" ? "75" : "");
          ok({ lat: r.geometry.location.lat(), lon: r.geometry.location.lng(), address: adr + ", " + preds[0].description, dept });
        });
      });
    });
  }
  function kmRoute(a, b) {
    return new Promise(ok => {
      try {
        new google.maps.DirectionsService().route({ origin: { lat: a.lat, lng: a.lon }, destination: { lat: b.lat, lng: b.lon }, travelMode: "DRIVING", region: "fr" },
          (res, st) => ok(st === "OK" && res.routes && res.routes[0] ? Math.max(1, Math.round(res.routes[0].legs[0].distance.value / 1000)) : Math.round(gps(a.lat, a.lon, b.lat, b.lon) * 1.35)));
      } catch (e) { ok(Math.round(gps(a.lat, a.lon, b.lat, b.lon) * 1.35)); }
    });
  }

  /* ---------- Textes de la réponse ---------- */
  const T = {
    fr: { hi: "Bonjour et merci pour votre message 😊", ok: "Oui, c'est disponible ✅", veh: { Van: "Van Mercedes Classe V", Berline: "Berline" }, pax: n => n + " passager" + (n > 1 ? "s" : ""), bag: n => n + " valise" + (n > 1 ? "s" : ""),
      at: "à", price: (p, f) => `💶 Prix : *${p} € tout compris*${f ? " (forfait, prix fixe)" : ""}, sans surprise avec les bouchons.`, seat: "👶 Siège bébé / rehausseur offert et installé.",
      flight: v => `✈️ Vol ${v} : on suit votre vol et on vous attend aux arrivées avec une pancarte à votre nom.`, pay: "Paiement à bord par carte (Visa, Mastercard, Amex, Apple Pay, Google Pay) ou en espèces.",
      ask: "Je vous confirme la réservation ?", miss: "Pour vous donner le prix exact, pouvez-vous m'indiquer :", need: { dep: "📍 l'adresse de départ", arr: "🏁 la destination", date: "📅 la date et l'heure" }, loc: "fr-FR" },
    en: { hi: "Hello and thank you for your message 😊", ok: "Yes, this is available ✅", veh: { Van: "Mercedes V-Class van", Berline: "Sedan" }, pax: n => n + " passenger" + (n > 1 ? "s" : ""), bag: n => n + " suitcase" + (n > 1 ? "s" : ""),
      at: "at", price: (p, f) => `💶 Price: *${p} € all included*${f ? " (fixed fare)" : ""}, no surprise with traffic.`, seat: "👶 Baby seat / booster free of charge and installed.",
      flight: v => `✈️ Flight ${v}: we track your flight and wait for you at arrivals with a name sign.`, pay: "Payment on board by card (Visa, Mastercard, Amex, Apple Pay, Google Pay) or cash.",
      ask: "Shall I confirm the booking for you?", miss: "To give you the exact price, could you tell me:", need: { dep: "📍 the pick-up address", arr: "🏁 the destination", date: "📅 the date and time" }, loc: "en-GB" },
    es: { hi: "¡Hola y gracias por su mensaje! 😊", ok: "Sí, está disponible ✅", veh: { Van: "Van Mercedes Clase V", Berline: "Berlina" }, pax: n => n + " pasajero" + (n > 1 ? "s" : ""), bag: n => n + " maleta" + (n > 1 ? "s" : ""),
      at: "a las", price: (p, f) => `💶 Precio: *${p} € todo incluido*${f ? " (tarifa fija)" : ""}, sin sorpresas con el tráfico.`, seat: "👶 Silla de bebé / elevador gratis e instalado.",
      flight: v => `✈️ Vuelo ${v}: seguimos su vuelo y le esperamos en llegadas con un cartel con su nombre.`, pay: "Pago a bordo con tarjeta (Visa, Mastercard, Amex, Apple Pay, Google Pay) o en efectivo.",
      ask: "¿Le confirmo la reserva?", miss: "Para darle el precio exacto, ¿podría indicarme:", need: { dep: "📍 la dirección de recogida", arr: "🏁 el destino", date: "📅 la fecha y la hora" }, loc: "es-ES" },
    it: { hi: "Buongiorno e grazie per il messaggio 😊", ok: "Sì, è disponibile ✅", veh: { Van: "Van Mercedes Classe V", Berline: "Berlina" }, pax: n => n + (n > 1 ? " passeggeri" : " passeggero"), bag: n => n + (n > 1 ? " valigie" : " valigia"),
      at: "alle", price: (p, f) => `💶 Prezzo: *${p} € tutto incluso*${f ? " (tariffa fissa)" : ""}, nessuna sorpresa con il traffico.`, seat: "👶 Seggiolino / rialzo gratis e montato.",
      flight: v => `✈️ Volo ${v}: seguiamo il suo volo e la aspettiamo agli arrivi con un cartello con il suo nome.`, pay: "Pagamento a bordo con carta (Visa, Mastercard, Amex, Apple Pay, Google Pay) o contanti.",
      ask: "Le confermo la prenotazione?", miss: "Per darle il prezzo esatto, può indicarmi:", need: { dep: "📍 l'indirizzo di partenza", arr: "🏁 la destinazione", date: "📅 data e ora" }, loc: "it-IT" },
    ar: { hi: "مرحباً وشكراً على رسالتك 😊", ok: "نعم، متاح ✅", veh: { Van: "فان مرسيدس V-Class", Berline: "سيارة سيدان" }, pax: n => n + " ركاب", bag: n => n + " حقائب",
      at: "الساعة", price: (p, f) => `💶 السعر: *${p} يورو شامل كل شيء*${f ? " (سعر ثابت)" : ""}، بدون مفاجآت بسبب الزحام.`, seat: "👶 مقعد رضيع / مقعد معزز مجاناً ومركّب.",
      flight: v => `✈️ الرحلة ${v}: نتابع رحلتك وننتظرك في صالة الوصول مع لافتة باسمك.`, pay: "الدفع في السيارة بالبطاقة (Visa، Mastercard، Amex، Apple Pay، Google Pay) أو نقداً.",
      ask: "هل أؤكد لك الحجز؟", miss: "لإعطائك السعر الدقيق، هل يمكنك إخباري بـ:", need: { dep: "📍 عنوان الانطلاق", arr: "🏁 الوجهة", date: "📅 التاريخ والوقت" }, loc: "ar-u-nu-latn" }
  };
  const court = s => String(s || "").replace(/,\s*(France|Francia|Frankreich)$/i, "").trim();
  let dernier = null;

  function ecrire() {
    const t = T[lang] || T.en, d = dernier, L = [t.hi, ""];
    const dep = $("f-dep").value.trim(), arr = $("f-arr").value.trim(), date = $("f-date").value, heure = $("f-heure").value;
    const manque = [!dep && "dep", !arr && "arr", !(date && heure) && "date"].filter(Boolean);
    if (!d || manque.length) {
      L.push(t.miss); manque.forEach(m => L.push(t.need[m])); if (!manque.length) L.push(t.need.dep);
    } else {
      L.push(t.ok, "");
      L.push("📍 " + court(dep), "🏁 " + court(arr));
      if (date) { const dt = new Date(date + "T" + (heure || "12:00")); L.push("📅 " + dt.toLocaleDateString(t.loc, { weekday: "long", day: "numeric", month: "long" }) + (heure ? " " + t.at + " " + heure : "")); }
      const pax = +$("f-pax").value || 1, bag = +$("f-bag").value || 0;
      L.push("👨‍👩‍👧 " + t.pax(pax) + (bag ? " · 🧳 " + t.bag(bag) : ""));
      L.push("🚐 " + (t.veh[$("f-vh").value] || $("f-vh").value));
      if (siegeDemande()) L.push(t.seat);
      const vol = $("f-vol").value.trim(); if (vol) L.push(t.flight(vol.toUpperCase()));
      L.push("", t.price($("f-prix").value || d.prix, !!d.forfait), t.pay, "", t.ask);
    }
    L.push("", "Badr – Taxis Van Paris");
    $("rc-msg").value = L.join("\n");
    majLiens();
  }
  function siegeDemande() {
    return /b[ée]b[ée]|baby|infant|toddler|siège|siege|rehausseur|booster|car ?seat|silla|seggiolino|rialzo|كرسي|مقعد/i.test($("f-dictee").value + " " + $("f-note").value);
  }
  function telWa() {
    let t = String($("f-tel").value || "").replace(/[^\d+]/g, "");
    if (!t) return "";
    if (t.startsWith("+")) t = t.slice(1); else if (t.startsWith("00")) t = t.slice(2); else if (/^0\d{9}$/.test(t)) t = "33" + t.slice(1);
    return t.length >= 8 ? t : "";
  }
  function majLiens() {
    const tel = telWa(), txt = encodeURIComponent($("rc-msg").value);
    $("rc-wa").href = "https://wa.me/" + tel + "?text=" + txt;
    $("rc-wa").textContent = tel ? "📲 Envoyer sur WhatsApp au client" : "📲 Envoyer sur WhatsApp (choisir le client)";
  }
  $("rc-msg").addEventListener("input", majLiens);
  ["f-tel", "f-prix", "f-vh", "f-pax", "f-bag", "f-vol", "f-date", "f-heure"].forEach(id => $(id) && $(id).addEventListener("change", () => { if (dernier) ecrire(); }));

  $("rc-copy").onclick = () => {
    const v = $("rc-msg").value, b = $("rc-copy");
    (navigator.clipboard ? navigator.clipboard.writeText(v) : Promise.reject()).then(() => { b.textContent = "Copié ✓"; setTimeout(() => b.textContent = "📋 Copier", 1500); },
      () => { $("rc-msg").select(); });
  };

  $("rc-go").onclick = async () => {
    const dep = $("f-dep").value.trim(), arr = $("f-arr").value.trim();
    $("rc-etat").textContent = "";
    if (langAuto) { lang = detecter($("f-dictee").value); dessinerLangs(); }
    if (!dep || !arr) { dernier = { prix: "" }; ecrire(); show(); $("rc-prix").hidden = true; $("rc-etat").textContent = "Départ ou arrivée manquant : la réponse demande l'info au client."; return; }
    $("rc-go").disabled = true; $("rc-go").textContent = "⏳ Calcul du prix…";
    try {
      const [a, b] = await Promise.all([pointDe(dep), pointDe(arr)]);
      const km = await kmRoute(a, b);
      const pax = +$("f-pax").value || 1;
      if (pax > 4 && $("f-vh").value !== "Van") $("f-vh").value = "Van";
      const r = tarif(a, b, km, $("f-vh").value === "Van", pax, $("f-heure").value, siegeDemande());
      dernier = r;
      $("f-prix").value = r.prix;
      $("rc-prix").innerHTML = `Prix : <strong>${r.prix} €</strong> · ${$("f-vh").value} · ${r.forfait ? "forfait " + r.forfait : r.km + " km" + ($("f-heure").value ? (creuse($("f-heure").value) ? " · heure creuse" : " · heure pleine") : " · heure non précisée")}<br><small>Tu peux changer le prix dans « Prix (€) » : la réponse se met à jour.</small>`;
      $("rc-prix").hidden = false;
      ecrire(); show();
    } catch (e) {
      $("rc-etat").textContent = e === "adresse" ? "Adresse introuvable : précise le départ ou l'arrivée (rue, ville), puis recommence." : "Google Maps pas encore chargé, réessaie dans 2 secondes.";
    } finally { $("rc-go").disabled = false; $("rc-go").textContent = "💶 Recalculer le prix et la réponse"; }
  };
  function show() { $("rc-msg").hidden = false; $("rc-acts").hidden = false; }

  // Fenêtre rouverte : on repart de zéro
  new MutationObserver(() => {
    const ouverte = getComputedStyle($("modal-reservation")).display !== "none";
    if (ouverte && !box.dataset.ouvert) { box.dataset.ouvert = "1"; dernier = null; langAuto = true; $("rc-msg").hidden = $("rc-acts").hidden = $("rc-prix").hidden = true; $("rc-etat").textContent = ""; $("rc-go").textContent = "💶 Calculer le prix et écrire la réponse"; }
    if (!ouverte) delete box.dataset.ouvert;
  }).observe($("modal-reservation"), { attributes: true, attributeFilter: ["class", "style"] });
})();
