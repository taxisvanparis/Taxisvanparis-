// ================================================================
// Messages « Ma course » non lus : prévenir le chauffeur et le client (gratuit)
// À coller dans le MÊME projet Apps Script que course.gs et push.gs.
//
// 1) Chauffeur : quand le client écrit, notification sur le téléphone du chauffeur
//    (il l'active une fois depuis son lien chauffeur).
// 2) Client : si un message du chauffeur (ou de Badr) n'est pas lu au bout de 5 min,
//    - un SMS part tout seul depuis l'iPhone de Badr (via un e-mail « TVP-SMS » + raccourci iPhone),
//    - un e-mail est envoyé au client si son adresse est dans la réservation.
// 3) Badr : toujours pas lu au bout de 10 min → notification « ⚠️ Le client n'a pas lu ».
//
// ▶ Une seule fois : sélectionnez « installerNonLus » puis « Exécuter ».
// ▶ Test du SMS : « testerSMS » (envoie un SMS d'essai sur ton propre numéro).
// ================================================================
var NL_SITE = 'https://taxisvanparis.fr';
var NL_SMS_MIN = 5;          // minutes avant SMS / e-mail au client
var NL_BADR_MIN = 10;        // minutes avant l'alerte à Badr
var NL_TEST_NUM = '+33649553640';

