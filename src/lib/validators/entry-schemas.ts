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
  PIN_MIN_LENGTH,
  PIN_MAX_LENGTH,
  MASTER_PASSWORD_MIN_LENGTH,
  MASTER_PASSWORD_MAX_LENGTH,
} from '@/lib/constants';

export const noteInputSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required.')
    .max(TITLE_MAX_LENGTH, `Title must be at most ${TITLE_MAX_LENGTH} characters.`),
  body: z
    .string()
    .min(1, 'Body is required.')
    .max(NOTE_BODY_MAX_LENGTH, `Body must be at most ${NOTE_BODY_MAX_LENGTH} characters.`),
  tags: z.array(z.string().max(TAG_MAX_LENGTH)).max(MAX_TAGS_PER_ENTRY),
  favorite: z.boolean(),
});

export const pinInputSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required.')
    .max(TITLE_MAX_LENGTH, `Title must be at most ${TITLE_MAX_LENGTH} characters.`),
  pin: z
    .string()
    .min(PIN_MIN_LENGTH, `PIN must be at least ${PIN_MIN_LENGTH} digits.`)
    .max(PIN_MAX_LENGTH, `PIN must be at most ${PIN_MAX_LENGTH} digits.`)
    .regex(/^\d+$/, 'PIN must contain only digits.'),
  notes: z.string().max(NOTES_MAX_LENGTH),
  tags: z.array(z.string().max(TAG_MAX_LENGTH)).max(MAX_TAGS_PER_ENTRY),
  favorite: z.boolean(),
});

export const entryInputSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required.')
    .max(TITLE_MAX_LENGTH, `Title must be at most ${TITLE_MAX_LENGTH} characters.`),
  username: z.string().max(USERNAME_MAX_LENGTH),
  password: z
    .string()
    .min(1, 'Password is required.')
    .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters.`),
  url: z.string().max(URL_MAX_LENGTH),
  notes: z.string().max(NOTES_MAX_LENGTH),
  tags: z.array(z.string().max(TAG_MAX_LENGTH)).max(MAX_TAGS_PER_ENTRY),
  favorite: z.boolean(),
});

export type EntryFormData = z.infer<typeof entryInputSchema>;
export type NoteFormData = z.infer<typeof noteInputSchema>;
export type PinFormData = z.infer<typeof pinInputSchema>;

export const createVaultSchema = z
  .object({
    name: z.string().min(1, 'Vault name is required.').max(TITLE_MAX_LENGTH),
    password: z
      .string()
      .min(MASTER_PASSWORD_MIN_LENGTH, 'Password is required.')
      .max(MASTER_PASSWORD_MAX_LENGTH, `Maximum ${MASTER_PASSWORD_MAX_LENGTH} characters.`),
    confirm: z.string().min(1, 'Please confirm your password.'),
  })
  .refine((data) => data.password === data.confirm, {
    message: 'Passwords do not match.',
    path: ['confirm'],
  });

export type CreateVaultFormData = z.infer<typeof createVaultSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(MASTER_PASSWORD_MIN_LENGTH, 'Current password is required.'),
    newPassword: z
      .string()
      .min(MASTER_PASSWORD_MIN_LENGTH, 'Password is too short.')
      .max(MASTER_PASSWORD_MAX_LENGTH, `Maximum ${MASTER_PASSWORD_MAX_LENGTH} characters.`),
    confirmPassword: z.string().min(1, 'Please confirm your new password.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
