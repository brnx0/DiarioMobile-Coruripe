import type { FastifyPluginAsync } from 'fastify';
import {
    CalendarQuerySchema,
    ClassDisciplineParamsSchema,
    ClassSubjectsQuerySchema,
    OptionalYearQuerySchema,
    SchoolParamsSchema,
} from '@diariomobile/shared-schemas';
import { AcademicService } from './academic.service.js';

const academicRoutes: FastifyPluginAsync = async (fastify) => {
    const service = new AcademicService(fastify.prisma);

    fastify.addHook('onRequest', fastify.authenticate);

    fastify.get('/years', async (_req, reply) => {
        const years = await service.getYears();
        return reply.send(years);
    });

    fastify.get('/schools', async (req, reply) => {
        const query = OptionalYearQuerySchema.parse(req.query);
        const schools = await service.getSchools(req.user.sub, query.year);
        return reply.send(schools);
    });

    fastify.get('/schools/:schoolId/classes', async (req, reply) => {
        const params = SchoolParamsSchema.parse(req.params);
        const query = OptionalYearQuerySchema.parse(req.query);
        const classes = await service.getClasses(req.user.sub, params.schoolId, query.year);
        return reply.send(classes);
    });

    fastify.get('/schools/:schoolId/grades', async (req, reply) => {
        const params = SchoolParamsSchema.parse(req.params);
        const grades = await service.getGrades(req.user.sub, params.schoolId);
        return reply.send(grades);
    });

    fastify.get('/schools/:schoolId/subjects', async (req, reply) => {
        const params = SchoolParamsSchema.parse(req.params);
        const query = ClassSubjectsQuerySchema.parse(req.query);
        const subjects = await service.getSubjects(req.user.sub, params.schoolId, query);
        return reply.send(subjects);
    });

    fastify.get('/class-disciplines/:classDisciplineId/weekdays', async (req, reply) => {
        const params = ClassDisciplineParamsSchema.parse(req.params);
        const weekdays = await service.getWeekdays(req.user.sub, params.classDisciplineId);
        return reply.send(weekdays);
    });

    fastify.get('/schools/:schoolId/upcoming-classes', async (req, reply) => {
        const params = SchoolParamsSchema.parse(req.params);
        const query = OptionalYearQuerySchema.parse(req.query);
        const classes = await service.getUpcomingClasses(req.user.sub, params.schoolId, query.year);
        return reply.send(classes);
    });

    fastify.get('/class-disciplines/:classDisciplineId/calendar', async (req, reply) => {
        const params = ClassDisciplineParamsSchema.parse(req.params);
        const query = CalendarQuerySchema.parse(req.query);
        const calendar = await service.getCalendar(req.user.sub, params.classDisciplineId, query.year, query.month);
        return reply.send(calendar);
    });
};

export default academicRoutes;
