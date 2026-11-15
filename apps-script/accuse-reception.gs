// ================================================================
// Accusé de réception par SMS : dès qu'un client réserve sur le site,
// il reçoit un SMS « Demande reçue ✅ » dans sa langue (envoyé par l'iPhone de Badr, raccourci TVP-SMS).
// L'e-mail au client part déjà tout seul (Code.gs) ; le bouton WhatsApp est sur la page « Merci » du site.
// À coller dans le MÊME projet Apps Script que notifs.gs (il réutilise nlQuery_, nlEgal_, nlTel_, nlTraduire_, envoyerSMSviaIphone_).
//
// ▶ Une seule fois : sélectionnez « installerAccuseReception » puis « Exécuter ».
// ▶ Test : « testerAccuseReception » (SMS d'essai vers le numéro de AR_TEST).
// ================================================================
var AR_SMS_ETRANGER = false;           // false = SMS seulement aux numéros français (+33) : l'étranger peut coûter sur ton forfait
var AR_TEST = '+33667402005';

function arTexte_(r) {
  var d = String(r.date || ''), m = d.match(/^(\d{4})-(\d{2})-(\d{2})$/); if (m) d = m[3] + '/' + m[2];
  var court = function (s) { return String(s || '').replace(/,\s*France$/, '').slice(0, 45); };
  var fr = 'Taxis Van Paris : demande reçue ✅\n' + (d ? d + ' ' : '') + String(r.heure || '') + ' · ' + court(r.dep) + ' → ' + court(r.arr) +
    '\nNous vous confirmons très vite le chauffeur.\nUne question ? WhatsApp ou appel : +33 6 67 40 20 05';
  var lg = nlLangue_(r.langue) || 'fr';
  return lg === 'fr' ? fr : nlTraduire_(fr, lg);
}

// ▶ Lancée automatiquement toutes les minutes
function accuseReception() {
  var props = PropertiesService.getScriptProperties();
  var faits = {}; try { faits = JSON.parse(props.getProperty('AR_RECU') || '{}'); } catch (e) {}
  var maintenant = Date.now(), journal = [];
  var depuis = new Date(maintenant - 30 * 60000).toISOString();     // réservations des 30 dernières minutes
  var liste = nlQuery_('', { from: [{ collectionId: 'reservations' }], limit: 50,
    where: { fieldFilter: { field: { fieldPath: 'date_creation' }, op: 'GREATER_THAN_OR_EQUAL', value: { stringValue: depuis } } } });
  liste.forEach(function (r) {
    if (faits[r._id] || r.source !== 'site') return;
    var cree = Date.parse(r.date_creation || '') || 0;
    if (!cree || maintenant - cree > 30 * 60000) { faits[r._id] = maintenant; return; }   // trop ancienne : on ne renvoie rien
    faits[r._id] = maintenant;
    var tel = nlTel_(r.tel);
    if (!tel) { journal.push(r._id + ' : pas de numéro'); return; }
    if (!AR_SMS_ETRANGER && tel.indexOf('+33') !== 0) { journal.push(r._id + ' : numéro étranger, pas de SMS'); return; }
    try { envoyerSMSviaIphone_(tel, arTexte_(r)); journal.push(r._id + ' : SMS → ' + tel); } catch (e) { journal.push(r._id + ' : ' + e); }
  });
  Object.keys(faits).forEach(function (k) { if (maintenant - faits[k] > 3 * 86400000) delete faits[k]; });
  props.setProperty('AR_RECU', JSON.stringify(faits));
  if (journal.length) console.log(journal.join('\n'));
}

// ▶ À lancer UNE fois (les réservations déjà présentes sont ignorées)
function installerAccuseReception() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'accuseReception') ScriptApp.deleteTrigger(t); });
  var faits = {}, n = Date.now(), depuis = new Date(n - 30 * 60000).toISOString();
  nlQuery_('', { from: [{ collectionId: 'reservations' }], limit: 50,
    where: { fieldFilter: { field: { fieldPath: 'date_creation' }, op: 'GREATER_THAN_OR_EQUAL', value: { stringValue: depuis } } } }).forEach(function (r) { faits[r._id] = n; });
  PropertiesService.getScriptProperties().setProperty('AR_RECU', JSON.stringify(faits));
  ScriptApp.newTrigger('accuseReception').timeBased().everyMinutes(1).create();
  console.log('Accusé de réception installé : chaque nouvelle réservation du site reçoit un SMS dans la minute.');
}

// ▶ Test
function testerAccuseReception() {
  var r = { date: '2026-11-26', heure: '10:00', dep: 'Paris 8e', arr: 'Aéroport CDG', langue: 'fr' };
  envoyerSMSviaIphone_(AR_TEST, arTexte_(r));
  console.log('SMS d’essai envoyé vers ' + AR_TEST + ' :\n' + arTexte_(r) + '\n\nEn anglais :\n' + arTexte_({ date: r.date, heure: r.heure, dep: r.dep, arr: r.arr, langue: 'en' }));
}
