Tu exécutes la routine quotidienne du site « Retours de conf' tech & agile » (repo courant). Tu travailles sans humain : ne pose aucune question, fais au mieux et consigne ce que tu n'as pas pu faire.

Lis d'abord `docs/SYNTHESIS_GUIDE.md` : toutes les règles de contenu s'y trouvent (schéma, format, pas d'invention).

Contexte préparé par les scripts (déjà exécutés) :
- `routine/state/plan.json` : date du jour et éditions à (re)synthétiser.
- `routine/state/new-videos.json` : vidéos YouTube publiées depuis la dernière exécution sur les chaînes connues, avec le chemin du transcript texte quand il existe.

Fais les étapes dans l'ordre.

## 1. Mettre à jour le calendrier
- Pour les éditions `scheduled` des 60 prochains jours et celles dont `dateConfidence` n'est pas `ok` : vérifie les dates sur le site officiel et corrige-les (`dateConfidence: "ok"` si confirmé).
- Pour chaque événement de `content/events/` dont la dernière édition est passée : si l'édition suivante est annoncée (dates publiées), crée `content/editions/<slug>/<année>.json` avec `status: "scheduled"`.
- Si tu découvres une conférence tech ou agile française notable absente du site, crée l'événement et son édition.
- Limite-toi à 15 minutes de recherche pour cette étape.

## 2. Vidéos publiées depuis hier
Pour chaque entrée de `new-videos.json`, et aussi pour les éditions de la fenêtre de 14 jours dont la page officielle liste des vidéos YouTube (vérifie la page programme / replays du site officiel) :
1. Retrouve l'édition et la session correspondantes (titre, speakers ; la vidéo peut concerner une édition antérieure).
2. Ajoute `video` à la session (`youtubeId`, `title`, `publishedAt`, `transcript`). Si la session n'existait pas dans `sessions`, crée-la (et retire-la de `sessionsWithoutFeedback`).
3. Si un transcript est disponible (`transcript` dans `new-videos.json`, ou récupérable avec yt-dlp comme indiqué dans le guide), mets à jour le résumé de la session selon la section « Mise à jour par transcript » du guide, puis mets à jour la synthèse globale (`.md`) de l'édition.
4. Si la chaîne YouTube de l'événement n'est pas encore renseignée dans `content/events/<slug>.json`, ajoute-la.

## 3. Synthèses de la fenêtre de 14 jours
Pour chaque édition de `plan.json > to_synthesize` :
- `pending` : produis la synthèse complète (recherche web des retours participants, programme, vidéos).
- déjà `synthesized` : cherche les nouveaux retours publiés depuis `synthesisUpdatedAt` et intègre-les (sessions, synthèse globale, corpus, limites, sources). Ne réécris pas ce qui n'a pas changé.
- Mets `synthesisUpdatedAt` à la date du jour.
S'il y a plus de 3 éditions à traiter, délègue chaque édition à un sous-agent (outil Agent) en lui donnant le chemin du guide et les fichiers concernés, puis vérifie le résultat.

## 4. Vérifier
Lance `pnpm validate` puis `pnpm build`. Corrige les erreurs jusqu'à ce que les deux passent. Ne fais pas de commit : le script appelant s'en charge.

## 5. Compte rendu
Termine par un résumé en français de 10 lignes max : éditions mises à jour, vidéos ajoutées, transcripts intégrés, dates corrigées, erreurs rencontrées. Écris ce même résumé dans `routine/state/last-report.md`.
