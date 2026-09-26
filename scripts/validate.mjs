// Consistency checks the Zod schema can't express. Run: pnpm validate
import { readdirSync, readFileSync, existsSync } from 'node:fs';

const errors = [];
const events = new Set(readdirSync('content/events').map((f) => f.replace(/\.json$/, '')));
for (const slug of readdirSync('content/editions')) {
  if (!events.has(slug)) errors.push(`editions/${slug}: no content/events/${slug}.json`);
  for (const f of readdirSync(`content/editions/${slug}`).filter((f) => f.endsWith('.json'))) {
    const p = `content/editions/${slug}/${f}`;
    let d;
    try { d = JSON.parse(readFileSync(p, 'utf8')); } catch (e) { errors.push(`${p}: invalid JSON (${e.message})`); continue; }
    if (d.event !== slug) errors.push(`${p}: event "${d.event}" != folder "${slug}"`);
    if (String(d.year) !== f.replace('.json', '')) errors.push(`${p}: year ${d.year} != file name`);
    const ids = new Set();
    for (const s of d.sessions ?? []) {
      if (ids.has(s.id)) errors.push(`${p}: duplicate session id ${s.id}`);
      ids.add(s.id);
      if (!/^[a-z0-9-]+$/.test(s.id)) errors.push(`${p}: bad session id "${s.id}"`);
      if (s.video && !s.video.youtubeId && !s.video.url) errors.push(`${p}: video without youtubeId or url in ${s.id}`);
      if (s.video?.youtubeId && !/^[\w-]{11}$/.test(s.video.youtubeId)) errors.push(`${p}: bad youtubeId in ${s.id}`);
    }
    if (d.status === 'synthesized') {
      if (!existsSync(p.replace(/\.json$/, '.md'))) errors.push(`${p}: synthesized but no .md`);
      if (!d.tldr) errors.push(`${p}: synthesized without tldr`);
    }
  }
}
// Monthly syntheses must reference existing, synthesized editions of that month.
if (existsSync('content/months')) {
  for (const f of readdirSync('content/months').filter((f) => f.endsWith('.md'))) {
    const src = readFileSync(`content/months/${f}`, 'utf8');
    const month = f.replace('.md', '');
    const fm = src.match(/^---\n([\s\S]*?)\n---/);
    if (!fm) { errors.push(`months/${f}: missing frontmatter`); continue; }
    if (!fm[1].includes(`month: "${month}"`) && !fm[1].includes(`month: '${month}'`) && !fm[1].includes(`month: ${month}`)) errors.push(`months/${f}: month field != file name`);
    const edBlock = (fm[1].match(/^editions:([\s\S]*?)(?=^\w+:|$(?![\s\S]))/m) ?? ['', ''])[1];
    const eds = [...edBlock.matchAll(/["']?([a-z0-9-]+\/\d{4})["']?/g)].map((m) => m[1]);
    for (const id of eds) {
      const p = `content/editions/${id}.json`;
      if (!existsSync(p)) { errors.push(`months/${f}: unknown edition ${id}`); continue; }
      const d = JSON.parse(readFileSync(p, 'utf8'));
      if (d.status !== 'synthesized') errors.push(`months/${f}: edition ${id} is not synthesized`);
      if (!d.start.startsWith(month)) errors.push(`months/${f}: edition ${id} is not in ${month}`);
    }
  }
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('content OK');
