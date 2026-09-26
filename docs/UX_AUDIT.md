# Audit UX/UI · 26 septembre 2026

Deux évaluations indépendantes, sans visibilité l'une sur l'autre : une revue de design (navigateur desktop 1280 px et mobile 390 px, modes clair et sombre, lecture du code) et un scan automatique (détecteur impeccable + calculs de contraste, cibles tactiles, poids des pages). Référentiel : `PRODUCT.md` (principes « le temps est l'interface », « toujours une sortie », « la lecture d'abord », « montrer l'incertitude »).

## Score

| # | Heuristique de Nielsen | Note | Constat principal |
|---|---|---|---|
| 1 | Visibilité de l'état | 2 | Mois/année courants invisibles en scrollant ; filtre restauré en silence ; compteur figé |
| 2 | Correspondance avec le réel | 3 | Dates sans mois sur la fiche événement ; « Site officiel » pointant vers une archive |
| 3 | Contrôle et liberté | 1 | Ni retour en haut, ni saut vers une année ; scroll animé imposé sur 77 000 px |
| 4 | Cohérence et standards | 2 | Un même style d'étiquette pour 4 sens ; niveaux de titres sautés |
| 5 | Prévention des erreurs | 3 | Peu de risques (site statique) |
| 6 | Reconnaissance plutôt que rappel | 2 | Pas d'index des sessions ; années synthétisées non signalées |
| 7 | Flexibilité et efficacité | 1 | Pas de recherche ; 793 tabulations pour atteindre la semaine |
| 8 | Esthétique et minimalisme | 3 | Sobre, mais « hero metrics », callout à bordure gauche, excès de gras |
| 9 | Récupération | 2 | Pages en attente sans étape suivante |
| 10 | Aide | 3 | Page Méthode solide, non reliée aux étiquettes |
| | **Total** | **22/40** | Base saine, orientation dans le temps insuffisante |

Audit technique : accessibilité 2/4, performance 2/4, responsive 2/4, thèmes 3/4, anti-patterns 3/4 (**12/20**).

## Problèmes prioritaires

| Sév. | Problème | Correctif retenu |
|---|---|---|
| P0 | L'accueil est un puits de 82 000 px (135 000 px sur mobile) ; le menu est inaccessible depuis la semaine en cours (header non sticky sur mobile) | Header toujours accessible (sticky compact + menu sur mobile) ; accueil limité aux 12 derniers mois et à l'avenir ; pages par année pour l'historique ; sélecteur « Aller à » ; bouton flottant « Haut / Aujourd'hui » ; lien d'évitement |
| P0 | Défilement animé de 1,5 s sur tout l'historique à chaque ouverture | Positionnement instantané, sans animation |
| P1 | Filtre restauré sans le dire ; compteur qui ne suit pas le filtre | Plus de filtre persistant ; compteur filtré annoncé (aria-live) ; bouton « Tout afficher » |
| P1 | On perd le mois et l'année en scrollant | Titres de mois collants sous la barre ; année dans le libellé de la semaine |
| P1 | Longues synthèses sans outils de navigation (23 000 à 31 000 px) | Sommaire latéral collant (desktop) ou dépliable (mobile) avec index des sessions par jour et filtre texte ; sessions sans jour en dernier ; lien vers la synthèse du mois ; lien « # » copiable par session |
| P1 | Contrastes sous WCAG AA : lignes passées à 60 % d'opacité (2,4:1), texte `--faint` (2,8:1), accent (4,3:1), étiquettes IA/Produit, « en cours » en sombre (2,6:1) | Suppression de l'opacité ; tokens assombris (clair) / éclaircis (sombre) ; texte sur accent via token |
| P1 | Pas de recherche (72 événements, 800+ éditions, 500+ sessions) | Page Recherche : événements, éditions, sessions et orateurs, index statique chargé à la demande, raccourci « / » |
| P2 | Barre de filtres mobile sur 2 lignes, étiquette coupée ; cibles de 22 à 34 px | Barre défilante sur une ligne ; cibles de 44 px sur mobile |
| P2 | Accueil sans h1 ; h1 → h3 sur Méthode et les mois ; h2 → h4 sur les éditions | Hiérarchie de titres corrigée partout |
| P2 | Callout à bordure gauche (TL;DR) et « hero metrics » : tics de design générique | Chapô typographique sans encadré ; métadonnées sur une ligne |
| P2 | Une étiquette pointillée pour 4 sens (fiabilité, état, type de session, thème) | Vocabulaire distinct : types en texte mono, thèmes en liens vers leurs sections, fiabilité reliée à la Méthode |
| P2 | Édition en attente sans suite ; années non distinguées | Lien vers la dernière synthèse de l'événement et vers le programme ; pastilles d'années marquées quand une synthèse existe ; « Site archivé » quand l'URL est une archive |
| P2 | Fiche événement : dates sans mois, catégorie répétée, années sans édition reléguées en bas | Dates avec mois, catégorie retirée des lignes, trous intégrés dans la chronologie |
| P3 | Microtypographie française (espaces avant « : ; ? ! » et dans les guillemets) | Espaces fines insécables ajoutées au rendu |
| P3 | Vidéo : focus perdu au clic ; lien externe non signalé | Focus sur le lecteur ; « ↗ » et mention « nouvel onglet » |
| P3 | Liste des mois : sessions sans retour en paragraphe dense ; « Mois » peu explicite | Liste à puces ; menu « Synthèses du mois » |

## Parcours testés

- **Point hebdomadaire (desktop)** : arrivée après un défilement animé, filtre peut-être restauré en silence, rien pour « la semaine dernière / la semaine prochaine ».
- **Speaker sur téléphone, Agile Tour Rennes 2026** : parcours le plus cassé. Menu à 128 000 px au-dessus, pas de recherche, sessions à 7 800 px dans une page de 31 000 px, session sans retour noyée dans un paragraphe.
- **Utilisateur avancé, Devoxx 2019** : le chemin fonctionne, mais dates sans mois, éditions en attente non signalées, trous relégués.

## Hors périmètre de cette passe

- Les tirets cadratins et l'excès de gras sont dans le contenu généré : le guide de rédaction est mis à jour pour les éviter, la correction du stock se fera au fil des régénérations.
- Polices Google Fonts non auto-hébergées (3 familles, 8 graisses) : gain modeste, à traiter plus tard.

## Implémenté (26 septembre 2026)

- **Toujours une sortie** : header collant sur toutes les tailles d'écran, menu dépliable sur mobile, bouton flottant « Haut », lien d'évitement « Aller au contenu », raccourci « / » vers la recherche.
- **Accueil** : fenêtre des 12 derniers mois et de l'avenir (131 Ko au lieu de 644 Ko, 20 000 px au lieu de 135 000 sur mobile) ; pages `/annee/<AAAA>/` pour l'historique, reliées par « Plus tôt » et par le sélecteur « Aller à » (mois de la page, années) ; bouton « Aujourd'hui » ; positionnement instantané sur la semaine, sans animation ; titres de mois collants ; année dans le libellé de la semaine.
- **Filtres** : plus de filtre restauré en silence, compteur filtré annoncé, bouton « Tout afficher », barre mobile sur une ligne défilante.
- **Synthèses d'édition** : fil d'Ariane, sommaire collant (colonne en desktop, panneau dépliable en mobile) avec les sections de la synthèse globale et un index des sessions filtrable par titre ou orateur ; chapô à la place du callout ; métadonnées sur une ligne ; lien vers la synthèse du mois ; bouton « # » pour copier le lien d'une session ; sessions sans jour en dernier ; sessions sans retour en liste ; pastilles d'années marquées quand une synthèse existe ; page d'attente avec étapes suivantes ; « Site archivé » pour les URL d'archive ; liens externes signalés.
- **Fiche événement** : dates avec mois, catégorie retirée des lignes, trous intégrés à la chronologie, saut par année, prochaine édition et dernière synthèse mises en avant.
- **Liste des événements** : filtre par nom ou ville, prochaine édition sur chaque fiche.
- **Synthèses du mois** : chapô, thèmes cliquables vers leurs sections, titres par mois dans la liste.
- **Recherche** : `/recherche/` sur événements, éditions, sessions et orateurs (index statique chargé à la demande), filtrable par type.
- **Accessibilité** : tokens de couleur conformes AA dans les deux thèmes, plus d'opacité sur les lignes passées, un h1 par page et aucun niveau de titre sauté, liens de ligne au nom court (plus de liens englobant tout le texte), cibles de 44 px sur écran tactile, focus rendu au lecteur vidéo.
- **Typographie** : espaces fines insécables françaises au rendu ; guide de rédaction : pas de tiret cadratin, gras limité.

Détecteur impeccable après correctifs : 0 constat sur `src/`.
