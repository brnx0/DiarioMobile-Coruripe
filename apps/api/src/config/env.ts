import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

// override: true faz .env vencer variaveis globais ja setadas no SO/shell.
loadDotenv({ override: true });

const EnvSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(3000),
    HOST: z.string().default('0.0.0.0'),
    LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),

    DATABASE_URL: z.string().min(1, 'DATABASE_URL obrigatoria'),

    JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET deve ter ao menos 16 chars'),
    JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET deve ter ao menos 16 chars'),
    JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

    CORS_ORIGIN: z.string().default('*'),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('[env] Variaveis invalidas:', parsed.error.format());
    process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
