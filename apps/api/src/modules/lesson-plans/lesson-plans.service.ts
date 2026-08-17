import { Prisma, type PrismaClient } from '@prisma/client';
import type { LessonPlan, SaveLessonPlanInput } from '@diariomobile/shared-types';

type ProfessorRow = {
    personId: number;
};

export class LessonPlansService {
    constructor(private prisma: PrismaClient) { }

    async list(userId: number, schoolId: number, nextDays: number): Promise<LessonPlan[]> {
        const professor = await this.getProfessor(userId);
        const days = Math.max(0, nextDays);

        return this.prisma.$queryRaw<LessonPlan[]>(Prisma.sql`
            SELECT
                p.PLANID AS id,
                COALESCE(p.TEMA, '') AS theme,
                CONVERT(varchar(10), p.DATA, 23) AS startDate,
                CONVERT(varchar(10), p.DATA_FIM, 23) AS endDate,
                p.SER_COD AS gradeId,
                s.SER_NOME AS gradeName,
                p.DIS_COD AS subjectId,
                d.DIS_NOME_MEC AS subjectName,
                COALESCE(p.CONTEUDO, '') AS conceptualContent,
                COALESCE(p.DESENVOLVIMENTO, '') AS strategy,
                p.ESC_COD AS schoolId,
                e.ESC_NOME_COMPLETO AS schoolName
            FROM EDU_PLANO_AULA p
            LEFT JOIN EDU_SERIE s ON s.SER_COD = p.SER_COD
            LEFT JOIN EDU_DISCIPLINA d ON d.DIS_COD = p.DIS_COD
            LEFT JOIN EDU_ESCOLA e ON e.ESC_COD = p.ESC_COD
            WHERE p.PES_COD = ${professor.personId}
              AND p.ESC_COD = ${schoolId}
              AND (
                ${days} = 0
                OR p.DATA BETWEEN CONVERT(date, GETDATE()) AND DATEADD(day, ${days}, CONVERT(date, GETDATE()))
              )
            ORDER BY p.DATA DESC, p.PLANID DESC
        `);
    }

    async create(userId: number, input: SaveLessonPlanInput): Promise<void> {
        const professor = await this.getProfessor(userId);

        await this.prisma.$executeRaw(Prisma.sql`
            INSERT INTO EDU_PLANO_AULA (
                PES_COD,
                ESC_COD,
                SER_COD,
                DIS_COD,
                TEMA,
                DATA,
                DATA_FIM,
                CONTEUDO,
                DESENVOLVIMENTO
            )
            VALUES (
                ${professor.personId},
                ${input.schoolId},
                ${input.gradeId},
                ${input.subjectId},
                ${input.theme},
                CONVERT(date, ${input.startDate}),
                CONVERT(date, ${input.endDate}),
                ${input.conceptualContent},
                ${input.strategy}
            )
        `);
    }

    async update(userId: number, lessonPlanId: number, input: SaveLessonPlanInput): Promise<void> {
        const professor = await this.getProfessor(userId);

        await this.prisma.$executeRaw(Prisma.sql`
            UPDATE EDU_PLANO_AULA
               SET TEMA = ${input.theme},
                   DATA = CONVERT(date, ${input.startDate}),
                   DATA_FIM = CONVERT(date, ${input.endDate}),
                   SER_COD = ${input.gradeId},
                   DIS_COD = ${input.subjectId},
                   CONTEUDO = ${input.conceptualContent},
                   DESENVOLVIMENTO = ${input.strategy},
                   ESC_COD = ${input.schoolId}
             WHERE PLANID = ${lessonPlanId}
               AND PES_COD = ${professor.personId}
        `);
    }

    async delete(userId: number, lessonPlanId: number): Promise<void> {
        const professor = await this.getProfessor(userId);

        await this.prisma.$executeRaw(Prisma.sql`
            DELETE FROM EDU_PLANO_AULA
            WHERE PLANID = ${lessonPlanId}
              AND PES_COD = ${professor.personId}
        `);
    }

    private async getProfessor(userId: number): Promise<ProfessorRow> {
        const rows = await this.prisma.$queryRaw<ProfessorRow[]>(Prisma.sql`
            SELECT TOP 1 PES_COD AS personId
            FROM FR_USUARIO
            WHERE USR_CODIGO = ${userId}
              AND PES_COD IS NOT NULL
        `);

        const professor = rows[0];
        if (!professor) throw new Error('Professor nao encontrado para o usuario autenticado.');

        return professor;
    }
}
