/**
 * Reader's personal library, kept in this browser only (localStorage): what they have read, and what they bookmarked.
 * Client-side module: never import `astro:content` here.
 *
 * Ids:
 * - edition: `<event>/<year>`
 * - session: `<event>/<year>#<sessionId>`
 * - takeaway: `<event>/<year>~<hash of the text>` (the text is rewritten by the nightly routine, so the snapshot matters)
 * - month: `mois/<YYYY-MM>`
 */

export type MarkKind = 'edition' | 'session' | 'takeaway' | 'month';

export interface Mark {
  id: string;
  kind: MarkKind;
  /** Snapshot taken when bookmarking, so the bookmark survives content rewrites. */
  title: string;
  /** Where it comes from (e.g. "Agile en Seine 2026"). */
  context?: string;
  url: string;
  video?: string;
  addedAt: string;
}

interface State {
  v: 1;
  /** id → ISO date it was marked as read. */
  read: Record<string, string>;
  marks: Record<string, Mark>;
}

const KEY = 'ftae:library';
const EVENT = 'ftae:library';
const empty = (): State => ({ v: 1, read: {}, marks: {} });

let cache: State | null = null;

function load(): State {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    const s = raw ? (JSON.parse(raw) as Partial<State>) : null;
    cache = { v: 1, read: s?.read ?? {}, marks: s?.marks ?? {} };
  } catch {
    cache = empty();
  }
  return cache;
}

function save(s: State): void {
  cache = s;
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // Private mode or storage full: state still works for this page view.
  }
  dispatchEvent(new Event(EVENT));
}

/** Whether this browser can keep the library across visits. */
export function persistent(): boolean {
  try {
    localStorage.setItem(`${KEY}:t`, '1');
    localStorage.removeItem(`${KEY}:t`);
    return true;
  } catch {
    return false;
  }
}

export const isRead = (id: string): boolean => id in load().read;
export const readAt = (id: string): string | undefined => load().read[id];

export function setRead(ids: string | string[], on: boolean): void {
  const s = load();
  const read = { ...s.read };
  const now = new Date().toISOString();
  for (const id of Array.isArray(ids) ? ids : [ids]) {
    if (on) read[id] ??= now;
    else delete read[id];
  }
  save({ ...s, read });
}

export const isMarked = (id: string): boolean => id in load().marks;

export function toggleMark(m: Omit<Mark, 'addedAt'>): boolean {
  const s = load();
  const marks = { ...s.marks };
  const on = !(m.id in marks);
  if (on) marks[m.id] = { ...m, addedAt: new Date().toISOString() };
  else delete marks[m.id];
  save({ ...s, marks });
  return on;
}

export function removeMark(id: string): void {
  const s = load();
  const marks = { ...s.marks };
  delete marks[id];
  save({ ...s, marks });
}

export const marks = (): Mark[] => Object.values(load().marks).sort((a, b) => b.addedAt.localeCompare(a.addedAt));
export const readEntries = (): [string, string][] => Object.entries(load().read).sort((a, b) => b[1].localeCompare(a[1]));

/** Count of read ids among `ids`. */
export const readCount = (ids: string[]): number => ids.filter(isRead).length;

/** Short stable hash for ids derived from text. */
export function hash(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

/** Run `fn` now and whenever the library changes (this tab or another one). */
export function subscribe(fn: () => void): void {
  fn();
  addEventListener(EVENT, fn);
  addEventListener('storage', (e) => {
    if (e.key === KEY) {
      cache = null;
      fn();
    }
  });
}

export const exportJson = (): string => JSON.stringify(load(), null, 2);

/** Merge an exported library into the current one; returns the number of items added. */
export function importJson(text: string): number {
  const other = JSON.parse(text) as Partial<State>;
  if (!other || typeof other !== 'object' || (!other.read && !other.marks)) throw new Error('format');
  const s = load();
  const before = Object.keys(s.read).length + Object.keys(s.marks).length;
  const next: State = { v: 1, read: { ...(other.read ?? {}), ...s.read }, marks: { ...(other.marks ?? {}), ...s.marks } };
  save(next);
  return Object.keys(next.read).length + Object.keys(next.marks).length - before;
}

export function clearAll(): void {
  save(empty());
}
