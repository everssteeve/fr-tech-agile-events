/** Wires LibButton toggles to the reader's library. Client-side only. */
import { isMarked, isRead, setRead, subscribe, toggleMark, type MarkKind } from './library';

const cascadeOf = (b: HTMLElement): string[] => (b.dataset.cascade ? (JSON.parse(b.dataset.cascade) as string[]) : []);

/** A read toggle is on when its id is read, or when every id it cascades to is read. */
function readOn(b: HTMLElement): boolean {
  const c = cascadeOf(b);
  return isRead(b.dataset.read!) || (c.length > 0 && c.every(isRead));
}

export function bindLibrary(announce?: (msg: string) => void): void {
  const markBtns = [...document.querySelectorAll<HTMLButtonElement>('button[data-mark]')];
  const readBtns = [...document.querySelectorAll<HTMLButtonElement>('button[data-read]')];

  markBtns.forEach((b) =>
    b.addEventListener('click', () => {
      const d = b.dataset;
      const on = toggleMark({
        id: d.mark!,
        kind: d.kind as MarkKind,
        title: d.title ?? '',
        context: d.from || undefined,
        url: d.url ?? location.pathname,
        video: d.video || undefined,
      });
      announce?.(on ? 'Ajouté à vos favoris' : 'Retiré de vos favoris');
    }),
  );
  readBtns.forEach((b) =>
    b.addEventListener('click', () => {
      const on = !readOn(b);
      setRead([b.dataset.read!, ...cascadeOf(b)], on);
      // Unreading a part unreads the whole it belongs to (a session → its edition).
      if (!on && b.dataset.parent) setRead(b.dataset.parent, false);
      announce?.(on ? 'Marqué comme lu' : 'Marqué comme non lu');
    }),
  );

  subscribe(() => {
    markBtns.forEach((b) => b.setAttribute('aria-pressed', String(isMarked(b.dataset.mark!))));
    readBtns.forEach((b) => b.setAttribute('aria-pressed', String(readOn(b))));
  });
}
