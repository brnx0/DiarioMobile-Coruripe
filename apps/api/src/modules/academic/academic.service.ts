import { Prisma, type PrismaClient } from '@prisma/client';
import type {
    AcademicYear,
    CalendarDay,
    CalendarDayStatus,
    CalendarMonth,
    CalendarUnit,
    ClassDiscipline,
    School,
    Subject,
    UpcomingClass,
    WeekdayAllocation,
} from '@diariomobile/shared-types';

type ClassDisciplineContext = {
    classId: number;
    schoolId: number;
    courseId: number;
    year: number;
};

type CalendarUnitRow = {
    unit: number;
    semester: number | null;
    startDate: Date;
    endDate: Date;
};

type HolidayRow = {
    date: Date;
    name: string;
};

export class AcademicService {
    constructor(private prisma: PrismaClient) { }

    async getYears(): Promise<AcademicYear[]> {
        return this.prisma.$queryRaw<AcademicYear[]>(Prisma.sql`
            SELECT
                CAST(years.year AS int) AS id,
                CAST(years.year AS int) AS year,
                CAST(years.year AS varchar(4)) AS label,
                CAST(CASE WHEN years.year = (
                    SELECT MAX(TMD_ANO_LETIVO)
                    FROM EDU_TURMA_DISCIPLINA_PROFESSOR
                ) THEN 1 ELSE 0 END AS bit) AS active
            FROM (
                SELECT DISTINCT TMD_ANO_LETIVO AS year
                FROM EDU_TURMA_DISCIPLINA_PROFESSOR
                UNION
                SELECT DISTINCT CAST(ANO_COD AS int) AS year
                FROM EDU_ANO
            ) years
            ORDER BY years.year DESC
        `);
    }

    async getSchools(userId: number, year?: number): Promise<School[]> {
        const yearFilter = this.turmaDisciplinaYearFilter(year);

        return this.prisma.$queryRaw<School[]>(Prisma.sql`
            SELECT DISTINCT
                e.ESC_COD AS id,
                e.ESC_NOME_COMPLETO AS name
            FROM FR_USUARIO u
            JOIN EDU_TURMA_DISCIPLINA_PROFESSOR tdp ON tdp.PES_COD_PROFESSOR = u.PES_COD
            JOIN EDU_ESCOLA e ON e.ESC_COD = tdp.ESC_COD
            WHERE u.USR_CODIGO = ${userId}
              ${yearFilter}
            ORDER BY e.ESC_NOME_COMPLETO
        `);
    }

    async getClasses(userId: number, schoolId: number, year?: number): Promise<ClassDiscipline[]> {
        const yearFilter = this.turmaDisciplinaYearFilter(year);

        return this.prisma.$queryRaw<ClassDiscipline[]>(Prisma.sql`
            SELECT DISTINCT
                tdp.TMD_COD AS id,
                t.TMA_COD AS classId,
                tdp.ESC_COD AS schoolId,
                s.SER_COD AS gradeId,
                s.SER_NOME AS gradeName,
                t.TMA_NOME AS className,
                COALESCE(tur.TUR_NOME, t.TMA_NOME) AS shiftName,
                c.CUR_NOME_REDUZIDO AS courseName,
                d.DIS_COD AS subjectId,
                d.DIS_NOME_MEC AS subjectName,
                tdp.PES_COD_PROFESSOR AS teacherPersonId,
                tdp.TMD_ANO_LETIVO AS year
            FROM FR_USUARIO u
            JOIN EDU_TURMA_DISCIPLINA_PROFESSOR tdp ON tdp.PES_COD_PROFESSOR = u.PES_COD
            JOIN EDU_TURMA t ON t.TMA_COD = tdp.TMA_COD
            LEFT JOIN EDU_TURNO tur ON tur.TUR_COD = t.TUR_COD
            JOIN EDU_DISCIPLINA d ON d.DIS_COD = tdp.DIS_COD
            JOIN EDU_SERIE s ON s.SER_COD = tdp.SER_COD
            JOIN EDU_CURSO c ON c.CUR_COD = tdp.CUR_COD
            WHERE u.USR_CODIGO = ${userId}
              AND tdp.ESC_COD = ${schoolId}
              ${yearFilter}
            ORDER BY s.SER_NOME, t.TMA_NOME, d.DIS_NOME_MEC
        `);
    }

