import { z } from 'zod';

export const OptionalYearQuerySchema = z.object({
    year: z.coerce.number().int().min(2000).max(2100).optional(),
});

export const SchoolParamsSchema = z.object({
    schoolId: z.coerce.number().int().positive(),
});

export const ClassDisciplineParamsSchema = z.object({
    classDisciplineId: z.coerce.number().int().positive(),
});

export const ClassSubjectsQuerySchema = OptionalYearQuerySchema.extend({
    classId: z.coerce.number().int().positive().optional(),
    gradeId: z.coerce.number().int().positive().optional(),
});
