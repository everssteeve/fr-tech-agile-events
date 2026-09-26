import { getCollection, type CollectionEntry } from 'astro:content';
import { marked } from 'marked';

export type EventEntry = CollectionEntry<'events'>;
export type EditionEntry = CollectionEntry<'editions'>;
export type Edition = EditionEntry['data'];
export type Session = Edition['sessions'][number];
export type Category = EventEntry['data']['category'];

export const CATEGORIES: Record<Category, { label: string; short: string }> = {
  agile: { label: 'Agile & Lean', short: 'Agile' },
  produit: { label: 'Produit & UX', short: 'Produit' },
  dev: { label: 'Dev, cloud & sécu', short: 'Dev' },
  ia: { label: 'IA & data', short: 'IA' },
};

export const SESSION_TYPES: Record<Session['type'], string> = {
  keynote: 'Keynote',
  talk: 'Conférence',
  workshop: 'Atelier',
  lightning: 'Lightning talk',
  roundtable: 'Table ronde',
  training: 'Formation',
  other: 'Session',
};

export const CONFIDENCE: Record<Edition['dateConfidence'], string | null> = {
  ok: null,
  sec: 'source secondaire',
  agg: 'date à vérifier',
  est: 'date estimée',
};

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const WEEKDAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

export const monthName = (m: number): string => MONTHS[m] ?? '';

/** Today in Europe/Paris, as YYYY-MM-DD (build time). */
export function today(): string {
  return new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris' }).format(new Date());
}

const parse = (s: string): Date => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1));
};

export function formatRange(start: string, end?: string): string {
  if (start.length === 4) return `${start} (date précise inconnue)`;
  if (start.length === 7) return `${monthName(Number(start.slice(5, 7)) - 1)} ${start.slice(0, 4)} (date estimée)`;
  const a = parse(start);
  const b = parse(end ?? start);
  const y = a.getUTCFullYear();
  if (start === (end ?? start)) return `${a.getUTCDate()} ${monthName(a.getUTCMonth())} ${y}`;
  if (a.getUTCMonth() === b.getUTCMonth()) return `${a.getUTCDate()}–${b.getUTCDate()} ${monthName(a.getUTCMonth())} ${y}`;
  return `${a.getUTCDate()} ${monthName(a.getUTCMonth())} – ${b.getUTCDate()} ${monthName(b.getUTCMonth())} ${y}`;
}

export function formatDay(day: string): string {
  const d = parse(day);
  return `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate()} ${monthName(d.getUTCMonth())}`;
}

export function when(e: Edition, ref = today()): 'past' | 'live' | 'upcoming' {
  if (e.start.length === 4) return e.start < ref.slice(0, 4) ? 'past' : 'upcoming';
  if (e.start.length === 7) return e.start < ref.slice(0, 7) ? 'past' : 'upcoming';
  const end = e.end ?? e.start;
  if (end < ref) return 'past';
  if (e.start <= ref) return 'live';
  return 'upcoming';
}

export const md = (s: string): string => marked.parse(s, { async: false });
export const mdInline = (s: string): string => marked.parseInline(s, { async: false });

export const href = (path: string): string => `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
export const editionPath = (e: Edition): string => href(`evenements/${e.event}/${e.year}/`);
export const eventPath = (slug: string): string => href(`evenements/${slug}/`);

export type MonthEntry = CollectionEntry<'months'>;

/** Month key (YYYY-MM) of an edition, or null when only the year is known. */
export const monthKey = (e: Edition): string | null => (e.start.length >= 7 ? e.start.slice(0, 7) : null);

export const monthLabel = (key: string): string => `${monthName(Number(key.slice(5, 7)) - 1)} ${key.slice(0, 4)}`;
export const monthPath = (key: string): string => href(`mois/${key}/`);

/** Rewrite relative links written for /mois/<key>/ pages so they work from any page. */
export const fixMonthLinks = (html: string): string =>
  html.replace(/href="(?:\.\.\/)+evenements\//g, `href="${href('evenements/')}`);

/** Monday–Sunday of the week containing `ref` (YYYY-MM-DD). */
export function weekOf(ref: string): { start: string; end: string } {
  const d = parse(ref);
  const dow = (d.getUTCDay() + 6) % 7;
  const mon = new Date(d.getTime() - dow * 86400000);
  const sun = new Date(mon.getTime() + 6 * 86400000);
  const iso = (x: Date) => x.toISOString().slice(0, 10);
  return { start: iso(mon), end: iso(sun) };
}

export async function loadAll() {
  const [events, editions, syntheses, months] = await Promise.all([
    getCollection('events'),
    getCollection('editions'),
    getCollection('syntheses'),
    getCollection('months'),
  ]);
  const eventBySlug = new Map(events.map((e) => [e.id, e]));
  const sorted = editions.sort((a, b) => a.data.start.localeCompare(b.data.start) || a.data.title.localeCompare(b.data.title));
  const synthesisById = new Map(syntheses.map((s) => [s.id, s]));
  const monthByKey = new Map(months.map((m) => [m.data.month, m]));
  return { events, editions: sorted, eventBySlug, synthesisById, months, monthByKey };
}
