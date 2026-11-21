
// ================= Confirmation par e-mail (bouton « 📧 Confirmation e-mail » du tableau de bord) =================
const MAIL_CONF_ = {
  fr: { badge: '✓ Réservation confirmée', merci: 'Bonne nouvelle : votre course est confirmée. Un chauffeur est réservé pour vous.', e1: 'Votre course est confirmée ✓ Rien d’autre à faire.', suite: 'Le jour de la course', sujet: '✅ Réservation confirmée — Taxis Van Paris — ', plein: true },
  en: { badge: '✓ Booking confirmed', merci: 'Good news: your ride is confirmed. A driver is booked for you.', e1: 'Your ride is confirmed ✓ Nothing else to do.', suite: 'On the day of your ride', sujet: '✅ Booking confirmed — Taxis Van Paris — ', plein: true },
  es: { badge: '✓ Reserva confirmada', merci: 'Buenas noticias: su trayecto está confirmado. Hay un conductor reservado para usted.', e1: 'Su trayecto está confirmado ✓ No tiene que hacer nada más.', suite: 'El día del trayecto', sujet: '✅ Reserva confirmada — Taxis Van Paris — ', plein: true },
  it: { badge: '✓ Prenotazione confermata', merci: 'Buone notizie: la sua corsa è confermata. Un autista è riservato per lei.', e1: 'La sua corsa è confermata ✓ Non deve fare altro.', suite: 'Il giorno della corsa', sujet: '✅ Prenotazione confermata — Taxis Van Paris — ', plein: true },
  ar: { badge: '✓ تم تأكيد الحجز', merci: 'خبر سار: تم تأكيد رحلتكم. سائق محجوز لكم.', e1: 'تم تأكيد رحلتكم ✓ لا شيء آخر عليكم فعله.', suite: 'يوم الرحلة', sujet: '✅ تم تأكيد الحجز — Taxis Van Paris — ', plein: true }
};
const ONGLET_EMAILS = 'Emails clients';
function telCle_(t) { const x = String(t || '').replace(/\D/g, ''); return x.length >= 9 ? x.slice(-9) : ''; }
// Garde l'e-mail du client (réservations du site) pour pouvoir lui envoyer la confirmation plus tard
function memoriserEmail_(tel, date, heure, nom, email) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet(); let o = ss.getSheetByName(ONGLET_EMAILS);
    if (!o) { o = ss.insertSheet(ONGLET_EMAILS); o.appendRow(['Reçu le', 'Téléphone (9 derniers chiffres)', 'Date course', 'Heure', 'Nom', 'E-mail']); o.setFrozenRows(1); }
    o.appendRow([new Date(), "'" + telCle_(tel), "'" + String(date || ''), "'" + String(heure || ''), String(nom || '').slice(0, 80), String(email || '').slice(0, 120)]);
  } catch (x) {}
}
function trouverEmail_(tel, date) {
  const k = telCle_(tel); if (!k) return '';
  try {
    const o = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ONGLET_EMAILS); if (!o) return '';
    const v = o.getDataRange().getDisplayValues(); let parTel = '';
    for (let i = v.length - 1; i >= 1; i--) {
      if (String(v[i][1]).replace(/\D/g, '') !== k) continue;
      if (String(v[i][2]) === String(date)) return String(v[i][5]);
      if (!parTel) parTel = String(v[i][5]);
    }
    return parTel;
  } catch (x) { return ''; }
}
function confMail_(d) {
  if (!tradCompteOk_(d.idToken)) return { ok: false, error: 'acces_refuse' };
  const valide = m => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(m);
  const donne = String(d.email || '').trim().slice(0, 120);
  const mail = valide(donne) ? donne : trouverEmail_(d.tel, d.date);
  if (!valide(mail)) return { ok: false, error: 'pas_email' };
  const l2 = String(d.langue || '').toLowerCase().slice(0, 2), lg = MAIL_TXT_[l2] ? l2 : 'en';
  const C = MAIL_CONF_[lg], T = MAIL_TXT_[lg], vol = String(d.vol || '').slice(0, 40);
  const texte = [T.hello + ' ' + String(d.nom || '').trim() + ',', C.merci, '', T.de + ' : ' + String(d.dep || ''), T.a + ' : ' + String(d.arr || ''),
    String(d.date || '') + ' ' + String(d.heure || ''), d.prix ? T.prix + ' : ' + String(d.prix) : '', '', T.modif + ' +33 6 67 40 20 05', '', 'Taxis Van Paris By ABTS'].join('\n');
  try {
    MailApp.sendEmail({ to: mail, replyTo: EMAIL_ALERTE, name: 'Taxis Van Paris', subject: C.sujet + String(d.date || '').slice(0, 20), body: texte, htmlBody: mailResaHtml_(d, lg, vol, C) });
  } catch (x) { return { ok: false, error: 'envoi_impossible' }; }
  if (valide(donne)) memoriserEmail_(d.tel, d.date, d.heure, d.nom, donne);
  return { ok: true, email: mail };
}
