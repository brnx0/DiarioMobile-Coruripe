import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import { env } from './config/env.js';
import dbPlugin from './plugins/db.js';
import authPlugin from './plugins/auth.js';
import errorHandlerPlugin from './plugins/error-handler.js';
import authRoutes from './modules/auth/auth.routes.js';
import academicRoutes from './modules/academic/academic.routes.js';
import diaryRoutes from './modules/diary/diary.routes.js';
import lessonPlansRoutes from './modules/lesson-plans/lesson-plans.routes.js';
import evaluationsRoutes from './modules/evaluations/evaluations.routes.js';

export async function buildApp() {
    const app = Fastify({
        logger: {
            level: env.LOG_LEVEL,
            transport: env.NODE_ENV === 'development'
                ? { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss.l', ignore: 'pid,hostname' } }
                : undefined,
        },
        trustProxy: true,
    });

    // Plugins de infraestrutura
    await app.register(helmet, { global: true });
    await app.register(cors, { origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(',') });
    await app.register(sensible);
    await app.register(rateLimit, {
        max: 100,
        timeWindow: '1 minute',
    });

    await app.register(errorHandlerPlugin);
    await app.register(dbPlugin);
    await app.register(authPlugin);

    // Healthcheck
    app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

    // Modulos de rota
    await app.register(authRoutes, { prefix: '/auth' });
    await app.register(academicRoutes, { prefix: '/academic' });
    await app.register(diaryRoutes, { prefix: '/diary' });
    await app.register(lessonPlansRoutes, { prefix: '/lesson-plans' });
    await app.register(evaluationsRoutes, { prefix: '/evaluations' });

    return app;
}
