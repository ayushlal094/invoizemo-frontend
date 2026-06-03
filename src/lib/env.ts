import { z } from 'zod';

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().url({ message: 'VITE_API_BASE_URL must be a valid URL' }),
  VITE_VAPID_PUBLIC_KEY: z.string().optional(),
  VITE_ENABLE_REAL_TIME: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
});

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid frontend environment configuration. Check .env.example');
}

export const env = parsed.data;
