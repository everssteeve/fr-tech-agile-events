# Guide de synthèse d'une édition

Ce guide décrit comment produire ou mettre à jour la synthèse d'une édition d'événement. Il est suivi par les agents de recherche et par la routine quotidienne (`routine/daily-prompt.md`). La référence de qualité est `content/editions/agile-en-seine/2026.json` + `2026.md`.

## Fichiers

Pour l'édition `<slug>` de l'année `<year>` :

- `content/events/<slug>.json` : la série d'événements (nom, catégorie, site, chaîne YouTube). Compléter `youtube.channel` / `youtube.playlists` quand on les trouve (URL de chaîne `https://www.youtube.com/@handle` ou de playlist).
- `content/editions/<slug>/<year>.json` : métadonnées, sessions, sources (schéma dans `src/content.config.ts`).
- `content/editions/<slug>/<year>.md` : synthèse globale en Markdown, avec un frontmatter vide (`---\n---`).

Ne jamais modifier un autre événement que celui qu'on traite.

## Recherche

Sources, par ordre d'utilité :

1. **Programme officiel** : liste des sessions, types, speakers, jours. Sert de squelette.
2. **Retours participants publics** : posts LinkedIn (recherche web `site:linkedin.com/posts "<nom de l'événement>"`, hashtags, noms des speakers), articles de blog, Medium, dev.to, sketchnotes, threads Bluesky/Mastodon/X, comptes-rendus d'entreprises (blogs tech de Zenika, Octo, Ippon, etc.).
3. **Vidéos YouTube** de la chaîne officielle (ou d'un partenaire comme Devoxx FR). Récupérer la liste avec `yt-dlp --flat-playlist --print "%(id)s\t%(title)s\t%(upload_date)s" <url>`. Pour un transcript : `yt-dlp --skip-download --write-auto-subs --write-subs --sub-langs "fr.*,en.*" --sub-format vtt -o "transcripts/%(id)s" <url-video>`. Le transcript sert à résumer le contenu réel du talk.
4. **Slides** publiées (Speaker Deck, SlideShare, GitHub) et comptes-rendus des organisateurs.

Ne jamais inventer un retour, une citation, un chiffre ou un nom. Si une info ne vient que d'une source indirecte, le dire. Les retours d'un speaker sur sa propre session sont signalés `(speaker)`.

## Contenu de `<year>.json`

- `status` : `synthesized` quand la synthèse existe ; `pending` si l'événement est passé mais sans synthèse ; `scheduled` s'il est à venir.
- `synthesisUpdatedAt` : date du jour (AAAA-MM-JJ).
- `edition`, `theme`, `programUrl` si connus. Les dates `start`/`end` peuvent être corrigées si une source officielle les contredit (mettre `dateConfidence: "ok"`).
- `corpus` (1 à 3 phrases) : ce qui a été lu (combien de posts, quels types de sources, sur quelle période).
- `limits` (1 à 3 phrases) : biais et trous (J+x, biais LinkedIn, sessions sans retour, vidéos non encore publiées…).
- `tldr` : **à retenir en une phrase** (Markdown autorisé, gras sur l'essentiel).
- `keyTakeaways` : 5 à 10 actions concrètes ou leçons citées par les participants.
- `sessions[]` : une entrée par session **pour laquelle on a du contenu** (retours, transcript, slides, article). Champs :
  - `id` : slug stable (minuscules, tirets) dérivé du titre. Ne jamais le changer une fois publié.
  - `day` (AAAA-MM-JJ), `type` (`keynote` | `talk` | `workshop` | `lightning` | `roundtable` | `training` | `other`), `title` (sans guillemets), `speakers` (« Nom — Entreprise » si connu).
  - `feedbackFrom` : noms des personnes dont on a lu le retour (ou « Blog Octo », « sketchnote de X »).
  - `summary` : Markdown, 3 à 8 puces. Idées clés en **gras**, citations en *« … »*, attribution entre parenthèses. Terminer si utile par la lecture critique ou le point de débat.
  - `summarySources` : parmi `feedback`, `transcript`, `program`, `slides`, `blog`.
  - `video` (si une vidéo officielle existe) : `{ "youtubeId": "…", "title": "…", "publishedAt": "AAAA-MM-JJ", "transcript": true|false, "startSeconds": 1234 }`. Pour une vidéo hébergée ailleurs (Canal-U, Vimeo…), omettre `youtubeId` et renseigner `url`. `startSeconds` sert quand la session fait partie d'une longue vidéo (live d'une journée) : repérer le début de la session dans le transcript horodaté (fichier .vtt).
- `sessionsWithoutFeedback` : titres courts (et speaker) des sessions du programme sans aucun contenu trouvé.
- `sources` : `{ "label", "url"? }`. Programme, playlist YouTube, articles, et une ligne récapitulant les auteurs des posts LinkedIn.

Pour un gros événement (Devoxx, VivaTech, FIC…), ne pas lister les centaines de sessions : garder les keynotes et les sessions les plus commentées (15 à 40), et résumer le reste dans la synthèse globale.

- `revisit` (optionnel) : à renseigner (ex. « aucun post LinkedIn lu, quota de recherche épuisé ») quand la synthèse repose sur trop peu de retours participants. La routine quotidienne reprend ces éditions, quelques-unes par nuit, et retire le champ une fois le corpus complété.

## Contenu de `<year>.md` (synthèse globale)

Frontmatter vide puis 5 à 10 sections `### N. Titre` qui dégagent les **thèmes transverses** de l'édition (consensus, tensions, tendances, formats plébiscités, vie de l'événement). Chaque section cite qui l'a dit. Une section « tensions et critiques » et une mention des biais du corpus sont attendues. Pas de titre H1/H2 (la page les fournit). Ne pas répéter le `tldr` ni les `keyTakeaways`.

