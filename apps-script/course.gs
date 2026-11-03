// ================================================================
// « Ma course » : page client (lien envoyé par WhatsApp) avec chat traduit.
// Le client (connexion anonyme Firebase) demande la traduction de son message ;
// on vérifie que son lien est actif, on traduit (gratuit, LanguageApp)
// et on envoie une notification sur le téléphone de Badr et sur celui du chauffeur.
// Route à ajouter dans Code.gs :  if (d.action === 'course') return json(courseClient(d));
// ================================================================

function courseClient(d) {
  var code = String(d.code || '').replace(/[^a-z0-9]/g, '').slice(0, 30);
  var idToken = String(d.idToken || '');
  if (!code || idToken.split('.').length !== 3) return { ok: false, error: 'acces_refuse' };

  // 1) Le lien existe, est actif et pas expiré (lu avec le jeton du client : les règles Firebase s'appliquent)
  var cache = CacheService.getScriptCache(), cle = 'mc_ok_' + code;
  if (cache.get(cle) !== '1') {
    var r = UrlFetchApp.fetch('https://firestore.googleapis.com/v1/projects/taxis-van-paris-by-abts/databases/(default)/documents/trad_codes/' + code,
      { headers: { Authorization: 'Bearer ' + idToken }, muteHttpExceptions: true });
    if (r.getResponseCode() !== 200) return { ok: false, error: 'lien_inconnu' };
    var f = JSON.parse(r.getContentText()).fields || {};
    var actif = f.actif && f.actif.booleanValue === true;
    var exp = f.exp && f.exp.timestampValue ? new Date(f.exp.timestampValue).getTime() : 0;
    if (!actif || exp < Date.now()) return { ok: false, error: 'lien_expire' };
    cache.put(cle, '1', 600);
  }

  // 2) Limite anti-abus : 60 demandes par heure et par lien
  var cpt = Number(cache.get('mc_n_' + code) || 0) + 1;
  if (cpt > 60) return { ok: false, error: 'trop_de_messages' };
  cache.put('mc_n_' + code, String(cpt), 3600);

  // Le chauffeur active les notifications sur son téléphone (fichier notifs)
  if (d.op === 'tok') return chauffeurToken_(code, d);

  // 3) Traduction
  var lang = /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/;
  var de = String(d.de || ''), vers = String(d.vers || 'fr');
  if (!lang.test(vers)) return { ok: false, error: 'langue_invalide' };
  if (!lang.test(de)) de = '';
  var textes = (Array.isArray(d.textes) ? d.textes : []).slice(0, 4).map(function (t) { return String(t || '').slice(0, 800); });
  var sorties = textes.map(function (t) {
    if (!t.trim()) return '';
    if (de && de.split('-')[0] === vers.split('-')[0]) return t;
    try { return LanguageApp.translate(t, de, vers); } catch (e) { return ''; }
  });

  // 4) Notification sur le téléphone de Badr (message du client)
  if (d.push === true && sorties[0]) {
    var nom = String(d.nom || '').replace(/[<>]/g, '').slice(0, 40);
    try { coursePush_('💬 ' + (nom || 'Client') + ' (Ma course)', sorties[0], code); } catch (e) {}
    try { pushChauffeur_(code, '💬 ' + (nom || 'Client') + ' vous écrit', sorties[0]); } catch (e) {}
  }
  return { ok: true, traductions: sorties };
}

// Même envoi que envoyerPush (fichier push), mais la notification ouvre la conversation du client.
function coursePush_(titre, texte, code) {
  var l = pushTokens_(); if (!l.length) return;
  var jeton = fcmJeton_();
  var url = 'https://taxisvanparis.fr/dashboard/?conv=' + code;
  l.forEach(function (x) {
    UrlFetchApp.fetch('https://fcm.googleapis.com/v1/projects/' + PUSH_PROJET + '/messages:send', {
      method: 'post', contentType: 'application/json', headers: { Authorization: 'Bearer ' + jeton }, muteHttpExceptions: true,
      payload: JSON.stringify({ message: { token: x.t,
        data: { title: String(titre).slice(0, 80), body: String(texte).slice(0, 300), tag: 'conv-' + code, url: url },
        webpush: { headers: { Urgency: 'high', TTL: '86400' } } } })
    });
  });
}
