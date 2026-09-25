import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const category = z.enum(['agile', 'produit', 'dev', 'ia']);

/** An event series (e.g. "Agile en Seine"), independent of any given year. */
const events = defineCollection({
  loader: glob({ pattern: '*.json', base: './content/events' }),
  schema: z.object({
    name: z.string(),
    category,
    city: z.string(),
    website: z.string().url().optional(),
    description: z.string(),
    youtube: z
      .object({
        channel: z.string().url().optional(),
        playlists: z.array(z.string().url()).default([]),
      })
      .optional(),
    /** Editions known not to exist, with the reason (e.g. "pas d'édition en 2026"). */
    gaps: z.array(z.object({ year: z.number().int(), note: z.string() })).default([]),
  }),
});

const video = z.object({
  youtubeId: z.string(),
  title: z.string().optional(),
  publishedAt: z.string().optional(),
  /** Offset in seconds when the session is part of a longer video (livestream). */
  startSeconds: z.number().int().nonnegative().optional(),
  transcript: z.boolean().default(false),
});

const session = z.object({
  id: z.string(),
  day: z.string().optional(),
  type: z.enum(['keynote', 'talk', 'workshop', 'lightning', 'roundtable', 'training', 'other']),
  title: z.string(),
  speakers: z.array(z.string()).default([]),
  /** Who gave feedback (participants, sketchnoters, speakers flagged "(speaker)"). */
  feedbackFrom: z.array(z.string()).default([]),
  /** Markdown synthesis of the session. */
  summary: z.string().default(''),
  /** What the summary is built from. */
  summarySources: z.array(z.enum(['feedback', 'transcript', 'program', 'slides', 'blog'])).default([]),
  video: video.optional(),
});

/** One edition of an event (e.g. Agile en Seine 2026). Global synthesis lives in the sibling .md file. */
const editions = defineCollection({
  loader: glob({ pattern: '*/*.json', base: './content/editions' }),
  schema: z.object({
    event: z.string(),
    year: z.number().int(),
    title: z.string(),
    edition: z.string().optional(),
    start: z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/),
    end: z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/).optional(),
    city: z.string(),
    venue: z.string().optional(),
    url: z.string().url().optional(),
    programUrl: z.string().url().optional(),
    theme: z.string().optional(),
    /** ok = official source, sec = ticketing/secondary, agg = aggregator only, est = estimated month. */
    dateConfidence: z.enum(['ok', 'sec', 'agg', 'est']).default('ok'),
    note: z.string().optional(),
    status: z.enum(['scheduled', 'pending', 'synthesized']),
    synthesisUpdatedAt: z.string().optional(),
    /** Synthesis made with too few participant sources: the daily routine revisits it (a few per night). */
    revisit: z.string().optional(),
    corpus: z.string().optional(),
    limits: z.string().optional(),
    tldr: z.string().optional(),
    keyTakeaways: z.array(z.string()).default([]),
    sessions: z.array(session).default([]),
    sessionsWithoutFeedback: z.array(z.string()).default([]),
    sources: z.array(z.object({ label: z.string(), url: z.string().url().optional() })).default([]),
  }),
});

/** Global synthesis (Markdown) of an edition: content/editions/<event>/<year>.md */
const syntheses = defineCollection({
  loader: glob({ pattern: '*/*.md', base: './content/editions' }),
  schema: z.object({}).passthrough(),
});

export const collections = { events, editions, syntheses };
