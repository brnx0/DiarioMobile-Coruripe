import { Prisma, type PrismaClient } from '@prisma/client';
import type {
    Evaluation,
    EvaluationPeriod,
    EvaluationStudent,
    EvaluationType,
    Indicator,
    IndicatorStudent,
} from '@diariomobile/shared-types';

type ClassDisciplineCtx = {
    classId: number;
    subjectId: number;
    courseId: number;
    schoolId: number;
    year: number;
};

export class EvaluationsService {
    constructor(private prisma: PrismaClient) { }

    private async getCtx(userId: number, tmdCod: number): Promise<ClassDisciplineCtx | null> {
        const rows = await this.prisma.$queryRaw<ClassDisciplineCtx[]>(Prisma.sql`
            SELECT TOP 1
                tdp.TMA_COD AS classId,
                tdp.DIS_COD AS subjectId,
                tdp.CUR_COD AS courseId,
                tdp.ESC_COD AS schoolId,
                tdp.TMD_ANO_LETIVO AS year
            FROM FR_USUARIO u
            JOIN EDU_TURMA_DISCIPLINA_PROFESSOR tdp ON tdp.PES_COD_PROFESSOR = u.PES_COD
            WHERE u.USR_CODIGO = ${userId}
              AND tdp.TMD_COD = ${tmdCod}
        `);
        return rows[0] ?? null;
    }

    async getPeriods(userId: number, classDisciplineId: number): Promise<EvaluationPeriod[]> {
        const ctx = await this.getCtx(userId, classDisciplineId);
        if (!ctx) return [];

        const rows = await this.prisma.$queryRaw<{ unit: number; startDate: Date; endDate: Date }[]>(Prisma.sql`
            SELECT
                UNIDADE AS unit,
                DATA_INICIO AS startDate,
                DATA_FIM AS endDate
            FROM EDU_NOVO_DIARIO_CALENDARIO
            WHERE CUR_COD = ${ctx.courseId}
              AND ANO = ${ctx.year}
            ORDER BY UNIDADE
        `);

        return rows.map((r) => ({
            id: r.unit,
            description: `${r.unit}ª Unidade`,
            minDate: toIsoDate(r.startDate),
            maxDate: toIsoDate(r.endDate),
        }));
    }

    async getTypes(_classDisciplineId: number): Promise<EvaluationType[]> {
        return this.prisma.$queryRaw<EvaluationType[]>(Prisma.sql`
            SELECT
                DAT_COD AS id,
                DAT_DESCRICAO AS description
            FROM EDU_DIARIO_AVALIACAO_TIPO
            ORDER BY DAT_COD
        `);
    }

    async listEvaluations(
        userId: number,
        classDisciplineId: number,
        periodId: number,
        typeId: number,
    ): Promise<Evaluation[]> {
        const ctx = await this.getCtx(userId, classDisciplineId);
        if (!ctx) return [];

        const rows = await this.prisma.$queryRaw<
            {
                id: number;
                avaId: number;
                description: string;
                date: Date;
                value: number;
            }[]
        >(Prisma.sql`
            SELECT
                DIA_COD AS id,
                DIA_COD AS avaId,
                COALESCE(DIA_TITULO, DIA_DESCRICAO, '') AS description,
                DIA_DATA AS date,
                DIA_VALOR_MAXIMO AS value
            FROM EDU_DIARIO_AVALIACAO
            WHERE TMA_COD = ${ctx.classId}
              AND DIS_COD = ${ctx.subjectId}
              AND UNS_COD = ${periodId}
              AND DAT_COD = ${typeId}
            ORDER BY DIA_DATA DESC
        `);

        return rows.map((r) => ({
            id: r.id,
            avaId: r.avaId,
            description: r.description,
            date: toIsoDate(r.date),
            value: Number(r.value),
            totalAvailable: 0,
        }));
    }

    async getEvaluationStudents(
        evaluationId: number,
        _fieldKey: string,
    ): Promise<EvaluationStudent[]> {
        const rows = await this.prisma.$queryRaw<
            {
                id: number;
                name: string;
                grade: number | string | null;
            }[]
        >(Prisma.sql`
            SELECT
                ta.TMH_COD AS id,
                p.PES_NOME AS name,
                daa.DAA_VALOR AS grade
            FROM EDU_DIARIO_AVALIACAO dia
            JOIN EDU_TURMA_ALUNO ta ON ta.TMA_COD = dia.TMA_COD
            JOIN GER_PESSOA p ON p.PES_COD = ta.PES_COD_ALUNO
            LEFT JOIN EDU_DIARIO_AVALIACAO_ALUNO daa
                ON daa.DIA_COD = dia.DIA_COD AND daa.TMH_COD = ta.TMH_COD
            WHERE dia.DIA_COD = ${evaluationId}
              AND ta.TMH_HABILITADO = 'S'
              AND ta.TMH_ANO_LETIVO = YEAR(dia.DIA_DATA)
            ORDER BY
                CASE WHEN ISNUMERIC(ta.TMA_NUMERO_CHAMADA) = 1
                     THEN CAST(ta.TMA_NUMERO_CHAMADA AS int)
                     ELSE 999999
                END,
                p.PES_NOME
        `);

        return rows.map((r) => ({
            id: r.id,
            name: r.name,
            grade: r.grade != null ? Number(r.grade) : 0,
            average: 0,
        }));
    }

    async saveEvaluationGrades(
        _evaluationId: number,
        _fieldKey: string,
        _evaluation: unknown,
        _students: EvaluationStudent[],
    ): Promise<void> {
        // TODO: implementar UPSERT em EDU_DIARIO_AVALIACAO_ALUNO
        // (DAA_VALOR + DAA_DISPENSADO por (DIA_COD, TMH_COD))
        return;
    }

    async getIndicators(_classDisciplineId: number): Promise<Indicator[]> {
        return [];
    }

    async getIndicatorStudents(
        _indicatorId: number,
        _classDisciplineId: number,
        _unit: number,
    ): Promise<IndicatorStudent[]> {
        return [];
    }

    async saveIndicatorGrades(
        _indicatorId: number,
        _classDisciplineId: number,
        _unit: number,
        _students: IndicatorStudent[],
    ): Promise<void> {
        return;
    }
}

function toIsoDate(value: Date): string {
    const year = value.getUTCFullYear();
    const month = String(value.getUTCMonth() + 1).padStart(2, '0');
    const day = String(value.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
