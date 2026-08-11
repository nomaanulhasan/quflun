import { z } from 'zod/v4';
import {
  TITLE_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  USERNAME_MAX_LENGTH,
  URL_MAX_LENGTH,
  NOTES_MAX_LENGTH,
  NOTE_BODY_MAX_LENGTH,
  MAX_TAGS_PER_ENTRY,
  TAG_MAX_LENGTH,
} from '@/lib/constants';

export const entryInputSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required.')
    .max(TITLE_MAX_LENGTH, `Title must be at most ${TITLE_MAX_LENGTH} characters.`),
  username: z.string().max(USERNAME_MAX_LENGTH).optional().default(''),
  password: z
    .string()
    .min(1, 'Password is required.')
    .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters.`),
  url: z.string().max(URL_MAX_LENGTH).optional().default(''),
  notes: z.string().max(NOTES_MAX_LENGTH).optional().default(''),
  tags: z.array(z.string().max(TAG_MAX_LENGTH)).max(MAX_TAGS_PER_ENTRY).optional().default([]),
  favorite: z.boolean().optional().default(false),
});

export const noteInputSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required.')
    .max(TITLE_MAX_LENGTH, `Title must be at most ${TITLE_MAX_LENGTH} characters.`),
  body: z
    .string()
    .min(1, 'Body is required.')
    .max(NOTE_BODY_MAX_LENGTH, `Body must be at most ${NOTE_BODY_MAX_LENGTH} characters.`),
  tags: z.array(z.string().max(TAG_MAX_LENGTH)).max(MAX_TAGS_PER_ENTRY).optional().default([]),
  favorite: z.boolean().optional().default(false),
});

export type EntryFormData = z.infer<typeof entryInputSchema>;
export type NoteFormData = z.infer<typeof noteInputSchema>;
