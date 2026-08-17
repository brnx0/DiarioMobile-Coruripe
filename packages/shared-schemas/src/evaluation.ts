import { z } from 'zod';

export const EvaluationContextParamsSchema = z.object({
    classDisciplineId: z.coerce.number().int().positive(),
});

export const EvaluationListQuerySchema = z.object({
    classDisciplineId: z.coerce.number().int().positive(),
    periodId: z.coerce.number().int().positive(),
    typeId: z.coerce.number().int().positive(),
});

export const EvaluationParamsSchema = z.object({
    evaluationId: z.coerce.number().int().positive(),
});

export const EvaluationStudentsQuerySchema = z.object({
    fieldKey: z.string().min(1),
});

export const SaveEvaluationGradesBodySchema = z.object({
    fieldKey: z.string().min(1),
    evaluation: z.unknown(),
    students: z.array(z.object({
        id: z.number(),
        name: z.string(),
        grade: z.union([z.number(), z.string()]),
        average: z.number(),
    })),
});

export const IndicatorsQuerySchema = z.object({
    classDisciplineId: z.coerce.number().int().positive(),
});

export const IndicatorParamsSchema = z.object({
    indicatorId: z.coerce.number().int().positive(),
});

export const IndicatorStudentsQuerySchema = z.object({
    classDisciplineId: z.coerce.number().int().positive(),
    unit: z.coerce.number().int(),
});

export const SaveIndicatorGradesBodySchema = z.object({
    classDisciplineId: z.number().int().positive(),
    unit: z.number().int(),
    students: z.array(z.object({
        id: z.number(),
        name: z.string(),
        value: z.string(),
    })),
});
