import type { FastifyPluginAsync } from 'fastify';
import {
    EvaluationContextParamsSchema,
    EvaluationListQuerySchema,
    EvaluationParamsSchema,
    EvaluationStudentsQuerySchema,
    IndicatorParamsSchema,
    IndicatorStudentsQuerySchema,
    IndicatorsQuerySchema,
    SaveEvaluationGradesBodySchema,
    SaveIndicatorGradesBodySchema,
} from '@diariomobile/shared-schemas';
import { EvaluationsService } from './evaluations.service.js';

const evaluationsRoutes: FastifyPluginAsync = async (fastify) => {
    const service = new EvaluationsService(fastify.prisma);

    fastify.addHook('onRequest', fastify.authenticate);

    fastify.get('/class-disciplines/:classDisciplineId/periods', async (req, reply) => {
        const params = EvaluationContextParamsSchema.parse(req.params);
        const periods = await service.getPeriods(req.user.sub, params.classDisciplineId);
        return reply.send(periods);
    });

    fastify.get('/class-disciplines/:classDisciplineId/types', async (req, reply) => {
        const params = EvaluationContextParamsSchema.parse(req.params);
        const types = await service.getTypes(params.classDisciplineId);
        return reply.send(types);
    });

    fastify.get('/', async (req, reply) => {
        const query = EvaluationListQuerySchema.parse(req.query);
        const evaluations = await service.listEvaluations(
            req.user.sub,
            query.classDisciplineId,
            query.periodId,
            query.typeId,
        );
        return reply.send(evaluations);
    });

    fastify.get('/:evaluationId/students', async (req, reply) => {
        const params = EvaluationParamsSchema.parse(req.params);
        const query = EvaluationStudentsQuerySchema.parse(req.query);
        const students = await service.getEvaluationStudents(params.evaluationId, query.fieldKey);
        return reply.send(students);
    });

    fastify.post('/:evaluationId/grades', async (req, reply) => {
        const params = EvaluationParamsSchema.parse(req.params);
        const body = SaveEvaluationGradesBodySchema.parse(req.body);
        await service.saveEvaluationGrades(
            params.evaluationId,
            body.fieldKey,
            body.evaluation,
            body.students,
        );
        return reply.code(204).send();
    });

    fastify.get('/indicators', async (req, reply) => {
        const query = IndicatorsQuerySchema.parse(req.query);
        const indicators = await service.getIndicators(query.classDisciplineId);
        return reply.send(indicators);
    });

    fastify.get('/indicators/:indicatorId/students', async (req, reply) => {
        const params = IndicatorParamsSchema.parse(req.params);
        const query = IndicatorStudentsQuerySchema.parse(req.query);
        const students = await service.getIndicatorStudents(
            params.indicatorId,
            query.classDisciplineId,
            query.unit,
        );
        return reply.send(students);
    });

    fastify.post('/indicators/:indicatorId/grades', async (req, reply) => {
        const params = IndicatorParamsSchema.parse(req.params);
        const body = SaveIndicatorGradesBodySchema.parse(req.body);
        await service.saveIndicatorGrades(
            params.indicatorId,
            body.classDisciplineId,
            body.unit,
            body.students,
        );
        return reply.code(204).send();
    });
};

export default evaluationsRoutes;