    async getSubjects(
        userId: number,
        schoolId: number,
        filters: { classId?: number; gradeId?: number; year?: number },
    ): Promise<Subject[]> {
        const classFilter = filters.classId ? Prisma.sql`AND tdp.TMA_COD = ${filters.classId}` : Prisma.empty;
        const gradeFilter = filters.gradeId ? Prisma.sql`AND tdp.SER_COD = ${filters.gradeId}` : Prisma.empty;
        const yearFilter = this.turmaDisciplinaYearFilter(filters.year);

        return this.prisma.$queryRaw<Subject[]>(Prisma.sql`
            SELECT DISTINCT
                d.DIS_COD AS id,
                d.DIS_NOME_MEC AS name
            FROM FR_USUARIO u
            JOIN EDU_TURMA_DISCIPLINA_PROFESSOR tdp ON tdp.PES_COD_PROFESSOR = u.PES_COD
            JOIN EDU_DISCIPLINA d ON d.DIS_COD = tdp.DIS_COD
            WHERE u.USR_CODIGO = ${userId}
              AND tdp.ESC_COD = ${schoolId}
              ${classFilter}
              ${gradeFilter}
              ${yearFilter}
            ORDER BY d.DIS_NOME_MEC
        `);
    }

    async getGrades(userId: number, schoolId: number): Promise<Array<{ id: number; name: string }>> {
        return this.prisma.$queryRaw<Array<{ id: number; name: string }>>(Prisma.sql`
            SELECT DISTINCT
                s.SER_COD AS id,
                s.SER_NOME AS name
            FROM FR_USUARIO u
            JOIN EDU_TURMA_DISCIPLINA_PROFESSOR tdp ON tdp.PES_COD_PROFESSOR = u.PES_COD
            JOIN EDU_SERIE s ON s.SER_COD = tdp.SER_COD
            WHERE u.USR_CODIGO = ${userId}
              AND tdp.ESC_COD = ${schoolId}
            ORDER BY s.SER_NOME
        `);
    }

    async getWeekdays(userId: number, classDisciplineId: number): Promise<WeekdayAllocation[]> {
        return this.prisma.$queryRaw<WeekdayAllocation[]>(Prisma.sql`
            WITH days(day) AS (
                SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
                UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7
            )
            SELECT
                CAST(days.day AS int) AS day,
                CAST(CASE WHEN EXISTS (
                    SELECT 1
                    FROM FR_USUARIO u
                    JOIN EDU_TURMA_DISCIPLINA_PROFESSOR tdp
                      ON tdp.PES_COD_PROFESSOR = u.PES_COD
                     AND tdp.TMD_COD = ${classDisciplineId}
                    JOIN EDU_QUADRO_DE_HORARIOS q
                      ON q.QUA_ESC_COD = tdp.ESC_COD
                     AND q.QUA_TMA_COD = tdp.TMA_COD
                     AND q.QUA_ANO_LETIVO = tdp.TMD_ANO_LETIVO
                    JOIN EDU_QUADRO_DE_HORARIOS_DETALHE qd
                      ON qd.QUA_COD = q.QUA_COD
                     AND qd.PROFESSOR = tdp.PES_COD_PROFESSOR
                     AND qd.DISCIPLINA = tdp.DIS_COD
                     AND qd.DIA = days.day
                    WHERE u.USR_CODIGO = ${userId}
                ) THEN 1 ELSE 0 END AS bit) AS allocated
            FROM days
            ORDER BY days.day
        `);
    }

    async getUpcomingClasses(userId: number, schoolId: number, year?: number): Promise<UpcomingClass[]> {
        const yearFilter = year
            ? Prisma.sql`AND q.QUA_ANO_LETIVO = ${year}`
            : Prisma.sql`AND q.QUA_ANO_LETIVO = (SELECT MAX(QUA_ANO_LETIVO) FROM EDU_QUADRO_DE_HORARIOS)`;

        return this.prisma.$queryRaw<UpcomingClass[]>(Prisma.sql`
            SELECT DISTINCT
                q.QUA_ESC_COD AS schoolId,
                q.QUA_TMA_COD AS classId,
                qd.TEMPO AS slot,
                qd.PROFESSOR AS teacherId,
                qd.DISCIPLINA AS subjectId,
                d.DIS_NOME_MEC AS subjectName,
                qd.DIA AS day,
                t.TMA_NOME AS className,
                s.SER_NOME AS gradeName,
                COALESCE(pf.PFI_APELIDO, p.PES_NOME) AS teacherName
            FROM FR_USUARIO u
            JOIN EDU_QUADRO_DE_HORARIOS q ON q.QUA_ESC_COD = ${schoolId}
            JOIN EDU_QUADRO_DE_HORARIOS_DETALHE qd ON qd.QUA_COD = q.QUA_COD AND qd.PROFESSOR = u.PES_COD
            JOIN EDU_TURMA t ON t.TMA_COD = q.QUA_TMA_COD
            JOIN EDU_SERIE s ON s.SER_COD = t.SER_COD
            JOIN EDU_DISCIPLINA d ON d.DIS_COD = qd.DISCIPLINA
            JOIN GER_PESSOA p ON p.PES_COD = qd.PROFESSOR
            LEFT JOIN GER_PESSOA_FISICA pf ON pf.PES_COD = qd.PROFESSOR
            WHERE u.USR_CODIGO = ${userId}
              ${yearFilter}
            ORDER BY qd.DIA, qd.TEMPO, t.TMA_NOME
        `);
    }

