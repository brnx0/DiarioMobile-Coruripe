import { Prisma, type PrismaClient } from '@prisma/client';
import type { AttendanceStudent, ContentHistoryItem, UpdateAttendanceStudent } from '@diariomobile/shared-types';

type ClassDisciplineRow = {
    id: number;
    classId: number;
    schoolId: number;
    courseId: number;
    gradeId: number;
    subjectId: number;
    teacherPersonId: number;
    year: number;
};

type DiaryContentRow = {
    diaryContentId: number;
    classId: number;
    subjectId: number;
    teacherPersonId: number;
    lessonDate: Date;
    classCount: number;
    unitId: number;
    content: string | null;
    methodology: string | null;
};

type CountRow = {
    total: number | bigint;
};

type UnitRow = {
    unitId: number;
};

function toNumber(value: number | bigint | null | undefined, fallback = 0): number {
    if (typeof value === 'bigint') return Number(value);
    if (typeof value === 'number') return value;
    return fallback;
}

function presenceToDb(value: number | undefined): 'S' | 'N' {
    return value === 1 ? 'S' : 'N';
}

function combineText(current: string | null | undefined, addition: string): string {
    const base = current?.trim() ?? '';
    const next = addition.trim();
    if (!base) return next;
    if (!next) return base;
    return `${base}\n${next}`;
}

export class DiaryService {
    constructor(private prisma: PrismaClient) { }

    async getAttendance(userId: number, classDisciplineId: number, lessonDate: string): Promise<AttendanceStudent[]> {
        return this.prisma.$transaction(async (tx) => {
            const classDiscipline = await this.getClassDisciplineForUser(tx, userId, classDisciplineId);
            const lesson = await this.ensureDiaryContent(tx, classDiscipline, lessonDate);
            await this.ensureAttendanceRows(tx, classDiscipline, lesson.diaryContentId);

            return tx.$queryRaw<AttendanceStudent[]>(Prisma.sql`
                SELECT
                    dcf.DCF_COD AS attendanceControlId,
                    ta.TMH_COD AS enrollmentId,
                    dcf.TMH_OBSERVACAO AS observation,
                    COALESCE(pf.PFI_APELIDO, p.PES_NOME) AS studentName,
                    CAST(CASE WHEN pf.PFI_DEFICIENTE = 'S' THEN 1 ELSE 0 END AS bit) AS hasDisability,
                    dc.DIC_COD AS diaryContentId,
                    dc.DIS_COD AS subjectId,
                    CONCAT(
                        CASE WHEN dcf.DCF_AULA1 = 'S' THEN '1' ELSE '0' END, ',',
                        CASE WHEN dcf.DCF_AULA2 = 'S' THEN '1' ELSE '0' END, ',',
                        CASE WHEN dcf.DCF_AULA3 = 'S' THEN '1' ELSE '0' END, ',',
                        CASE WHEN dcf.DCF_AULA4 = 'S' THEN '1' ELSE '0' END, ',',
                        CASE WHEN dcf.DCF_AULA5 = 'S' THEN '1' ELSE '0' END, ',',
                        CASE WHEN dcf.DCF_AULA6 = 'S' THEN '1' ELSE '0' END
                    ) AS attendance,
                    dcf.DCF_JUSTIFICATIVA AS justification,
                    dc.DIC_QUANTIDADE_AULAS AS classCount,
                    CONVERT(varchar(10), dc.DIC_DATA, 23) AS lessonDate,
                    COALESCE(dc.DIC_ASSUNTO, '') AS content,
                    COALESCE(dc.DIC_OBSERVACAO, '') AS methodology
                FROM EDU_TURMA_ALUNO ta
                JOIN GER_PESSOA p ON p.PES_COD = ta.PES_COD_ALUNO
                LEFT JOIN GER_PESSOA_FISICA pf ON pf.PES_COD = ta.PES_COD_ALUNO
                JOIN EDU_DIARIO_CONTROLE_FREQUENCIA dcf ON dcf.TMH_COD = ta.TMH_COD
                JOIN EDU_DIARIO_CONTEUDO dc ON dc.DIC_COD = dcf.DIC_COD
                WHERE ta.TMA_COD = ${classDiscipline.classId}
                  AND ta.TMH_ANO_LETIVO = ${classDiscipline.year}
                  AND dcf.DIC_COD = ${lesson.diaryContentId}
                ORDER BY CASE WHEN ISNUMERIC(ta.TMA_NUMERO_CHAMADA) = 1 THEN CAST(ta.TMA_NUMERO_CHAMADA AS int) ELSE 999999 END, p.PES_NOME
            `).then((rows) => rows.map((row) => ({
                ...row,
                attendance: String(row.attendance).split(',').slice(0, row.classCount).map(Number),
            })));
        });
    }

