import fp from 'fastify-plugin';
import type { FastifyError } from 'fastify';
import { ZodError } from 'zod';

export default fp(async (fastify) => {
    fastify.setErrorHandler((error: FastifyError, request, reply) => {
        if (error instanceof ZodError) {
            return reply.code(400).send({
                statusCode: 400,
                error: 'Bad Request',
                message: 'Validacao falhou.',
                issues: error.issues,
            });
        }

        const statusCode = error.statusCode ?? 500;

        fastify.log.error(
            { err: error, url: request.url, method: request.method },
            'request failed'
        );

        if (statusCode >= 500) {
            return reply.code(500).send({
                statusCode: 500,
                error: 'Internal Server Error',
                message: 'Erro inesperado. Tente novamente mais tarde.',
            });
        }

        reply.code(statusCode).send({
            statusCode,
            error: error.name ?? 'Error',
            message: error.message,
        });
    });

    fastify.setNotFoundHandler((request, reply) => {
        reply.code(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: `Rota ${request.method} ${request.url} nao encontrada.`,
        });
    });
});
