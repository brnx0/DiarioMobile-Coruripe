import type { FastifyPluginAsync } from 'fastify';
import { LoginRequestSchema, RefreshRequestSchema } from '@diariomobile/shared-schemas';
import { AuthError, AuthService } from './auth.service.js';

const authRoutes: FastifyPluginAsync = async (fastify) => {
    const service = new AuthService(fastify.prisma);

    // POST /auth/login
    fastify.post('/login', {
        config: {
            rateLimit: {
                max: 5,
                timeWindow: '1 minute',
            },
        },
    }, async (req, reply) => {
        const body = LoginRequestSchema.parse(req.body);

        try {
            const result = await service.login(body.login, body.senha);
            return reply.code(200).send(result);
        } catch (err) {
            if (err instanceof AuthError) {
                return reply.code(err.httpStatus).send({
                    statusCode: err.httpStatus,
                    error: err.code,
                    message: err.message,
                });
            }
            throw err;
        }
    });

    // POST /auth/refresh
    fastify.post('/refresh', async (req, reply) => {
        const body = RefreshRequestSchema.parse(req.body);

        try {
            const result = await service.refresh(body.refreshToken);
            return reply.code(200).send(result);
        } catch (err) {
            if (err instanceof AuthError) {
                return reply.code(err.httpStatus).send({
                    statusCode: err.httpStatus,
                    error: err.code,
                    message: err.message,
                });
            }
            throw err;
        }
    });

    // GET /auth/me (protegido)
    fastify.get('/me', { onRequest: [fastify.authenticate] }, async (req, reply) => {
        const user = await service.getMe(req.user.sub);
        return reply.code(200).send(user);
    });
};

export default authRoutes;