    async updateAttendance(students: UpdateAttendanceStudent[]): Promise<void> {
        await this.prisma.$transaction(
            students.map((student) => this.prisma.$executeRaw(Prisma.sql`
                UPDATE EDU_DIARIO_CONTROLE_FREQUENCIA
                   SET DCF_AULA1 = ${presenceToDb(student.attendance[0])},
                       DCF_AULA2 = ${presenceToDb(student.attendance[1])},
                       DCF_AULA3 = ${presenceToDb(student.attendance[2])},
                       DCF_AULA4 = ${presenceToDb(student.attendance[3])},
                       DCF_AULA5 = ${presenceToDb(student.attendance[4])},
                       DCF_AULA6 = ${presenceToDb(student.attendance[5])},
                       DCF_JUSTIFICATIVA = ${student.justification ?? null}
                 WHERE DCF_COD = ${student.attendanceControlId}
            `)),
        );
    }

    async updateContent(diaryContentId: number, content: string, methodology: string): Promise<void> {
        await this.prisma.$executeRaw(Prisma.sql`
            UPDATE EDU_DIARIO_CONTEUDO
               SET DIC_ASSUNTO = ${content},
                   DIC_OBSERVACAO = ${methodology}
             WHERE DIC_COD = ${diaryContentId}
        `);
    }

    async getContentHistory(userId: number, classDisciplineId: number): Promise<ContentHistoryItem[]> {
        const classDiscipline = await this.getClassDisciplineForUser(this.prisma, userId, classDisciplineId);

        return this.prisma.$queryRaw<ContentHistoryItem[]>(Prisma.sql`
            SELECT
                dc.DIC_COD AS diaryContentId,
                dc.DIS_COD AS subjectId,
                COALESCE(dc.DIC_ASSUNTO, '') AS content,
                COALESCE(dc.DIC_OBSERVACAO, '') AS methodology,
                CONVERT(varchar(10), dc.DIC_DATA, 23) AS lessonDate,
                dc.DIC_QUANTIDADE_AULAS AS classCount
            FROM EDU_DIARIO_CONTEUDO dc
            WHERE dc.TMA_COD = ${classDiscipline.classId}
              AND dc.DIS_COD = ${classDiscipline.subjectId}
              AND dc.PES_COD_PROFESSOR = ${classDiscipline.teacherPersonId}
              AND (
                NULLIF(LTRIM(RTRIM(COALESCE(dc.DIC_ASSUNTO, ''))), '') IS NOT NULL
                OR NULLIF(LTRIM(RTRIM(COALESCE(dc.DIC_OBSERVACAO, ''))), '') IS NOT NULL
              )
            ORDER BY dc.DIC_DATA DESC
        `);
    }

    async replicateContent(diaryContentId: number, sourceDiaryContentIds: number[]): Promise<void> {
        if (sourceDiaryContentIds.length === 0) return;

        await this.prisma.$transaction(async (tx) => {
            const targetRows = await tx.$queryRaw<DiaryContentRow[]>(Prisma.sql`
                SELECT TOP 1
                    DIC_COD AS diaryContentId,
                    TMA_COD AS classId,
                    DIS_COD AS subjectId,
                    PES_COD_PROFESSOR AS teacherPersonId,
                    DIC_DATA AS lessonDate,
                    DIC_QUANTIDADE_AULAS AS classCount,
                    UNS_COD AS unitId,
                    DIC_ASSUNTO AS content,
                    DIC_OBSERVACAO AS methodology
                FROM EDU_DIARIO_CONTEUDO
                WHERE DIC_COD = ${diaryContentId}
            `);
            const target = targetRows[0];
            if (!target) return;

            const sources = await tx.$queryRaw<Array<{ content: string | null; methodology: string | null }>>(Prisma.sql`
                SELECT
                    DIC_ASSUNTO AS content,
                    DIC_OBSERVACAO AS methodology
                FROM EDU_DIARIO_CONTEUDO
                WHERE DIC_COD IN (${Prisma.join(sourceDiaryContentIds)})
                ORDER BY DIC_DATA
            `);

            const content = sources.map((source) => source.content ?? '').filter(Boolean).join(' / ');
            const methodology = sources.map((source) => source.methodology ?? '').filter(Boolean).join(' / ');

            await tx.$executeRaw(Prisma.sql`
                UPDATE EDU_DIARIO_CONTEUDO
                   SET DIC_ASSUNTO = ${combineText(target.content, content)},
                       DIC_OBSERVACAO = ${combineText(target.methodology, methodology)}
                 WHERE DIC_COD = ${diaryContentId}
            `);
        });
    }