// ---------- Firestore (lecture avec le compte de service FCM_SA) ----------
function nlJeton_() {
  var cache = CacheService.getScriptCache(), c = cache.get('nl_jeton');
  if (c) return c;
  var sa = JSON.parse(PropertiesService.getScriptProperties().getProperty('FCM_SA') || '{}');
  if (!sa.client_email || !sa.private_key) throw new Error('FCM_SA manquant');
  var b64 = function (s) { return Utilities.base64EncodeWebSafe(s).replace(/=+$/, ''); };
  var now = Math.floor(Date.now() / 1000);
  var entete = b64(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  var corps = b64(JSON.stringify({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/datastore', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }));
  var sig = Utilities.base64EncodeWebSafe(Utilities.computeRsaSha256Signature(entete + '.' + corps, sa.private_key)).replace(/=+$/, '');
  var r = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', { method: 'post', muteHttpExceptions: true,
    payload: { grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: entete + '.' + corps + '.' + sig } });
  var j = JSON.parse(r.getContentText());
  if (!j.access_token) throw new Error('OAuth Firestore : ' + r.getContentText().slice(0, 200));
  cache.put('nl_jeton', j.access_token, 3000);
  return j.access_token;
}
var NL_BASE = 'https://firestore.googleapis.com/v1/projects/taxis-van-paris-by-abts/databases/(default)/documents';
function nlVal_(f) {
  if (!f) return null;
  if (f.stringValue !== undefined) return f.stringValue;
  if (f.integerValue !== undefined) return Number(f.integerValue);
  if (f.doubleValue !== undefined) return f.doubleValue;
  if (f.booleanValue !== undefined) return f.booleanValue;
  if (f.timestampValue !== undefined) return new Date(f.timestampValue).getTime();
  if (f.mapValue !== undefined) return nlObj_(f.mapValue.fields || {});
  return null;
}
function nlObj_(fields) { var o = {}; Object.keys(fields || {}).forEach(function (k) { o[k] = nlVal_(fields[k]); }); return o; }
function nlGet_(chemin) {
  var r = UrlFetchApp.fetch(NL_BASE + '/' + chemin, { headers: { Authorization: 'Bearer ' + nlJeton_() }, muteHttpExceptions: true });
  if (r.getResponseCode() !== 200) return null;
  return nlObj_(JSON.parse(r.getContentText()).fields);
}
function nlQuery_(parent, q) {
  var r = UrlFetchApp.fetch(NL_BASE + (parent ? '/' + parent : '') + ':runQuery', { method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: { Authorization: 'Bearer ' + nlJeton_() }, payload: JSON.stringify({ structuredQuery: q }) });
  if (r.getResponseCode() !== 200) throw new Error('Firestore ' + r.getResponseCode() + ' ' + r.getContentText().slice(0, 200));
  return JSON.parse(r.getContentText()).filter(function (x) { return x.document; }).map(function (x) {
    var o = nlObj_(x.document.fields); o._id = x.document.name.split('/').pop(); return o;
  });
}
function nlEgal_(champ, valeur) {
  var v = typeof valeur === 'boolean' ? { booleanValue: valeur } : { stringValue: String(valeur) };
  return { fieldFilter: { field: { fieldPath: champ }, op: 'EQUAL', value: v } };
}

// ---------- 1) Notifications du chauffeur ----------
function nlNorm_(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase(); }
function chTokens_() { try { return JSON.parse(PropertiesService.getScriptProperties().getProperty('CH_TOKENS') || '[]'); } catch (e) { return []; } }
function chSauver_(l) { PropertiesService.getScriptProperties().setProperty('CH_TOKENS', JSON.stringify(l.slice(-40))); }

// Appelé par la page chauffeur (action « course », op « tok ») : garde le téléphone du chauffeur
function chauffeurToken_(code, d) {
  var token = String(d.token || '');
  if (token.length < 20) return { ok: false, error: 'jeton_invalide' };
  var info = nlGet_('trad_g/' + code) || {};
  var prenom = nlNorm_((info.chauffeur || {}).prenom || d.prenom);
  if (!prenom) return { ok: false, error: 'prenom_chauffeur_manquant' };
  var lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    var l = chTokens_().filter(function (x) { return x.t !== token; });
    l.push({ t: token, prenom: prenom, appareil: String(d.appareil || '').slice(0, 20), le: new Date().toISOString() });
    chSauver_(l);
  } finally { lock.releaseLock(); }
  return { ok: true };
}

// Envoie la notification aux téléphones du chauffeur de cette course (d'après son prénom)
function pushChauffeur_(code, titre, texte) {
  var info = nlGet_('trad_g/' + code) || {};
  var prenom = nlNorm_((info.chauffeur || {}).prenom);
  if (!prenom) return 0;
  var l = chTokens_(), cibles = l.filter(function (x) { return x.prenom === prenom; });
  if (!cibles.length) return 0;
  var jeton = fcmJeton_(), morts = [], n = 0;
  cibles.forEach(function (x) {
    var r = UrlFetchApp.fetch('https://fcm.googleapis.com/v1/projects/' + PUSH_PROJET + '/messages:send', {
      method: 'post', contentType: 'application/json', headers: { Authorization: 'Bearer ' + jeton }, muteHttpExceptions: true,
      payload: JSON.stringify({ message: { token: x.t,
        data: { title: String(titre).slice(0, 80), body: String(texte).slice(0, 300), tag: 'conv-' + code, url: NL_SITE + '/ma-course/?c=' + code + '&d=1' },
        webpush: { headers: { Urgency: 'high', TTL: '86400' } } } })
    });
    if (r.getResponseCode() === 200) n++;
    else if (r.getResponseCode() === 404 || /UNREGISTERED/.test(r.getContentText())) morts.push(x.t);
  });
  if (morts.length) chSauver_(l.filter(function (x) { return morts.indexOf(x.t) < 0; }));
  return n;
}

// ---------- 2) et 3) Messages non lus par le client ----------
function nlTel_(t) {
  var s = String(t || '').replace(/[^\d+]/g, '');
  if (/^00/.test(s)) s = '+' + s.slice(2);
  if (/^0\d{9}$/.test(s)) s = '+33' + s.slice(1);
  return /^\+\d{8,15}$/.test(s) ? s : '';
}
function nlLangue_(c) { c = String(c || '').trim(); if (!c) return ''; return /^zh/i.test(c) ? 'zh-CN' : c.split('-')[0].toLowerCase(); }
function nlTraduire_(t, vers) { if (!vers || vers === 'fr') return t; try { return LanguageApp.translate(t, 'fr', vers) || t; } catch (e) { return t; } }

// SMS : Badr reçoit un e-mail « TVP-SMS », le raccourci de son iPhone envoie le SMS tout seul
function envoyerSMSviaIphone_(num, texte) {
  MailApp.sendEmail(Session.getEffectiveUser().getEmail(), 'TVP-SMS ' + num, 'NUM:' + num + '\nMSG:' + texte);
}

function emailClient_(email, lang, lien) {
  var sujet = nlTraduire_('Votre chauffeur vous a écrit – Taxis Van Paris', lang);
  var corps = nlTraduire_('Bonjour, votre chauffeur vous a envoyé un message au sujet de votre course. Ouvrez votre page pour le lire et lui répondre dans votre langue.', lang);
  var bouton = nlTraduire_('Lire le message', lang);
  var html = '<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;background:#0b0a08;color:#f7f3ea;border-radius:16px">' +
    '<div style="font-size:20px;font-weight:800;margin-bottom:12px">Taxis <span style="color:#d4b25e">Van</span> Paris</div>' +
    '<p style="font-size:16px;line-height:1.5">' + corps + '</p>' +
    '<p style="text-align:center;margin:24px 0"><a href="' + lien + '" style="background:#d4b25e;color:#141008;padding:14px 26px;border-radius:12px;font-weight:800;text-decoration:none;display:inline-block">💬 ' + bouton + '</a></p></div>';
  MailApp.sendEmail({ to: email, subject: '💬 ' + sujet, htmlBody: html, body: corps + '\n' + lien, name: 'Taxis Van Paris' });
}

// ▶ Lancée automatiquement toutes les 5 minutes
function verifierNonLus() {
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('FCM_SA')) return;
  var faits = {}; try { faits = JSON.parse(props.getProperty('NL_FAITS') || '{}'); } catch (e) {}
  var maintenant = Date.now(), journal = [];
  var liens = nlQuery_('', { from: [{ collectionId: 'trad_codes' }], where: nlEgal_('actif', true) });
  liens.forEach(function (lien) {
    try {
      var code = lien._id;
      if (lien.exp && lien.exp < maintenant) return;
      var g = nlGet_('trad_g/' + code) || {};
      if (g.type !== 'course') return;                                   // seulement les liens « Ma course »
      var msgs = nlQuery_('trad_g/' + code, { from: [{ collectionId: 'msgs' }], orderBy: [{ field: { fieldPath: 't' }, direction: 'DESCENDING' }], limit: 15 });
      var dernier = msgs.filter(function (m) { return !m.type; })[0];
      if (!dernier || dernier.de === 'client' || !dernier.t) return;      // le client a écrit en dernier : il suit la conversation
      if (g.vu_client && g.vu_client >= dernier.t) return;               // déjà lu
      var age = (maintenant - dernier.t) / 60000;
      if (age > 180) return;
      var cle = code + '_' + dernier._id, etape = faits[cle] ? faits[cle].e : 0;

      if (age >= NL_SMS_MIN && etape < 1) {
        var resa = nlQuery_('', { from: [{ collectionId: 'reservations' }], where: nlEgal_('lienCourse', code), limit: 1 })[0] || {};
        var dc = msgs.filter(function (m) { return m.de === 'client' && m.langue; })[0];
        var lang = nlLangue_((dc && dc.langue) || g.langue || resa.langue || 'en');
        var url = NL_SITE + '/ma-course/?c=' + code;
        var num = nlTel_(resa.tel), mail = String(resa.email || resa.mail || '').trim(), fait = [];
        if (num) {
          envoyerSMSviaIphone_(num, 'Taxis Van Paris : ' + nlTraduire_('votre chauffeur vous a envoyé un message. Lisez-le et répondez ici :', lang) + ' ' + url);
          fait.push('SMS');
        }
        if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) { emailClient_(mail, lang, url); fait.push('e-mail'); }
        faits[cle] = { e: 1, f: fait.join(' + '), le: maintenant };
        journal.push(code + ' : ' + (fait.join(' + ') || 'ni numéro ni e-mail'));
      }
      if (age >= NL_BADR_MIN && etape < 2) {
        var f = (faits[cle] && faits[cle].f) || '';
        coursePush_('⚠️ Le client n\'a pas lu', 'Message du chauffeur non lu depuis ' + Math.round(age) + ' min' + (f ? ' · ' + f + ' envoyé' : '') + '. Touchez pour ouvrir la conversation.', code);
        faits[cle] = { e: 2, f: f, le: (faits[cle] && faits[cle].le) || maintenant };
      }
    } catch (e) { journal.push('Erreur ' + lien._id + ' : ' + e); }
  });
  Object.keys(faits).forEach(function (k) { if (maintenant - (faits[k].le || 0) > 2 * 86400000) delete faits[k]; });
  props.setProperty('NL_FAITS', JSON.stringify(faits));
  if (journal.length) console.log(journal.join('\n'));
}

// ▶ À lancer UNE fois : vérification toutes les 5 minutes
function installerNonLus() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'verifierNonLus') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('verifierNonLus').timeBased().everyMinutes(5).create();
  console.log('Installé. Liens actifs : ' + nlQuery_('', { from: [{ collectionId: 'trad_codes' }], where: nlEgal_('actif', true) }).length);
}

// ▶ Test : un e-mail « TVP-SMS » part vers ta boîte ; si le raccourci iPhone est prêt, tu reçois le SMS
function testerSMS() {
  envoyerSMSviaIphone_(NL_TEST_NUM, 'Taxis Van Paris : test du SMS automatique ✅');
  console.log('E-mail TVP-SMS envoyé à ' + Session.getEffectiveUser().getEmail());
}
