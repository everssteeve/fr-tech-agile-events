Tu exécutes la routine quotidienne du site « Retours de conf' tech & agile » (repo courant). Tu travailles sans humain : ne pose aucune question, fais au mieux et consigne ce que tu n'as pas pu faire.

Lis d'abord `docs/SYNTHESIS_GUIDE.md` : toutes les règles de contenu s'y trouvent (schéma, format, pas d'invention, historique).

Contexte préparé par les scripts (déjà exécutés) :
- `routine/state/plan.json` : date du jour, éditions à (re)synthétiser cette nuit (`to_synthesize`), événements dont il faut rechercher les éditions passées (`history_discovery`), taille des files d'attente (`queues`).
- `routine/state/new-videos.json` : vidéos YouTube publiées depuis la dernière exécution sur les chaînes connues, avec le chemin du transcript texte quand il existe.

Ton budget de recherches web est limité (environ 200 WebSearch par exécution). Répartis-le : étape 1 ≤ 20, étape 2 ≤ 20, étape 3 ≤ 60, le reste pour l'étape 4. WebFetch sur des URL connues et `curl` ne sont pas comptés : privilégie-les (sites officiels, archives, Wayback Machine, Sessionize, playlists YouTube). Si le quota est épuisé, arrête proprement l'étape en cours : ce qui n'est pas fait reste dans les files et sera repris la nuit suivante.

Fais les étapes dans l'ordre.

## 1. Mettre à jour le calendrier
- Pour les éditions `scheduled` des 60 prochains jours et celles dont `dateConfidence` n'est pas `ok` : vérifie les dates sur le site officiel et corrige-les (`dateConfidence: "ok"` si confirmé).
- Pour chaque événement dont la dernière édition est passée : si l'édition suivante est annoncée (dates publiées), crée `content/editions/<slug>/<année>.json` avec `status: "scheduled"`.
- Si tu découvres une conférence tech ou agile française notable absente du site, crée l'événement et son édition.

## 2. Vidéos publiées depuis hier
Pour chaque entrée de `new-videos.json`, et pour les éditions de la fenêtre de 14 jours dont la page officielle liste des vidéos (page programme ou replays du site officiel) :
1. Retrouve l'édition et la session correspondantes (titre, speakers ; la vidéo peut concerner une édition antérieure).
2. Ajoute `video` à la session (`youtubeId`, `title`, `publishedAt`, `transcript`, `startSeconds` si c'est un long live). Si la session n'existait pas dans `sessions`, crée-la (et retire-la de `sessionsWithoutFeedback`).
3. Si un transcript est disponible, mets à jour le résumé de la session selon « Mise à jour par transcript » du guide, puis la synthèse globale (`.md`) de l'édition.
4. Si la chaîne YouTube de l'événement n'est pas encore renseignée dans `content/events/<slug>.json`, ajoute-la.

## 3. Historique : éditions passées (file `history_discovery`)
Pour chaque événement de `plan.json > history_discovery`, applique la section « Historique des éditions » du guide : retrouve toutes les éditions depuis `historyFromYear` (ou depuis la première édition si elle est plus récente), crée pour chacune un fichier `content/editions/<slug>/<année>.json` en `status: "pending"` (sans synthèse), puis renseigne `history` dans `content/events/<slug>.json` (`checkedAt` = aujourd'hui, `fromYear`, `firstEdition`, `note`). Ne marque `checkedAt` que si la recherche est allée au bout ; sinon laisse le champ vide pour que l'événement revienne dans la file.

## 4. Synthèses (file `to_synthesize`)
Pour chaque édition de `plan.json > to_synthesize`, selon sa raison :
- « fenêtre de 14 jours » : si `pending`, produis la synthèse complète ; si déjà `synthesized`, cherche les nouveaux retours publiés depuis `synthesisUpdatedAt` et intègre-les sans réécrire ce qui n'a pas changé.
- « file d'attente » : édition passée jamais synthétisée (souvent une édition historique). Produis la synthèse complète. Pour une édition ancienne, les sources sont surtout le programme archivé (Wayback Machine), les vidéos, les blogs de l'époque et les slides ; applique « Peu de matière » si besoin et pose `revisit` si le corpus est mince.
- « à compléter » : la synthèse manque de retours participants (champ `revisit`). Cherche en priorité posts LinkedIn, blogs et vidéos, intègre-les, puis supprime `revisit` si le corpus est désormais satisfaisant (sinon mets à jour sa raison).
- Mets `synthesisUpdatedAt` à la date du jour.
Délègue chaque édition à un sous-agent (outil Agent) en lui donnant le chemin du guide et les fichiers concernés, puis vérifie son résultat. Lance au plus 4 sous-agents en parallèle. Un sous-agent ne modifie que les fichiers de son édition (`content/editions/<slug>/<année>.json` et `.md`) : s'il trouve une info pour `content/events/<slug>.json` (chaîne YouTube, gaps…), il te la renvoie dans sa réponse et c'est toi qui l'écris, pour éviter que deux sous-agents écrasent le même fichier.

## 5. Vérifier
Lance `pnpm validate` puis `pnpm build`. Corrige les erreurs jusqu'à ce que les deux passent. Ne fais pas de commit : le script appelant s'en charge.

## 6. Compte rendu
Termine par un résumé en français de 12 lignes max : éditions synthétisées ou mises à jour, éditions historiques découvertes (par événement), vidéos ajoutées, transcripts intégrés, dates corrigées, état des files d'attente, erreurs rencontrées (dont quota épuisé). Écris ce même résumé dans `routine/state/last-report.md`.