    private async getClassDisciplineForUser(
        prisma: PrismaClient | Prisma.TransactionClient,
        userId: number,
        classDisciplineId: number,
    ): Promise<ClassDisciplineRow> {
        const rows = await prisma.$queryRaw<ClassDisciplineRow[]>(Prisma.sql`
            SELECT TOP 1
                tdp.TMD_COD AS id,
                tdp.TMA_COD AS classId,
                tdp.ESC_COD AS schoolId,
                tdp.CUR_COD AS courseId,
                tdp.SER_COD AS gradeId,
                tdp.DIS_COD AS subjectId,
                tdp.PES_COD_PROFESSOR AS teacherPersonId,
                tdp.TMD_ANO_LETIVO AS year
            FROM FR_USUARIO u
            JOIN EDU_TURMA_DISCIPLINA_PROFESSOR tdp ON tdp.PES_COD_PROFESSOR = u.PES_COD
            WHERE u.USR_CODIGO = ${userId}
              AND tdp.TMD_COD = ${classDisciplineId}
        `);

        const classDiscipline = rows[0];
        if (!classDiscipline) {
            throw new Error('Turma/disciplina nao encontrada para o usuario autenticado.');
        }

        return classDiscipline;
    }

    private async ensureDiaryContent(
        tx: Prisma.TransactionClient,
        classDiscipline: ClassDisciplineRow,
        lessonDate: string,
    ): Promise<DiaryContentRow> {
        const existing = await tx.$queryRaw<DiaryContentRow[]>(Prisma.sql`
            SELECT TOP 1
                DIC_COD AS diaryContentId,
                TMA_COD AS classId,
                DIS_COD AS subjectId,
                PES_COD_PROFESSOR AS teacherPersonId,
                DIC_DATA AS lessonDate,
                DIC_QUANTIDADE_AULAS AS classCount,
                UNS_COD AS unitId,
                DIC_ASSUNTO AS content,
                DIC_OBSERVACAO AS methodology
            FROM EDU_DIARIO_CONTEUDO
            WHERE TMA_COD = ${classDiscipline.classId}
              AND DIS_COD = ${classDiscipline.subjectId}
              AND PES_COD_PROFESSOR = ${classDiscipline.teacherPersonId}
              AND CONVERT(date, DIC_DATA) = CONVERT(date, ${lessonDate})
            ORDER BY DIC_COD DESC
        `);

        if (existing[0]) return existing[0];

        const classCount = await this.getClassCount(tx, classDiscipline, lessonDate);
        const unitId = await this.getCalendarUnit(tx, classDiscipline, lessonDate);

        await tx.$executeRaw(Prisma.sql`
            INSERT INTO EDU_DIARIO_CONTEUDO (
                TMA_COD,
                DIS_COD,
                DIC_ASSUNTO,
                DIC_OBSERVACAO,
                DIC_DATA,
                PES_COD_PROFESSOR,
                DIC_QUANTIDADE_AULAS,
                UNS_COD
            )
            VALUES (
                ${classDiscipline.classId},
                ${classDiscipline.subjectId},
                '',
                '',
                CONVERT(date, ${lessonDate}),
                ${classDiscipline.teacherPersonId},
                ${classCount},
                ${unitId}
            )
        `);

        const created = await tx.$queryRaw<DiaryContentRow[]>(Prisma.sql`
            SELECT TOP 1
                DIC_COD AS diaryContentId,
                TMA_COD AS classId,
                DIS_COD AS subjectId,
                PES_COD_PROFESSOR AS teacherPersonId,
                DIC_DATA AS lessonDate,
                DIC_QUANTIDADE_AULAS AS classCount,
                UNS_COD AS unitId,
                DIC_ASSUNTO AS content,
                DIC_OBSERVACAO AS methodology
            FROM EDU_DIARIO_CONTEUDO
            WHERE TMA_COD = ${classDiscipline.classId}
              AND DIS_COD = ${classDiscipline.subjectId}
              AND PES_COD_PROFESSOR = ${classDiscipline.teacherPersonId}
              AND CONVERT(date, DIC_DATA) = CONVERT(date, ${lessonDate})
            ORDER BY DIC_COD DESC
        `);

        const lesson = created[0];
        if (!lesson) throw new Error('Nao foi possivel criar aula do diario.');

        return lesson;
    }

