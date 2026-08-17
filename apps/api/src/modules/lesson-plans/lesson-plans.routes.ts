import type { FastifyPluginAsync } from 'fastify';
import {
    LessonPlanParamsSchema,
    LessonPlansQuerySchema,
    SaveLessonPlanBodySchema,
} from '@diariomobile/shared-schemas';
import { LessonPlansService } from './lesson-plans.service.js';

const lessonPlansRoutes: FastifyPluginAsync = async (fastify) => {
    const service = new LessonPlansService(fastify.prisma);

    fastify.addHook('onRequest', fastify.authenticate);

    fastify.get('/', async (req, reply) => {
        const query = LessonPlansQuerySchema.parse(req.query);
        const plans = await service.list(req.user.sub, query.schoolId, query.nextDays);
        return reply.send(plans);
    });

    fastify.post('/', async (req, reply) => {
        const body = SaveLessonPlanBodySchema.parse(req.body);
        await service.create(req.user.sub, body);
        return reply.code(201).send();
    });

    fastify.patch('/:lessonPlanId', async (req, reply) => {
        const params = LessonPlanParamsSchema.parse(req.params);
        const body = SaveLessonPlanBodySchema.parse(req.body);
        await service.update(req.user.sub, params.lessonPlanId, body);
        return reply.code(204).send();
    });

    fastify.delete('/:lessonPlanId', async (req, reply) => {
        const params = LessonPlanParamsSchema.parse(req.params);
        await service.delete(req.user.sub, params.lessonPlanId);
        return reply.code(204).send();
    });
};

export default lessonPlansRoutes;
