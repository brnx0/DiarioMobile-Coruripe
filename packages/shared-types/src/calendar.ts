export type CalendarDayStatus =
    | 'LETIVO'
    | 'FERIADO'
    | 'FORA_PERIODO'
    | 'FIM_SEMANA'
    | 'INICIO_UNIDADE'
    | 'FIM_UNIDADE';

export interface CalendarUnit {
    unit: number;
    semester: number | null;
    startDate: string;
    endDate: string;
}

export interface CalendarDay {
    date: string;
    status: CalendarDayStatus;
    reason: string | null;
    unit: number | null;
}

export interface CalendarMonth {
    year: number;
    month: number;
    units: CalendarUnit[];
    days: CalendarDay[];
}