    private async ensureAttendanceRows(
        tx: Prisma.TransactionClient,
        classDiscipline: ClassDisciplineRow,
        diaryContentId: number,
    ): Promise<void> {
        await tx.$executeRaw(Prisma.sql`
            INSERT INTO EDU_DIARIO_CONTROLE_FREQUENCIA (
                TMH_COD,
                DIC_COD,
                DCF_AULA1,
                DCF_AULA2,
                DCF_AULA3,
                DCF_AULA4,
                DCF_AULA5,
                DCF_AULA6,
                DCF_JUSTIFICADA,
                DCF_JUSTIFICATIVA,
                TMH_OBSERVACAO
            )
            SELECT
                ta.TMH_COD,
                ${diaryContentId},
                'S',
                'S',
                'S',
                'S',
                'S',
                'S',
                'N',
                NULL,
                NULL
            FROM EDU_TURMA_ALUNO ta
            WHERE ta.TMA_COD = ${classDiscipline.classId}
              AND ta.TMH_ANO_LETIVO = ${classDiscipline.year}
              AND ta.TMH_HABILITADO = 'S'
              AND NOT EXISTS (
                SELECT 1
                FROM EDU_DIARIO_CONTROLE_FREQUENCIA dcf
                WHERE dcf.TMH_COD = ta.TMH_COD
                  AND dcf.DIC_COD = ${diaryContentId}
              )
        `);
    }

    private async getClassCount(
        tx: Prisma.TransactionClient,
        classDiscipline: ClassDisciplineRow,
        lessonDate: string,
    ): Promise<number> {
        const rows = await tx.$queryRaw<CountRow[]>(Prisma.sql`
            SELECT COUNT(*) AS total
            FROM EDU_QUADRO_DE_HORARIOS q
            JOIN EDU_QUADRO_DE_HORARIOS_DETALHE qd ON qd.QUA_COD = q.QUA_COD
            WHERE q.QUA_ESC_COD = ${classDiscipline.schoolId}
              AND q.QUA_TMA_COD = ${classDiscipline.classId}
              AND q.QUA_ANO_LETIVO = ${classDiscipline.year}
              AND qd.PROFESSOR = ${classDiscipline.teacherPersonId}
              AND qd.DISCIPLINA = ${classDiscipline.subjectId}
              AND qd.DIA = ((DATEDIFF(day, '19000107', CONVERT(date, ${lessonDate})) % 7) + 1)
        `);

        return Math.max(1, toNumber(rows[0]?.total));
    }

    private async getCalendarUnit(
        tx: Prisma.TransactionClient,
        classDiscipline: ClassDisciplineRow,
        lessonDate: string,
    ): Promise<number> {
        const rows = await tx.$queryRaw<UnitRow[]>(Prisma.sql`
            SELECT TOP 1 UNIDADE AS unitId
            FROM EDU_NOVO_DIARIO_CALENDARIO
            WHERE CUR_COD = ${classDiscipline.courseId}
              AND ANO = ${classDiscipline.year}
              AND CONVERT(date, ${lessonDate}) BETWEEN CONVERT(date, DATA_INICIO) AND CONVERT(date, DATA_FIM)
            ORDER BY UNIDADE
        `);

        return rows[0]?.unitId ?? 1;
    }
}
