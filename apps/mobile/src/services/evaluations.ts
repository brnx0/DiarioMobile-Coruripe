import type {
    Evaluation,
    EvaluationFieldKey,
    EvaluationPeriod,
    EvaluationStudent,
    EvaluationType,
    Indicator,
    IndicatorStudent,
} from '@diariomobile/shared-types';
import { getApiClient } from './apiClient';

export async function fetchEvaluationPeriods(classDisciplineId: number): Promise<EvaluationPeriod[]> {
    const api = getApiClient();
    const { data } = await api.get<EvaluationPeriod[]>(
        `/evaluations/class-disciplines/${classDisciplineId}/periods`,
    );
    return data;
}

export async function fetchEvaluationTypes(classDisciplineId: number): Promise<EvaluationType[]> {
    const api = getApiClient();
    const { data } = await api.get<EvaluationType[]>(
        `/evaluations/class-disciplines/${classDisciplineId}/types`,
    );
    return data;
}

export async function fetchEvaluations(params: {
    classDisciplineId: number;
    periodId: number;
    typeId: number;
}): Promise<Evaluation[]> {
    const api = getApiClient();
    const { data } = await api.get<Evaluation[]>('/evaluations', { params });
    return data;
}

export async function fetchEvaluationStudents(
    evaluationId: number,
    fieldKey: EvaluationFieldKey,
): Promise<EvaluationStudent[]> {
    const api = getApiClient();
    const { data } = await api.get<EvaluationStudent[]>(
        `/evaluations/${evaluationId}/students`,
        { params: { fieldKey } },
    );
    return data;
}

export async function saveEvaluationGrades(
    evaluationId: number,
    payload: {
        fieldKey: EvaluationFieldKey;
        evaluation: unknown;
        students: EvaluationStudent[];
    },
): Promise<void> {
    const api = getApiClient();
    await api.post(`/evaluations/${evaluationId}/grades`, payload);
}

export async function fetchIndicators(classDisciplineId: number): Promise<Indicator[]> {
    const api = getApiClient();
    const { data } = await api.get<Indicator[]>('/evaluations/indicators', {
        params: { classDisciplineId },
    });
    return data;
}

export async function fetchIndicatorStudents(
    indicatorId: number,
    classDisciplineId: number,
    unit: number,
): Promise<IndicatorStudent[]> {
    const api = getApiClient();
    const { data } = await api.get<IndicatorStudent[]>(
        `/evaluations/indicators/${indicatorId}/students`,
        { params: { classDisciplineId, unit } },
    );
    return data;
}

export async function saveIndicatorGrades(
    indicatorId: number,
    payload: {
        classDisciplineId: number;
        unit: number;
        students: IndicatorStudent[];
    },
): Promise<void> {
    const api = getApiClient();
    await api.post(`/evaluations/indicators/${indicatorId}/grades`, payload);
}
