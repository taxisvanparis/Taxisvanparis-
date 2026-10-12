// Génère le HTML d'une facture Taxis Van Paris (TVA 10 %, montant saisi TTC)
function factureHTML(f, p){
  const e=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const eur=n=>(Math.round(n*100)/100).toFixed(2).replace('.',',')+' €';
  const ttc=Number(f.montant)||0, ht=Math.round(ttc/1.10*100)/100, tva=Math.round((ttc-ht)*100)/100;
  const d=f.date?f.date.split('-').reverse().join('/'):'';
  const de=f.dateEmission?f.dateEmission.split('-').reverse().join('/'):d;
  const rib=(p.iban||p.titulaire)?`<div class="rib"><b>Coordonnées bancaires</b><br>${[p.titulaire&&'Titulaire : '+e(p.titulaire),p.banque&&'Banque : '+e(p.banque),p.iban&&'IBAN : '+e(p.iban),p.bic&&'BIC : '+e(p.bic)].filter(Boolean).join('<br>')}</div>`:'';
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Facture ${e(f.numero)} – ${e(f.client)}</title><style>
@page{size:A4;margin:14mm}*{box-sizing:border-box}body{font-family:Helvetica,Arial,sans-serif;color:#1a1a1a;margin:0;padding:14px;font-size:13px;background:#fff}
.w{max-width:760px;margin:0 auto}.top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #C9A84C;padding-bottom:14px}
.logo{font:700 26px Georgia,serif}.logo b{color:#B08A36}.pres{font-size:12px;line-height:1.55;color:#333;margin-top:6px}
.fn{text-align:right}.fn h1{margin:0;font:700 28px Georgia,serif;letter-spacing:2px}.fn .n{font-size:15px;font-weight:700;color:#B08A36;margin-top:4px}.fn .dt{font-size:12px;color:#555;margin-top:6px;line-height:1.5}
.cli{margin:22px 0 18px;margin-left:auto;width:55%;border:1px solid #ddd;border-radius:8px;padding:12px 14px;line-height:1.5}.cli .l{font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px}
table{width:100%;border-collapse:collapse;margin-top:6px}th{background:#141008;color:#fff;font-size:12px;text-align:left;padding:9px 10px}th.r,td.r{text-align:right}
td{padding:11px 10px;border-bottom:1px solid #e5e5e5;vertical-align:top}
.tot{width:46%;margin-left:auto;margin-top:14px}.tot div{display:flex;justify-content:space-between;padding:6px 10px}.tot .g{background:#F7F1E1;font-weight:700;font-size:15px;border-top:2px solid #C9A84C}
.pay{margin-top:16px;font-size:12.5px;line-height:1.6}.ref{font-size:12.5px;margin:-6px 0 12px}.note{margin-top:12px;font-size:12.5px;line-height:1.55;background:#fafafa;border-left:3px solid #C9A84C;padding:8px 12px}.rib{margin-top:14px;border:1px dashed #C9A84C;border-radius:8px;padding:10px 14px;font-size:12px;line-height:1.6}.rib.vide{color:#999}
.foot{margin-top:26px;border-top:1px solid #ddd;padding-top:10px;font-size:10.5px;color:#777;line-height:1.5;text-align:center}
.bar{max-width:760px;margin:0 auto 12px;display:flex;gap:8px}.bar button{flex:1;padding:12px;border:0;border-radius:10px;font-weight:700;font-size:15px;background:#C9A84C;color:#141008}
@media print{.bar{display:none}body{padding:0}}</style></head><body>
<div class="bar"><button onclick="window.print()">🖨️ Imprimer / Enregistrer en PDF</button></div>
<div class="w"><div class="top"><div><div class="logo">Taxis <b>Van</b> Paris</div><div class="pres"><b>AB Taxis Services</b><br>99 rue Alfred Dinin, 92000 Nanterre<br>SIREN 912 763 133 · TVA FR72 912 763 133<br>+33 6 67 40 20 05 · taxisvanparis@gmail.com</div></div>
<div class="fn"><h1>FACTURE</h1><div class="n">N° ${e(f.numero)}</div><div class="dt">Date d'émission : ${e(de)}${d?'<br>Date de la prestation : '+e(d):''}</div></div></div>
<div class="cli"><div class="l">Facturé à</div><b>${e(f.societe||f.client)}</b>${f.clientAdresse?'<br>'+e(f.clientAdresse).replace(/\n/g,'<br>'):''}${f.siret?'<br>SIRET : '+e(f.siret):''}${f.tvaClient?'<br>N° TVA : '+e(f.tvaClient):''}</div>
${(f.reference||f.passager)?`<div class="ref">${f.reference?'<b>Votre référence :</b> '+e(f.reference):''}${f.reference&&f.passager?' &nbsp;·&nbsp; ':''}${f.passager?'<b>Passager(s) :</b> '+e(f.passager):''}</div>`:''}
<table><thead><tr><th>Désignation</th><th class="r">Qté</th><th class="r">Prix HT</th><th class="r">TVA</th><th class="r">Total HT</th></tr></thead>
<tbody><tr><td><b>Transport de personnes${f.vehicule?' – '+e(f.vehicule):''}</b>${f.trajet?'<br>'+e(f.trajet):''}${f.detail?'<br><span style="color:#666">'+e(f.detail)+'</span>':''}</td><td class="r">1</td><td class="r">${eur(ht)}</td><td class="r">10 %</td><td class="r">${eur(ht)}</td></tr></tbody></table>
<div class="tot"><div><span>Total HT</span><span>${eur(ht)}</span></div><div><span>TVA 10 %</span><span>${eur(tva)}</span></div><div class="g"><span>Total TTC</span><span>${eur(ttc)}</span></div></div>
<div class="pay">${f.paiement?'<b>Mode de paiement :</b> '+e(f.paiement)+' &nbsp;·&nbsp; ':''}<b>Statut :</b> ${e(f.statut==='payée'?'Payée':'À régler')}${f.statut==='payée'?'':'<br>'+(/jour/i.test(f.paiement||'')?'Paiement selon l\'échéance indiquée.':'Paiement à réception de facture.')+' En cas de retard, pénalités au taux légal et indemnité forfaitaire de 40 € pour frais de recouvrement.'}</div>
${f.notes?'<div class="note"><b>Informations :</b> '+e(f.notes).replace(/\n/g,'<br>')+'</div>':''}
${rib}
<div class="foot">AB Taxis Services · Taxis Van Paris by ABTS · 99 rue Alfred Dinin, 92000 Nanterre · SIREN 912 763 133 · TVA intracommunautaire FR72 912 763 133<br>taxisvanparis.fr</div></div></body></html>`;
}
if(typeof module!=='undefined') module.exports={factureHTML}; else window.factureHTML=factureHTML;
