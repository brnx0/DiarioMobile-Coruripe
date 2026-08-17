export interface EvaluationPeriod {
    id: number;
    description: string;
    minDate: string;
    maxDate: string;
}

export interface EvaluationType {
    id: number;
    description: string;
}

export interface Evaluation {
    id: number;
    avaId: number;
    description: string;
    date: string;
    value: number;
    totalAvailable: number;
}

export interface EvaluationStudent {
    id: number;
    name: string;
    grade: number | string;
    average: number;
}

export interface SaveEvaluationGradesInput {
    fieldKey: string;
    evaluation: unknown;
    students: EvaluationStudent[];
}

export interface Indicator {
    id: number;
    description: string;
}

export interface IndicatorStudent {
    id: number;
    name: string;
    value: string;
}

export interface SaveIndicatorGradesInput {
    indicatorId: number;
    unit: number;
    students: IndicatorStudent[];
}

export type EvaluationFieldKey =
    | 'AVA_AV1' | 'AVA_AV2' | 'AVA_AV3' | 'AVA_AV4' | 'AVA_AV5'
    | 'AVA_AV6' | 'AVA_AV7' | 'AVA_AV8' | 'AVA_AV9' | 'AVA_RECUPERACAO';
