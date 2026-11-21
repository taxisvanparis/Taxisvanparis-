
// ================= Joli e-mail de réservation (HTML) =================
// Envoyé au client avec le texte brut en secours. Langues : fr, en, es, it, ar.
const MAIL_TXT_ = {
  fr: { badge: '✓ Réservation reçue', hello: 'Bonjour', merci: 'Merci de votre confiance ! Voici le récapitulatif de votre course.', num: 'RÉSERVATION Nº', de: 'Départ', a: 'Arrivée',
        van: 'Van Mercedes Classe V', berline: 'Berline', pax: 'passagers', siege: 'Siège enfant', vol: 'Vol', prix: 'Prix, tout compris', agenda: '📅 Ajouter à mon agenda',
        suite: 'La suite', e1: 'Nous vous confirmons la réservation par WhatsApp ou par téléphone.', e2: 'Environ 20 minutes avant, vous recevez le nom du chauffeur, la plaque et un lien de suivi en direct.',
        e3: 'Vous payez à bord : carte, Apple Pay, Google Pay ou espèces.', modif: 'Besoin de modifier ou d’annuler ?', modif2: 'Contactez-nous directement, nous répondons vite, 24h/24.',
        appel: '📞 Appeler', wa: 'Bonjour, je voudrais modifier ma réservation ', regles: '✓ Annulation gratuite jusqu’à 24 h avant · ✓ Sièges enfant offerts sur demande', a_h: 'à',
        jours: ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'], mois: ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'],
        sieges: { 'Aucune': 'aucun', 'Siège bébé': 'siège bébé', 'Rehausseur': 'rehausseur', 'Siège bébé + Rehausseur': 'siège bébé + rehausseur' } },
  en: { badge: '✓ Booking received', hello: 'Hello', merci: 'Thank you for choosing us! Here is the summary of your ride.', num: 'BOOKING Nº', de: 'From', a: 'To',
        van: 'Mercedes V-Class van', berline: 'Sedan', pax: 'passengers', siege: 'Child seat', vol: 'Flight', prix: 'Price, all included', agenda: '📅 Add to my calendar',
        suite: 'What happens next', e1: 'We confirm your booking by WhatsApp or phone.', e2: 'About 20 minutes before pick-up, you receive your driver’s name, plate and a live tracking link.',
        e3: 'You pay the driver on board: card, Apple Pay, Google Pay or cash.', modif: 'Need to change or cancel?', modif2: 'Contact us directly, we reply fast, 24/7.',
        appel: '📞 Call us', wa: 'Hello, I would like to change my booking ', regles: '✓ Free cancellation up to 24 h before · ✓ Child seats free on request', a_h: 'at',
        jours: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'], mois: ['January','February','March','April','May','June','July','August','September','October','November','December'],
        sieges: { 'Aucune': 'none', 'Siège bébé': 'baby seat', 'Rehausseur': 'booster seat', 'Siège bébé + Rehausseur': 'baby seat + booster seat' } },
  es: { badge: '✓ Reserva recibida', hello: 'Hola', merci: '¡Gracias por elegirnos! Aquí tiene el resumen de su trayecto.', num: 'RESERVA Nº', de: 'Salida', a: 'Llegada',
        van: 'Van Mercedes Clase V', berline: 'Sedán', pax: 'pasajeros', siege: 'Silla infantil', vol: 'Vuelo', prix: 'Precio, todo incluido', agenda: '📅 Añadir a mi calendario',
        suite: 'Próximos pasos', e1: 'Confirmamos su reserva por WhatsApp o por teléfono.', e2: 'Unos 20 minutos antes recibirá el nombre del conductor, la matrícula y un enlace de seguimiento en directo.',
        e3: 'Paga a bordo: tarjeta, Apple Pay, Google Pay o efectivo.', modif: '¿Necesita modificar o cancelar?', modif2: 'Contáctenos directamente, respondemos rápido, 24 h.',
        appel: '📞 Llamar', wa: 'Hola, quisiera modificar mi reserva ', regles: '✓ Cancelación gratuita hasta 24 h antes · ✓ Sillas infantiles gratis bajo pedido', a_h: 'a las',
        jours: ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'], mois: ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'],
        sieges: { 'Aucune': 'ninguna', 'Siège bébé': 'silla de bebé', 'Rehausseur': 'elevador', 'Siège bébé + Rehausseur': 'silla de bebé + elevador' } },
  it: { badge: '✓ Prenotazione ricevuta', hello: 'Buongiorno', merci: 'Grazie per averci scelto! Ecco il riepilogo della sua corsa.', num: 'PRENOTAZIONE Nº', de: 'Partenza', a: 'Arrivo',
        van: 'Van Mercedes Classe V', berline: 'Berlina', pax: 'passeggeri', siege: 'Seggiolino', vol: 'Volo', prix: 'Prezzo, tutto incluso', agenda: '📅 Aggiungi al calendario',
        suite: 'I prossimi passi', e1: 'Confermiamo la prenotazione via WhatsApp o per telefono.', e2: 'Circa 20 minuti prima riceve il nome dell’autista, la targa e un link per seguirlo in diretta.',
        e3: 'Paga a bordo: carta, Apple Pay, Google Pay o contanti.', modif: 'Deve modificare o annullare?', modif2: 'Ci contatti direttamente, rispondiamo subito, 24 ore su 24.',
        appel: '📞 Chiama', wa: 'Buongiorno, vorrei modificare la mia prenotazione ', regles: '✓ Cancellazione gratuita fino a 24 h prima · ✓ Seggiolini gratuiti su richiesta', a_h: 'alle',
        jours: ['domenica','lunedì','martedì','mercoledì','giovedì','venerdì','sabato'], mois: ['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'],
        sieges: { 'Aucune': 'nessuno', 'Siège bébé': 'seggiolino', 'Rehausseur': 'alzatina', 'Siège bébé + Rehausseur': 'seggiolino + alzatina' } },
  ar: { badge: '✓ تم استلام الحجز', hello: 'مرحباً', merci: 'شكراً لاختياركم! إليكم ملخص رحلتكم.', num: 'رقم الحجز', de: 'الانطلاق', a: 'الوصول',
        van: 'فان مرسيدس الفئة V', berline: 'سيارة سيدان', pax: 'ركاب', siege: 'مقعد الطفل', vol: 'الرحلة', prix: 'السعر شامل كل شيء', agenda: '📅 أضف إلى التقويم',
        suite: 'الخطوات التالية', e1: 'نؤكد حجزكم عبر واتساب أو الهاتف.', e2: 'قبل نحو 20 دقيقة تصلكم رسالة باسم السائق ورقم اللوحة ورابط لتتبع السيارة مباشرة.',
        e3: 'الدفع داخل السيارة: بطاقة أو Apple Pay أو Google Pay أو نقداً.', modif: 'هل تريدون تعديل الحجز أو إلغاءه؟', modif2: 'تواصلوا معنا مباشرة، نرد بسرعة على مدار الساعة.',
        appel: '📞 اتصل بنا', wa: 'مرحباً، أريد تعديل حجزي ', regles: '✓ إلغاء مجاني حتى 24 ساعة قبل الموعد · ✓ مقاعد الأطفال مجانية عند الطلب', a_h: 'الساعة',
        jours: ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'], mois: ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'],
        sieges: { 'Aucune': 'لا يوجد', 'Siège bébé': 'مقعد رضيع', 'Rehausseur': 'مقعد رافع', 'Siège bébé + Rehausseur': 'مقعد رضيع + مقعد رافع' } }
};

