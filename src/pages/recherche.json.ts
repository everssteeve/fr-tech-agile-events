import type { APIRoute } from 'astro';
import { CATEGORIES, editionPath, eventPath, formatRange, loadAll } from '../lib/data';

/** Static search index: events, editions, sessions and speakers. Loaded on demand by /recherche/. */
export const GET: APIRoute = async () => {
  const { events, editions, eventBySlug } = await loadAll();
  const items: { k: 'e' | 'd' | 's'; t: string; s: string; u: string }[] = [];
  for (const ev of events) {
    items.push({ k: 'e', t: ev.data.name, s: `${CATEGORIES[ev.data.category].label} · ${ev.data.city}`, u: eventPath(ev.id) });
  }
  for (const ed of editions) {
    const ev = eventBySlug.get(ed.data.event);
    if (!ev) continue;
    const status = ed.data.status === 'synthesized' ? 'synthèse' : ed.data.status === 'scheduled' ? 'à venir' : 'synthèse à venir';
    items.push({ k: 'd', t: ed.data.title, s: `${formatRange(ed.data.start, ed.data.end)} · ${ed.data.city} · ${status}`, u: editionPath(ed.data) });
    for (const s of ed.data.sessions) {
      items.push({ k: 's', t: s.title, s: `${s.speakers.join(', ')}${s.speakers.length ? ' · ' : ''}${ed.data.title}`, u: `${editionPath(ed.data)}#${s.id}` });
    }
    for (const w of ed.data.sessionsWithoutFeedback) {
      items.push({ k: 's', t: w, s: `${ed.data.title} · sans retour trouvé`, u: `${editionPath(ed.data)}#sans-retour` });
    }
  }
  return new Response(JSON.stringify(items), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
