import { z } from 'zod';

export const LessonPlansQuerySchema = z.object({
    schoolId: z.coerce.number().int().positive(),
    nextDays: z.coerce.number().int().min(0).max(366).default(0),
});

export const LessonPlanParamsSchema = z.object({
    lessonPlanId: z.coerce.number().int().positive(),
});

export const SaveLessonPlanBodySchema = z.object({
    theme: z.string().trim().min(1),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    gradeId: z.number().int().positive(),
    subjectId: z.number().int().positive(),
    conceptualContent: z.string().default(''),
    strategy: z.string().default(''),
    schoolId: z.number().int().positive(),
});
