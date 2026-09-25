// One-off seed: creates event series + 2026 editions from the Sept 2026 calendar research.
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';

const TODAY = '2026-09-25';
// [slug, name, category, start, end, city, venue, url, conf, note, description]
const E = [
['snowcamp','Snowcamp','dev','2026-01-14','2026-01-17','Grenoble','Alpexpo, Espace 1968','https://snowcamp.io','ok','','Conférence développeurs à Grenoble : universités, talks et unconference à la montagne.'],
['cloud-native-days-france','Cloud Native Days France','dev','2026-02-03','2026-02-03','Paris','CENTQUATRE-PARIS','https://cloudnativedays.fr','ok','','Conférence communautaire cloud native et Kubernetes (ex-KCD France).'],
['journee-agile-le-mans','Journée Agile au Mans','agile','2026-02-12','2026-02-12','Le Mans','ESGT','https://agilemans.org','ok','10e édition.','Journée de conférences agiles organisée par la communauté mancelle.'],
['touraine-tech','Touraine Tech','dev','2026-02-12','2026-02-13','Tours','Faculté des Sciences, Grandmont','https://2026.touraine.tech','ok','','Conférence tech et développement en Touraine.'],
['piaf-pmi-france','PIAF (PMI France)','agile','2026-03-20','2026-03-20','En ligne','','https://pmi-france.org/piaf2026','ok','','Journée PMI France sur l\'intégration de l\'agilité au business.'],
['printemps-agile','Printemps Agile','agile','2026-03-24','2026-03-24','Caen','Moho','https://club-agile-normandie.fr/?page_id=5376','ok','14e édition.','Événement annuel du Club Agile Normandie.'],
['agile-games-france','Agile Games France','agile','2026-03-27','2026-03-28','Bordeaux','','https://agilegamesfrance.fr','ok','','Rencontre autour des jeux sérieux et de la facilitation agile.'],
['flowcon','FlowCon','agile','2026-03-31','2026-04-01','Montrouge','Le Beffroi','https://www.flowcon.fr','ok','','Conférence Lean, Kanban et flux (ex-Lean Kanban France).'],
['forum-incyber','Forum InCyber Europe (FIC)','dev','2026-03-31','2026-04-02','Lille','Lille Grand Palais','https://europe.forum-incyber.com','ok','','Grand rendez-vous européen de la cybersécurité.'],
['mixit','MiXiT','dev','2026-04-16','2026-04-17','Villeurbanne','CPE Lyon','https://mixitconf.org','ok','','Conférence lyonnaise tech, éthique et diversité.'],
['devoxx-france','Devoxx France','dev','2026-04-22','2026-04-24','Paris','Palais des Congrès','https://www.devoxx.fr','ok','','La plus grande conférence développeurs francophone.'],
['la-product-conf','La Product Conf','produit','2026-05-19','2026-05-19','Paris','Folies Bergère','https://www.laproductconf.com/paris/lpc','ok','','Conférence Product Management.'],
['flupa-ux-days','Flupa UX Days','produit','2026-05-21','2026-05-22','Paris','Cité des Sciences','https://www.uxdays.eu','ok','14e édition.','Conférence UX de l\'association Flupa.'],
['afup-day','AFUP Day','dev','2026-05-22','2026-05-22','Bordeaux, Lille, Lyon, Paris','','https://event.afup.org/afup-day-2026/','ok','Quatre villes le même jour.','Journées PHP de l\'AFUP dans plusieurs villes.'],
['agile-tour-strasbourg','Agile Tour Strasbourg','agile','2026-05-29','2026-05-29','Strasbourg','Epitech','https://agilestrasbourg.fr','ok','','Étape strasbourgeoise de l\'Agile Tour.'],
['agile-tour-rennes','Agile Tour Rennes','agile','2026-06-02','2026-06-03','Rennes','Askoria','https://agiletour.agilerennes.org','ok','','Étape rennaise de l\'Agile Tour.'],
['lean-summit-france','Lean Summit France','agile','2026-06-02','2026-06-03','Paris','Novotel Paris Centre Tour Eiffel','https://www.institut-lean-france.fr/evenement/10e-lean-summit-france-2-et-3-juin-2026/','ok','10e édition.','Sommet annuel de l\'Institut Lean France.'],
['devlille','DevLille','dev','2026-06-11','2026-06-12','Lille','Lille Grand Palais','https://devlille.fr','ok','','Conférence développeurs lilloise (ex-DevFest Lille).'],
['vivatech','VivaTech','ia','2026-06-17','2026-06-20','Paris','Paris Expo Porte de Versailles','https://vivatech.com','sec','','Salon européen de l\'innovation et des startups.'],
['agilille','Agi\'Lille (Nord Agile)','agile','2026-06-24','2026-06-26','Lille','Université Catholique de Lille','https://nord-agile.org/agilille/','ok','Forum ouvert le 26. Dernière édition sous ce format.','Conférence agile de l\'association Nord Agile.'],
['breizhcamp','BreizhCamp','dev','2026-06-24','2026-06-26','Rennes','Campus de Beaulieu','https://www.breizhcamp.org','sec','','Conférence développeurs bretonne.'],
['agile-tour-toulouse','Agile Tour Toulouse','agile','2026-06-25','2026-06-26','Toulouse','','https://tour.agiletoulouse.fr','sec','Format forum ouvert, avancé en juin cette année.','Étape toulousaine de l\'Agile Tour.'],
['lehack','leHACK','dev','2026-06-26','2026-06-28','Paris','Cité des Sciences','https://lehack.org','sec','','Convention de hacking et cybersécurité.'],
['sunny-tech','Sunny Tech','dev','2026-07-02','2026-07-03','Montpellier','Faculté des Sciences','https://sunny-tech.io','ok','','Conférence développeurs à Montpellier.'],
['agile-lyon','Agile Lyon','agile','2026-07-03','2026-07-03','Villeurbanne','CPE Lyon','https://www.agilelyon.fr','ok','','Conférence agile lyonnaise (CARA Lyon).'],
['riviera-dev','Riviera DEV','dev','2026-07-06','2026-07-08','Sophia Antipolis','SKEMA','https://rivieradev.fr','ok','','Conférence développeurs sur la Côte d\'Azur.'],
['raise-summit','RAISE Summit','ia','2026-07-08','2026-07-09','Paris','Carrousel du Louvre','https://www.raisesummit.com','sec','','Sommet IA à Paris.'],
['paris-open-source-ai-summit','Paris Open Source AI Summit','ia','2026-07-10','2026-07-10','Paris','Maison de la Radio, Studio 104','','sec','','Sommet sur l\'IA open source.'],
['jug-summer-camp','JUG Summer Camp','dev','2026-09-04','2026-09-04','La Rochelle','Espace Encan','https://www.jugsummercamp.org','sec','','Journée de conférences Java et dev à La Rochelle.'],
['big-data-ai-paris','Big Data & AI Paris','ia','2026-09-15','2026-09-16','Paris','Paris Expo Porte de Versailles','https://www.bigdataparis.com','ok','','Salon data et IA.'],
['dotai','dotAI','ia','2026-09-17','2026-09-17','Paris','Folies Bergère','https://www.dotai.io','sec','','Conférence IA de la série dotConferences.'],
['dotjs','dotJS','dev','2026-09-18','2026-09-18','Paris','Folies Bergère','https://www.dotjs.io','sec','','Conférence JavaScript de la série dotConferences.'],
['agile-en-seine','Agile en Seine','agile','2026-09-22','2026-09-23','Issy-les-Moulineaux','Palais des Congrès d\'Issy','https://www.agileenseine.com','ok','10e édition.','Grande conférence agile d\'Île-de-France.'],
['ai-engineer-paris','AI Engineer Paris','ia','2026-09-23','2026-09-24','Paris','Station F','https://ai.engineer/paris/2026','ok','','Conférence des AI engineers.'],
['agile-tour-sophia','Agile Tour Sophia-Antipolis','agile','2026-09-24','2026-09-24','Biot','Polytech Nice Sophia','https://www.telecom-valley.fr/contenu-agile-tour-sophia/','ok','Format demi-journée.','Étape azuréenne de l\'Agile Tour, portée par Telecom Valley.'],
['paris-web','Paris Web','produit','2026-09-24','2026-09-25','Paris','Institut Pasteur','https://www.paris-web.fr/2026','ok','','Conférence web : accessibilité, design, qualité.'],
['volcamp','Volcamp','dev','2026-10-01','2026-10-02','Clermont-Ferrand','Hall 32','https://www.volcamp.io','ok','','Conférence développeurs en Auvergne.'],
['devfest-perros-guirec','DevFest Perros-Guirec','dev','2026-10-02','2026-10-02','Perros-Guirec','Palais des Congrès','https://devfest.codedarmor.fr','ok','','DevFest de la Côte de Granit Rose.'],
['forum-php','Forum PHP','dev','2026-10-08','2026-10-09','Marne-la-Vallée','Hotel New York, Disneyland Paris','https://event.afup.org','ok','','Conférence PHP de l\'AFUP.'],
['ai-pulse','ai-PULSE','ia','2026-10-13','2026-10-13','Paris','','','agg','','Conférence IA à Paris.'],
['agile-tour-bordeaux','Agile Tour Bordeaux','agile','2026-10-22','2026-10-23','Le Bouscat','Campus YNOV (et en ligne)','https://agiletourbordeaux.fr','ok','Gratuit, inscription avant le 1er octobre.','Étape bordelaise de l\'Agile Tour.'],
['agile-tour-montpellier','Agile Tour Montpellier','agile','2026-10-26','2026-10-26','Montpellier','Institut Agro, La Gaillarde','https://agiletourmontpellier.fr','ok','15e édition.','Étape montpelliéraine de l\'Agile Tour.'],
['agile-tour-nantais','Agile Tour Nantais','agile','2026-10-29','2026-10-30','Carquefou','IUT de Carquefou','https://agilenantes.org/evenements/agile-tour-nantes/agile-tour-nantais-2026/','ok','','Étape nantaise de l\'Agile Tour.'],
['bdx-io','BDX I/O','dev','2026-10-29','2026-10-30','Talence','ENSEIRB-MATMECA','https://bdxio.fr','ok','','Conférence développeurs bordelaise.'],
['pyconfr','PyConFR','dev','2026-10-29','2026-11-01','Biarritz','','https://www.pycon.fr/2026/','ok','','Conférence Python francophone.'],
['cloud-nord','Cloud Nord','dev','2026-10-30','2026-10-30','Lille','Université Catholique de Lille','https://cloudnord.fr','ok','','Conférence cloud à Lille.'],
['swift-connection','Swift Connection','dev','2026-11-02','2026-11-03','Paris','','','agg','','Conférence Swift et iOS.'],
['agile-tour-aix-marseille','Agile Tour Aix-Marseille','agile','2026-11','','Gardanne / Aix-Marseille','','https://atmrs.esprit-agile.com','est','D\'habitude début novembre.','Étape provençale de l\'Agile Tour.'],
['capitole-du-libre','Capitole du Libre','dev','2026-11-14','2026-11-15','Toulouse','','','agg','','Week-end du logiciel libre à Toulouse.'],
['tech-show-paris','Tech Show Paris','dev','2026-11-18','2026-11-19','Paris','Paris Expo Porte de Versailles','https://www.techshowparis.fr','ok','','Salon cloud, cybersécurité et data.'],
['agile-laval','Agile Laval','agile','2026-11-19','2026-11-19','Laval','ESIEA','https://www.agilelaval.org','ok','12e édition.','Journée agile lavalloise.'],
['codeurs-en-seine','Codeurs en Seine','dev','2026-11-19','2026-11-19','Rouen','Kindarena','https://www.codeursenseine.com','ok','','Conférence développeurs rouennaise.'],
['devfest-toulouse','DevFest Toulouse','dev','2026-11-19','2026-11-19','Toulouse','','https://devfesttoulouse.fr','ok','','DevFest du GDG Toulouse.'],
['ovhcloud-summit','OVHcloud Summit','dev','2026-11-19','2026-11-19','Paris','','','agg','','Conférence annuelle d\'OVHcloud.'],
['agile-grenoble','Agile Grenoble','agile','2026-11','','Grenoble','WTC Grenoble (habituel)','https://www.agile-grenoble.org','est','D\'habitude mi ou fin novembre.','Grande conférence agile des Alpes.'],
['devfest-paris','DevFest Paris','dev','2026-11-27','2026-11-27','Nanterre','La Fabrique de la Connaissance','https://devfest.gdgparis.fr','sec','','DevFest du GDG Paris.'],
['tech-rocks-summit','Tech.Rocks Summit','dev','2026-11-30','2026-12-01','Paris','','','agg','','Sommet des leaders tech.'],
['apidays-paris','apidays Paris','dev','2026-12-01','2026-12-03','La Défense','CNIT Forest','https://www.apidays.global/events/paris','ok','','Conférence API et écosystèmes numériques.'],
['adopt-ai','Adopt AI','ia','2026-12-03','2026-12-04','Paris','Grand Palais','https://adoptai.artefact.com','ok','','Sommet sur l\'adoption de l\'IA en entreprise (Artefact).'],
['devfest-lyon','DevFest Lyon','dev','2026-12-04','2026-12-04','Lyon','Palais de la Bourse','https://devfest.gdglyon.com','sec','','DevFest du GDG Lyon.'],
['open-source-experience','Open Source Experience','dev','2026-12-09','2026-12-10','Paris','Paris Expo Porte de Versailles','https://www.opensource-experience.com','sec','','Salon européen de l\'open source.'],
['devops-rex','DevOps REX','dev','2026-12-09','2026-12-10','Paris','','','agg','','Conférence de retours d\'expérience DevOps.'],
['kcd-provence','KCD Provence','dev','2026-12-10','2026-12-10','Aix-en-Provence','Palais des Congrès','https://cloudnative-provence.fr','sec','','Kubernetes Community Days en Provence.'],
];

