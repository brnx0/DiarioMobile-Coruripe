import { buildApp } from './app.js';
import { env } from './config/env.js';

async function bootstrap() {
    const app = await buildApp();

    try {
        await app.listen({ port: env.PORT, host: env.HOST });
        app.log.info(`API rodando em http://${env.HOST}:${env.PORT}`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}

bootstrap();
