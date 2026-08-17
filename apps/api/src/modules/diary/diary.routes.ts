import type { FastifyPluginAsync } from 'fastify';
import { ClassDisciplineParamsSchema } from '@diariomobile/shared-schemas';
import {
    AttendanceQuerySchema,
    DiaryContentParamsSchema,
    ReplicateContentBodySchema,
    UpdateAttendanceBodySchema,
    UpdateContentBodySchema,
} from '@diariomobile/shared-schemas';
import { DiaryService } from './diary.service.js';

const diaryRoutes: FastifyPluginAsync = async (fastify) => {
    const service = new DiaryService(fastify.prisma);

    fastify.addHook('onRequest', fastify.authenticate);

    fastify.get('/class-disciplines/:classDisciplineId/attendance', async (req, reply) => {
        const params = ClassDisciplineParamsSchema.parse(req.params);
        const query = AttendanceQuerySchema.parse(req.query);
        const students = await service.getAttendance(req.user.sub, params.classDisciplineId, query.date);
        return reply.send(students);
    });

    fastify.patch('/attendance', async (req, reply) => {
        const body = UpdateAttendanceBodySchema.parse(req.body);
        await service.updateAttendance(body.students);
        return reply.code(204).send();
    });

    fastify.patch('/content/:diaryContentId', async (req, reply) => {
        const params = DiaryContentParamsSchema.parse(req.params);
        const body = UpdateContentBodySchema.parse(req.body);
        await service.updateContent(params.diaryContentId, body.content, body.methodology);
        return reply.code(204).send();
    });

    fastify.get('/class-disciplines/:classDisciplineId/content-history', async (req, reply) => {
        const params = ClassDisciplineParamsSchema.parse(req.params);
        const history = await service.getContentHistory(req.user.sub, params.classDisciplineId);
        return reply.send(history);
    });

    fastify.post('/content/:diaryContentId/replicate', async (req, reply) => {
        const params = DiaryContentParamsSchema.parse(req.params);
        const body = ReplicateContentBodySchema.parse(req.body);
        await service.replicateContent(params.diaryContentId, body.sourceDiaryContentIds);
        return reply.code(204).send();
    });
};

export default diaryRoutes;
