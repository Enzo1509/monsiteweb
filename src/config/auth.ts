import { z } from 'zod';

const envSchema = z.object({
  VITE_GOOGLE_CLIENT_ID: z.string().min(1, 'Google Client ID is required'),
});

const env = envSchema.parse({
  VITE_GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
});

export const authConfig = {
  googleClientId: env.VITE_GOOGLE_CLIENT_ID,
} as const;