const GAPS = [
['devfest-nantes','DevFest Nantes','dev','Nantes','https://devfest2027.gdgnantes.com','Grand DevFest nantais du GDG Nantes.',"Pas d'édition en 2026 (travaux de la Cité des Congrès). Prochaine édition les 11 et 12 mars 2027 à la H Arena."],
['devfest-strasbourg','DevFest Strasbourg','dev','Strasbourg','https://devfest.gdgstrasbourg.fr','DevFest du GDG Strasbourg.',"Pas d'édition en 2026. Prochaine édition le 23 mars 2027."],
['agile-france','Agile France','agile','Paris','https://agile-france.web.app/','Conférence agile historique au Chalet de la Porte Jaune.',"Rien d'annoncé pour 2026 : l'événement semble en sommeil."],
['scrum-day-france','Scrum Day France','agile','Paris','','Journée Scrum du French Scrum User Group.',"Aucune édition 2026 trouvée."],
['campus-agile-grenoble','Campus Agile Grenoble','agile','Grenoble','https://www.campus-agile.org','Événement agile étudiant et pro à Grenoble.',"Édition 2026 annulée d'après le site officiel."],
['web2day','Web2day','dev','Nantes','https://www.lacantine.co','Festival du numérique nantais.',"Aucune édition 2026 trouvée."],
['agile-pays-basque','Agile Pays Basque','agile','Bidart','https://agile-paysbasque.fr','Journée agile au Pays basque (ESTIA).',"Aucune date 2026 trouvée."],
];

const w = (p, o) => { if (!existsSync(p)) writeFileSync(p, JSON.stringify(o, null, 2) + '\n'); };
for (const [slug,name,category,start,end,city,venue,url,conf,note,description] of E) {
  w(`content/events/${slug}.json`, { name, category, city, ...(url && { website: url }), description, gaps: [] });
  mkdirSync(`content/editions/${slug}`, { recursive: true });
  const past = start.length === 10 && (end || start) <= TODAY;
  w(`content/editions/${slug}/2026.json`, {
    event: slug, year: 2026, title: `${name} 2026`, start, ...(end && end !== start && { end }), city,
    ...(venue && { venue }), ...(url && { url }), dateConfidence: conf, ...(note && { note }),
    status: past ? 'pending' : 'scheduled', sessions: [],
  });
}
for (const [slug,name,category,city,url,description,gap] of GAPS) {
  w(`content/events/${slug}.json`, { name, category, city, ...(url && { website: url }), description, gaps: [{ year: 2026, note: gap }] });
}
console.log(E.length, 'editions,', GAPS.length, 'gap events');