    private turmaDisciplinaYearFilter(year: number | undefined): Prisma.Sql {
        if (year) return Prisma.sql`AND tdp.TMD_ANO_LETIVO = ${year}`;

        return Prisma.sql`AND tdp.TMD_ANO_LETIVO = (SELECT MAX(TMD_ANO_LETIVO) FROM EDU_TURMA_DISCIPLINA_PROFESSOR)`;
    }

    async getCalendar(
        userId: number,
        classDisciplineId: number,
        year: number,
        month: number,
    ): Promise<CalendarMonth> {
        const ctx = await this.getClassDisciplineContext(userId, classDisciplineId);

        const unitRows = await this.prisma.$queryRaw<CalendarUnitRow[]>(Prisma.sql`
            SELECT
                UNIDADE AS unit,
                SEMESTRE AS semester,
                DATA_INICIO AS startDate,
                DATA_FIM AS endDate
            FROM EDU_NOVO_DIARIO_CALENDARIO
            WHERE CUR_COD = ${ctx.courseId}
              AND ANO = ${year}
            ORDER BY UNIDADE
        `);

        const monthStart = new Date(Date.UTC(year, month - 1, 1));
        const monthEnd = new Date(Date.UTC(year, month, 0));

        const holidayRows = await this.prisma.$queryRaw<HolidayRow[]>(Prisma.sql`
            SELECT
                FERI_DATA AS date,
                FERI_NOME AS name
            FROM GER_FERIADO
            WHERE FERI_DATA BETWEEN ${monthStart} AND ${monthEnd}
        `);

        const holidaysByDate = new Map<string, string>();
        for (const holiday of holidayRows) {
            holidaysByDate.set(toIsoDate(holiday.date), holiday.name);
        }

        const units: CalendarUnit[] = unitRows.map((row) => ({
            unit: row.unit,
            semester: row.semester,
            startDate: toIsoDate(row.startDate),
            endDate: toIsoDate(row.endDate),
        }));

        // Indexa inicios/fins de unidade pela data
        const unitStarts = new Map<string, CalendarUnit>();
        const unitEnds = new Map<string, CalendarUnit>();
        for (const unit of units) {
            unitStarts.set(unit.startDate, unit);
            unitEnds.set(unit.endDate, unit);
        }

        const days: CalendarDay[] = [];
        const daysInMonth = monthEnd.getUTCDate();
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(Date.UTC(year, month - 1, day));
            const iso = toIsoDate(date);
            const holiday = holidaysByDate.get(iso);
            const unit = findUnitForDate(units, iso);
            const weekday = date.getUTCDay();
            const startUnit = unitStarts.get(iso);
            const endUnit = unitEnds.get(iso);

            let status: CalendarDayStatus;
            let reason: string | null = null;

            if (holiday) {
                status = 'FERIADO';
                reason = holiday;
            } else if (startUnit) {
                status = 'INICIO_UNIDADE';
                reason = `Início da ${startUnit.unit}ª unidade`;
            } else if (endUnit) {
                status = 'FIM_UNIDADE';
                reason = `Fim da ${endUnit.unit}ª unidade`;
            } else if (unit) {
                status = weekday === 0 || weekday === 6 ? 'FIM_SEMANA' : 'LETIVO';
                if (status === 'FIM_SEMANA') reason = 'Final de semana';
            } else {
                status = 'FORA_PERIODO';
                reason = 'Fora do período letivo';
            }

            days.push({
                date: iso,
                status,
                reason,
                unit: unit?.unit ?? startUnit?.unit ?? endUnit?.unit ?? null,
            });
        }

        return { year, month, units, days };
    }

    private async getClassDisciplineContext(
        userId: number,
        classDisciplineId: number,
    ): Promise<ClassDisciplineContext> {
        const rows = await this.prisma.$queryRaw<ClassDisciplineContext[]>(Prisma.sql`
            SELECT TOP 1
                tdp.TMA_COD AS classId,
                tdp.ESC_COD AS schoolId,
                tdp.CUR_COD AS courseId,
                tdp.TMD_ANO_LETIVO AS year
            FROM FR_USUARIO u
            JOIN EDU_TURMA_DISCIPLINA_PROFESSOR tdp ON tdp.PES_COD_PROFESSOR = u.PES_COD
            WHERE u.USR_CODIGO = ${userId}
              AND tdp.TMD_COD = ${classDisciplineId}
        `);

        const ctx = rows[0];
        if (!ctx) {
            throw Object.assign(new Error('Turma/disciplina nao encontrada para o usuario autenticado.'), {
                statusCode: 404,
            });
        }
        return ctx;
    }
}

function toIsoDate(value: Date): string {
    const year = value.getUTCFullYear();
    const month = String(value.getUTCMonth() + 1).padStart(2, '0');
    const day = String(value.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function findUnitForDate(units: CalendarUnit[], iso: string): CalendarUnit | undefined {
    return units.find((u) => iso >= u.startDate && iso <= u.endDate);
}