## Peu de matière

Si on ne trouve presque rien (petit événement, zéro post public), produire quand même une synthèse honnête : `corpus` et `limits` le disent, les quelques sessions documentées sont résumées (`summarySources: ["program"]` si on ne s'appuie que sur le descriptif officiel, en le disant), et la synthèse globale reste courte (2 à 4 sections) en décrivant le thème et les sujets du programme. `status` passe à `synthesized`.

## Historique des éditions

Objectif : référencer toutes les éditions d'un événement sur les 20 dernières années (ou depuis sa création), pour qu'elles soient synthétisées ensuite, au fil des nuits.

Sources, sans dépendre de la recherche web : pages « éditions précédentes » ou archives du site officiel ; sous-domaines par année (`2019.touraine.tech`, `/2018/`…) ; Wayback Machine (`curl "https://web.archive.org/cdx/search/cdx?url=<domaine>&output=json&fl=timestamp,original&collapse=timestamp:4"` pour voir les années où le site existait, puis `https://web.archive.org/web/<AAAA>/<url>` pour lire la page d'une année) ; playlists YouTube par année ; Sessionize, Conference Hall, Lanyrd (archivé), Meetup, Wikipédia.

Pour chaque édition trouvée, créer `content/editions/<slug>/<année>.json` : `event`, `year`, `title` (« Nom Année »), `start`/`end` (AAAA-MM-JJ si connus ; AAAA-MM ou AAAA sinon, avec `dateConfidence: "est"`), `city`, `venue` et `url` si connus (lien d'archive accepté), `edition` (« 5e édition ») et `theme` si connus, `status: "pending"`, `sessions: []`. Ne jamais écraser un fichier existant. Une année sans édition confirmée (pause, annulation, COVID) va dans `gaps` de l'événement, avec la raison si elle est connue ; une année simplement non documentée n'est ni créée ni mise dans `gaps`.

Quand l'événement a changé de nom (ex. DevFest Lille → DevLille, Lean Kanban France → FlowCon), rattacher les anciennes éditions au même `slug` et indiquer l'ancien nom dans `title` et `note`.

Enfin renseigner `history` dans `content/events/<slug>.json` : `checkedAt` (date du jour), `fromYear` (année de départ de la recherche), `firstEdition` (année de la première édition si connue), `note` (sources utilisées, trous restants).

## Mise à jour par transcript

Quand un transcript de session est disponible :

1. Ajouter ou mettre à jour `video` avec `transcript: true`.
2. Réécrire `summary` en combinant le contenu réel du talk (transcript) et les retours participants, en séparant clairement ce qui a été dit sur scène de ce qu'en ont retenu les participants. Ajouter `transcript` à `summarySources`.
3. Relire la synthèse globale `.md` et l'ajuster si le transcript apporte un éclairage nouveau.
4. Mettre à jour `synthesisUpdatedAt`.

## Vérification

Après modification : `pnpm validate` (schéma et cohérence), puis `pnpm build` doit passer.
