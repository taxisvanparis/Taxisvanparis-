// ================================================================
// Alerte qui insiste : réservation NON confirmée → SMS + notification toutes les 10 min
// À coller dans le MÊME projet Apps Script que notifs.gs et push.gs
// (il réutilise nlQuery_, nlEgal_, envoyerSMSviaIphone_ et envoyerPush).
//
// Toutes les 5 minutes, le script regarde les réservations « en attente ».
// Si l'une d'elles n'est pas confirmée 10 min après sa création :
//   - notification sur le téléphone de Badr (tableau de bord),
//   - SMS sur le téléphone de l'associé (envoyé tout seul par l'iPhone de Badr, raccourci TVP-SMS),
// puis de nouveau toutes les 10 min, jusqu'à ce que la réservation soit confirmée,
// ou que l'heure de la course soit passée.
//
// ▶ Une seule fois : sélectionnez « installerAlertesResa » puis « Exécuter ».
// ▶ Test : « testerAlerteResa » (envoie l'alerte d'essai).
// ================================================================
var AR_PREMIERE_MIN = 10;          // 1re alerte : 10 min après la réservation
var AR_REPETER_MIN = 10;           // puis toutes les 10 min
var AR_SMS = ['+33667402005'];     // téléphones qui reçoivent le SMS (associé). Ajouter d'autres numéros ici.

function ar_ms_(v) {
  if (!v) return 0;
  if (typeof v === 'number') return v;
  var t = Date.parse(v); return isNaN(t) ? 0 : t;
}
function ar_course_ms_(r) {
  var m = String(r.heure || '').match(/(\d{1,2})[:h](\d{2})/), d = String(r.date || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) { var x = d.match(/^(\d{2})\/(\d{2})\/(\d{4})$/); if (x) d = x[3] + '-' + x[2] + '-' + x[1]; else return 0; }
  if (!m) return 0;
  return Utilities.parseDate(d + ' ' + ('0' + m[1]).slice(-2) + ':' + m[2], 'Europe/Paris', 'yyyy-MM-dd HH:mm').getTime();
}

// ▶ Lancée automatiquement toutes les 5 minutes
function alertesResa() {
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('FCM_SA')) return;
  var faits = {}; try { faits = JSON.parse(props.getProperty('AR_FAITS') || '{}'); } catch (e) {}
  var maintenant = Date.now(), journal = [];
  var liste = nlQuery_('', { from: [{ collectionId: 'reservations' }], where: nlEgal_('statut', 'en attente'), limit: 50 });
  liste.forEach(function (r) {
    var cree = ar_ms_(r.date_creation) || ar_ms_(r.cree) || ar_ms_(r.t);
    if (!cree || maintenant - cree > 24 * 3600000) return;              // réservations des dernières 24 h seulement
    var age = Math.floor((maintenant - cree) / 60000);
    if (age < AR_PREMIERE_MIN) return;
    var course = ar_course_ms_(r);
    if (course && maintenant > course + 30 * 60000) return;             // course passée depuis 30 min : on arrête
    var dernier = faits[r._id] || 0;
    if (dernier && maintenant - dernier < (AR_REPETER_MIN * 60000 - 30000)) return;
    var court = function (s) { return String(s || '?').replace(/,\s*France$/, '').slice(0, 50); };
    var quand = (r.date || '') + ' ' + (r.heure || '');
    var dans = course ? Math.round((course - maintenant) / 60000) : null;
    var urg = dans !== null && dans < 120 ? ' ⚡ course dans ' + Math.max(0, dans) + ' min' : '';
    var texte = 'Réservation NON confirmée depuis ' + age + ' min' + urg + '\n' +
      (r.nom || 'Client') + (r.tel ? ' · ' + r.tel : '') + '\n' + quand + '\n' + court(r.dep) + ' → ' + court(r.arr) +
      (r.prix ? '\n' + r.prix + ' €' : '') + '\nConfirme-la dans le tableau de bord.';
    try { envoyerPush('🚨 Réservation non confirmée (' + age + ' min)', texte, 'attente-' + r._id); } catch (e) { journal.push('push ' + e); }
    AR_SMS.forEach(function (n) { try { envoyerSMSviaIphone_(n, '🚨 Taxis Van Paris : ' + texte.replace(/\n/g, ' · ')); } catch (e) { journal.push('sms ' + e); } });
    faits[r._id] = maintenant;
    journal.push(r._id + ' : alerte envoyée (' + age + ' min)');
  });
  Object.keys(faits).forEach(function (k) { if (maintenant - faits[k] > 2 * 86400000) delete faits[k]; });
  props.setProperty('AR_FAITS', JSON.stringify(faits));
  if (journal.length) console.log(journal.join('\n'));
}

// ▶ À lancer UNE fois
function installerAlertesResa() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'alertesResa') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('alertesResa').timeBased().everyMinutes(5).create();
  console.log('Alertes installées. Réservations en attente : ' + nlQuery_('', { from: [{ collectionId: 'reservations' }], where: nlEgal_('statut', 'en attente'), limit: 50 }).length);
}

// ▶ Test
function testerAlerteResa() {
  var t = 'Réservation NON confirmée depuis 10 min (TEST)\nClient 1\n08/11 10:00\nParis → CDG\n75 €';
  envoyerPush('🚨 Réservation non confirmée (test)', t, 'attente-test');
  AR_SMS.forEach(function (n) { envoyerSMSviaIphone_(n, '🚨 Taxis Van Paris : ' + t.replace(/\n/g, ' · ')); });
  console.log('Test envoyé : notification + SMS vers ' + AR_SMS.join(', '));
}
