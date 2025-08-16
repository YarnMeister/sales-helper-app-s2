import { z } from 'zod';

// Environment schema validation
const EnvSchema = z.object({
  NEXT_PUBLIC_APP_ENV: z.enum(['development', 'production']).default('development'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  PIPEDRIVE_API_TOKEN: z.string().min(1),
  PIPEDRIVE_SUBMIT_MODE: z.enum(['live', 'mock']).default('mock'),
});

// Validate and parse environment variables
const validateEnv = () => {
  try {
    return EnvSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      console.error('Environment validation failed:', missingVars.join('\n'));
      throw new Error(`Missing or invalid environment variables:\n${missingVars.join('\n')}`);
    }
    throw error;
  }
};

// Export validated environment configuration
export const env = validateEnv();

// Supabase configuration
export const supabaseConfig = {
  url: env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
};

// Pipedrive configuration
export const pipedriveConfig = {
  apiToken: env.PIPEDRIVE_API_TOKEN,
  submitMode: env.PIPEDRIVE_SUBMIT_MODE,
};
