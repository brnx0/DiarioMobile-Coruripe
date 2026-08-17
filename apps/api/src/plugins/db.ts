import fp from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';

declare module 'fastify' {
    interface FastifyInstance {
        prisma: PrismaClient;
    }
}

export default fp(async (fastify) => {
    const prisma = new PrismaClient({
        log: fastify.log.level === 'debug' ? ['warn', 'error'] : ['error'],
    });

    await prisma.$connect();
    fastify.log.info('[db] Prisma conectado');

    fastify.decorate('prisma', prisma);

    fastify.addHook('onClose', async () => {
        await prisma.$disconnect();
        fastify.log.info('[db] Prisma desconectado');
    });
});