function numResa_(d) {
  const m = String(d.date || '').match(/^(\d{4})-(\d{2})-(\d{2})$/), h = String(d.heure || '').match(/(\d{1,2}):(\d{2})/);
  return 'TVP-' + (m ? m[3] + m[2] : '0000') + '-' + (h ? ('0' + h[1]).slice(-2) + h[2] : '0000');
}

function mailResaHtml_(d, lg, vol) {
  const T = MAIL_TXT_[lg] || MAIL_TXT_.en, rtl = lg === 'ar';
  const e = v => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const m = String(d.date || '').match(/^(\d{4})-(\d{2})-(\d{2})$/), hm = String(d.heure || '').match(/^(\d{1,2}):(\d{2})$/);
  let quand = e(d.date) + ' ' + e(d.heure);
  if (m) {
    const dt = new Date(+m[1], +m[2] - 1, +m[3]);
    const jour = T.jours[dt.getDay()], mois = T.mois[+m[2] - 1], num = +m[3];
    const dateTxt = lg === 'en' ? jour + ' ' + num + ' ' + mois : jour + ' ' + num + ' ' + mois;
    let heureTxt = e(d.heure);
    if (hm && lg === 'en') { const H = +hm[1]; heureTxt = ((H % 12) || 12) + ':' + hm[2] + (H < 12 ? ' am' : ' pm'); }
    quand = e(dateTxt.charAt(0).toUpperCase() + dateTxt.slice(1)) + ' · ' + heureTxt;
  }
  const ref = numResa_(d), nom = String(d.nom || '').trim(), prenom = nom.split(/\s+/)[0] || nom;
  const vh = /van/i.test(String(d.vh)) ? T.van : T.berline;
  const siege = T.sieges[String(d.siege || 'Aucune').trim()] || e(d.siege);
  let cal = '';
  if (m && hm) {
    const p = n => ('0' + n).slice(-2), deb = m[1] + m[2] + m[3] + 'T' + p(+hm[1]) + hm[2] + '00';
    const fin = new Date(+m[1], +m[2] - 1, +m[3], +hm[1] + 1, +hm[2]);
    const f = fin.getFullYear() + p(fin.getMonth() + 1) + p(fin.getDate()) + 'T' + p(fin.getHours()) + p(fin.getMinutes()) + '00';
    cal = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent('🚖 Taxis Van Paris · ' + ref) + '&dates=' + deb + '/' + f +
          '&ctz=Europe/Paris&location=' + encodeURIComponent(String(d.dep || '')) + '&details=' + encodeURIComponent(String(d.dep || '') + ' → ' + String(d.arr || '') + '\n+33 6 67 40 20 05');
  }
  const wa = 'https://wa.me/33667402005?text=' + encodeURIComponent(T.wa + ref);
  const al = rtl ? 'right' : 'left';
  const ligne = (ic, txt) => '<div>' + ic + ' ' + txt + '</div>';
  return '<!doctype html><html dir="' + (rtl ? 'rtl' : 'ltr') + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head><body style="margin:0;padding:0;background:#f2efe8">' +
  '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2efe8"><tr><td align="center" style="padding:24px 12px">' +
  '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;font-family:Helvetica,Arial,sans-serif;color:#22201b;text-align:' + al + '" dir="' + (rtl ? 'rtl' : 'ltr') + '">' +
  '<tr><td dir="ltr" style="background:#0b0b0b;padding:22px 26px;border-bottom:3px solid #C9A84C;text-align:left"><div style="font-family:Georgia,\'Times New Roman\',serif;font-size:26px;font-weight:700;color:#ffffff">Taxis <span style="color:#C9A84C">Van</span> Paris</div><div style="font-size:11px;letter-spacing:3px;color:#C9A84C;margin-top:2px">BY ABTS</div></td></tr>' +
  '<tr><td><img src="https://taxisvanparis.fr/img/mail-van.jpg" width="560" alt="Mercedes V-Class" style="display:block;width:100%;height:auto;border:0"></td></tr>' +
  '<tr><td style="padding:26px 26px 8px"><span style="display:inline-block;background:#eaf6ee;color:#1d7a3f;font-size:13px;font-weight:700;padding:5px 12px;border-radius:999px">' + T.badge + '</span>' +
  '<h1 style="font-size:22px;margin:14px 0 6px;font-weight:700">' + T.hello + ' ' + e(prenom) + ',</h1><p style="font-size:15px;line-height:1.5;margin:0;color:#4a463d">' + T.merci + '</p></td></tr>' +
  '<tr><td style="padding:14px 26px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e6dcc3;border-radius:12px;background:#fbf8f1">' +
  '<tr><td style="padding:16px 18px 4px;font-size:12px;letter-spacing:1px;color:#9a8a62">' + T.num + ' <b dir="ltr" style="color:#22201b">' + ref + '</b></td></tr>' +
  '<tr><td style="padding:6px 18px;font-size:20px;font-weight:700">📅 ' + quand + '</td></tr>' +
  '<tr><td style="padding:8px 18px;font-size:15px;line-height:1.45"><span style="color:#1d7a3f">●</span> <b>' + T.de + '</b><br><bdi>' + e(d.dep) + '</bdi></td></tr>' +
  '<tr><td style="padding:4px 18px 10px;font-size:15px;line-height:1.45"><span style="color:#C9A84C">●</span> <b>' + T.a + '</b><br><bdi>' + e(d.arr) + '</bdi></td></tr>' +
  '<tr><td style="padding:0 18px"><div style="border-top:1px dashed #e0d4b6"></div></td></tr>' +
  '<tr><td style="padding:10px 18px;font-size:14.5px;line-height:1.7;color:#4a463d">' + ligne('🚐', vh + ' · ' + e(d.pax) + ' ' + T.pax) +
     (d.note ? ligne('📝', '<bdi>' + e(String(d.note).slice(0, 300)) + '</bdi>') : '') + (vol ? ligne('✈️', T.vol + ' : ' + e(vol)) : '') + ligne('👶', T.siege + ' : ' + siege) + '</td></tr>' +
  (d.prix ? '<tr><td style="padding:4px 18px 16px"><table role="presentation" width="100%"><tr><td style="font-size:15px;color:#4a463d;text-align:' + al + '">' + T.prix + '</td><td style="font-size:24px;font-weight:700;color:#22201b;text-align:' + (rtl ? 'left' : 'right') + '" dir="ltr">' + e(d.prix) + '</td></tr></table></td></tr>' : '') +
  '</table></td></tr>' +
  (cal ? '<tr><td align="center" style="padding:4px 26px 6px;text-align:center"><a href="' + cal + '" style="display:inline-block;border:1.5px solid #C9A84C;color:#8a6d2b;text-decoration:none;font-weight:700;font-size:15px;padding:11px 22px;border-radius:999px">' + T.agenda + '</a></td></tr>' : '') +
  '<tr><td style="padding:14px 26px 6px"><div style="font-size:16px;font-weight:700;margin-bottom:8px">' + T.suite + '</div><table role="presentation" cellpadding="0" cellspacing="0" style="font-size:14.5px;line-height:1.45;color:#4a463d">' +
  [T.e1, T.e2, T.e3].map((t, i) => '<tr><td valign="top" style="padding:4px 10px;color:#C9A84C;font-weight:700">' + (i + 1) + '</td><td style="padding:4px 0">' + t + '</td></tr>').join('') + '</table></td></tr>' +
  '<tr><td style="padding:20px 26px 8px"><div style="background:#0b0b0b;border-radius:14px;padding:18px 18px 16px;text-align:center"><div style="color:#ffffff;font-size:16px;font-weight:700">' + T.modif + '</div>' +
  '<div style="color:#bdb5a0;font-size:13.5px;margin:4px 0 14px">' + T.modif2 + '</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>' +
  '<td width="50%" style="padding:0 5px"><a href="tel:+33667402005" style="display:block;background:#C9A84C;color:#0b0b0b;text-decoration:none;font-weight:700;font-size:15px;padding:13px 6px;border-radius:999px;text-align:center">' + T.appel + '</a></td>' +
  '<td width="50%" style="padding:0 5px"><a href="' + wa + '" style="display:block;background:#25D366;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:13px 6px;border-radius:999px;text-align:center">💬 WhatsApp</a></td>' +
  '</tr></table><div dir="ltr" style="color:#bdb5a0;font-size:13px;margin-top:10px">+33 6 67 40 20 05</div></div></td></tr>' +
  '<tr><td style="padding:14px 26px 22px"><div style="font-size:13px;line-height:1.5;color:#7a7465;background:#f6f3ec;border-radius:10px;padding:10px 12px">' + T.regles + '</div></td></tr>' +
  '<tr><td dir="ltr" style="background:#0b0b0b;padding:16px 26px;font-size:12px;color:#a49c88;line-height:1.5;text-align:left">Taxis Van Paris by ABTS · Nanterre · taxisvanparis.fr</td></tr>' +
  '</table></td></tr></table></body></html>';
}

// Test : envoie le joli mail (exemple) à votre adresse, dans les 5 langues
function testerMailResa() {
  const d = { nom: 'Client 1', tel: '0600000000', email: EMAIL_ALERTE, dep: '6 Domaine Montjoie, Saint-Denis, France', arr: 'Porte Maillot, Paris, France',
              date: '2026-11-22', heure: '05:30', pax: '7', vh: 'Van Mercedes Classe V 🚐', siege: 'Aucune', note: '1 valise, 6 sacs à dos', prix: '74.70 €' };
  ['fr', 'en'].forEach(lg => MailApp.sendEmail({ to: EMAIL_ALERTE, name: 'Taxis Van Paris', subject: 'TEST joli mail (' + lg + ')', body: 'Test', htmlBody: mailResaHtml_(d, lg, '') }));
}
