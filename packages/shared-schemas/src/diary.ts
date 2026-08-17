import { z } from 'zod';

export const AttendanceQuerySchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD.'),
});

export const UpdateAttendanceBodySchema = z.object({
    students: z.array(z.object({
        attendanceControlId: z.number().int().positive(),
        attendance: z.array(z.union([z.literal(0), z.literal(1)])).min(1).max(6),
        justification: z.string().nullable().optional(),
    })).min(1),
});

export const UpdateContentBodySchema = z.object({
    content: z.string().default(''),
    methodology: z.string().default(''),
});

export const ReplicateContentBodySchema = z.object({
    sourceDiaryContentIds: z.array(z.number().int().positive()).min(1),
});

export const DiaryContentParamsSchema = z.object({
    diaryContentId: z.coerce.number().int().positive(),
});
