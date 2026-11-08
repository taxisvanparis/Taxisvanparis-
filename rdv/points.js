/* Points de rendez-vous Taxis Van Paris — photo + phrase (en français, traduite automatiquement côté client).
   Pour ajouter une photo : mettre le fichier dans /rdv/ et renseigner « photo ». */
(function () {
  var A = " je vous attends avec une pancarte à votre nom.\nÉcrivez-moi ici dès que vous avez récupéré vos bagages.";
  var G = " je vous attends en bout de quai, à l'arrivée de votre train, avec une pancarte à votre nom.\nÉcrivez-moi ici quand votre train arrive.";
  function cdg(t) { return { id: "cdg-" + t.toLowerCase(), groupe: "Roissy CDG", nom: "CDG Terminal " + t, re: new RegExp("(terminal|term\\.?|\\bt)\\s*" + t + "\\b", "i"), aero: "cdg",
    texte: "Aéroport Charles-de-Gaulle, Terminal " + t + ", niveau Arrivées : à la sortie de la zone bagages," + A }; }
  function ory(n) { return { id: "orly-" + n, groupe: "Orly", nom: "Orly " + n, re: new RegExp("(orly\\s*-?\\s*|terminal\\s*|\\bo)" + n + "\\b", "i"), aero: "orly",
    texte: "Aéroport d'Orly, Orly " + n + ", hall des Arrivées : à la sortie de la zone bagages," + A }; }
  function gare(id, nom, re) { return { id: id, groupe: "Gares", nom: nom, re: re, texte: nom + " :" + G }; }
  var P = [
    { id: "cdg-1", groupe: "Roissy CDG", nom: "CDG Terminal 1", re: /(terminal|term\.?|\bt)\s*1\b/i, aero: "cdg", photo: "cdg-t1.jpg",
      texte: "Aéroport Charles-de-Gaulle, Terminal 1, niveau Arrivées : juste après la sortie des bagages, je vous attends devant la porte n° 36 (voir la photo) avec une pancarte à votre nom.\nÉcrivez-moi ici dès que vous avez récupéré vos bagages." },
    cdg("2A"), cdg("2B"), cdg("2C"), cdg("2D"), cdg("2E"), cdg("2F"), cdg("2G"), cdg("3"),
    ory(1), ory(2), ory(3), ory(4),
    { id: "beauvais", groupe: "Beauvais", nom: "Aéroport de Beauvais", re: /beauvais/i, texte: "Aéroport de Beauvais : je vous attends à la sortie du terminal des arrivées, avec une pancarte à votre nom.\nÉcrivez-moi ici dès que vous avez récupéré vos bagages." },
    gare("gare-nord", "Gare du Nord", /gare du nord|eurostar/i),
    gare("gare-lyon", "Gare de Lyon", /gare de lyon/i),
    gare("gare-est", "Gare de l'Est", /gare de l.est/i),
    gare("gare-montparnasse", "Gare Montparnasse", /montparnasse/i),
    gare("gare-st-lazare", "Gare Saint-Lazare", /saint.lazare|st.lazare/i),
    gare("gare-austerlitz", "Gare d'Austerlitz", /austerlitz/i),
    gare("gare-bercy", "Gare de Bercy", /bercy/i),
    gare("marne-chessy", "Gare Marne-la-Vallée – Chessy (Disney)", /chessy|marne.la.vall/i)
  ];
  // Trouve le point à partir de l'adresse de départ (ex. « Aéroport CDG Terminal 2E »)
  function trouver(dep) {
    var d = String(dep || "");
    var isCdg = /\b(cdg|roissy|charles[ -]?de[ -]?gaulle)\b/i.test(d), isOry = /\borly\b/i.test(d);
    for (var i = 0; i < P.length; i++) {
      var p = P[i];
      if (p.aero === "cdg" && !isCdg) continue;
      if (p.aero === "orly" && !isOry) continue;
      if (p.re.test(d)) return p;
    }
    return null;
  }
  function parId(id) { for (var i = 0; i < P.length; i++) if (P[i].id === id) return P[i]; return null; }
  window.TVP_RDV = { points: P, trouver: trouver, parId: parId };
})();
