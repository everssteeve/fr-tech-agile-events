# Retours de conf' tech & agile

Calendrier des conférences tech et agiles françaises et synthèses des retours participants, édition par édition : session par session, synthèse globale, actions concrètes, vidéos.

Site : https://everssteeve.github.io/fr-tech-agile-events/

## Stack

- [Astro](https://astro.build) statique, TypeScript strict, pnpm. Déployé sur GitHub Pages par `.github/workflows/deploy.yml` à chaque push sur `main` (et chaque jour à 4 h 30 UTC).
- Contenu versionné dans `content/` (schéma : `src/content.config.ts`) :
  - `content/events/<slug>.json` : série d'événements (site, chaîne YouTube, années sans édition) ;
  - `content/editions/<slug>/<année>.json` : une édition (dates, sessions, vidéos, sources) ;
  - `content/editions/<slug>/<année>.md` : synthèse globale de l'édition.
- Règles de rédaction des synthèses : [`docs/SYNTHESIS_GUIDE.md`](docs/SYNTHESIS_GUIDE.md).

```sh
pnpm install
pnpm dev        # http://localhost:4321/fr-tech-agile-events/
pnpm validate   # cohérence du contenu
pnpm build
```

## Routine quotidienne (Mac local)

Tous les jours à 3 h (heure de Paris), launchd lance `routine/daily.sh` :

1. `scripts/plan.py` : passe les éditions terminées en `pending` et liste celles à (re)synthétiser (terminées depuis moins de 14 jours, ou synthèse manquante) ;
2. `scripts/youtube_scan.py` : lit les flux RSS des chaînes et playlists YouTube connues, repère les vidéos publiées depuis la dernière exécution et récupère leurs sous-titres (yt-dlp) ;
3. `claude -p` avec `routine/daily-prompt.md` : met à jour le calendrier, rattache les vidéos aux sessions, réécrit les résumés à partir des transcripts, met à jour les synthèses de la fenêtre de 14 jours ;
4. `pnpm validate && pnpm build`, puis commit et push de `content/` si quelque chose a changé, ce qui redéploie le site.

Installation : `routine/install.sh` (charge `~/Library/LaunchAgents/com.everssteeve.fr-tech-agile-events.daily.plist`). Journaux : `routine/logs/`. Lancement manuel : `routine/daily.sh`.

Si le Mac dort à 3 h, launchd lance la routine au réveil. Pour le réveiller automatiquement : `sudo pmset repeat wakeorpoweron MTWRFSU 02:55:00`.

Prérequis : `claude` (Claude Code, connecté), `gh` authentifié, `uv`, `yt-dlp`, `pnpm`.

## Ajouter des éditions passées

Chaque édition est un couple `<année>.json` + `<année>.md` dans `content/editions/<slug>/`. Pour remonter dans le temps, créer les fichiers avec `status: "pending"` : la routine les traite en rattrapage, ou on lance une recherche dédiée en suivant le guide.
