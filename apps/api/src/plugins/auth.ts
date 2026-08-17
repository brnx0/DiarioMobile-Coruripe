import fp from 'fastify-plugin';
import jwtPlugin from '@fastify/jwt';
import { env } from '../config/env.js';
import type { JwtAccessPayload } from '@diariomobile/shared-types';

declare module '@fastify/jwt' {
    interface FastifyJWT {
        payload: JwtAccessPayload;
        user: JwtAccessPayload;
    }
}

declare module 'fastify' {
    interface FastifyInstance {
        authenticate: (req: import('fastify').FastifyRequest, reply: import('fastify').FastifyReply) => Promise<void>;
    }
}

export default fp(async (fastify) => {
    await fastify.register(jwtPlugin, {
        secret: env.JWT_ACCESS_SECRET,
        sign: { expiresIn: env.JWT_ACCESS_EXPIRES_IN },
    });

    fastify.decorate('authenticate', async (req, reply) => {
        try {
            const authorization = req.headers.authorization;
            if (authorization && !authorization.toLowerCase().startsWith('bearer ')) {
                req.headers.authorization = `Bearer ${authorization}`;
            }

            await req.jwtVerify();
        } catch {
            reply.code(401).send({
                statusCode: 401,
                error: 'Unauthorized',
                message: 'Token invalido ou expirado.',
            });
        }
    });
});
