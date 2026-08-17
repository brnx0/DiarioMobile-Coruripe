import type { LessonPlan, SaveLessonPlanInput } from '@diariomobile/shared-types';
import { getApiClient } from './apiClient';

export async function fetchLessonPlans(schoolId: number, nextDays = 0): Promise<LessonPlan[]> {
    const api = getApiClient();
    const { data } = await api.get<LessonPlan[]>('/lesson-plans', {
        params: { schoolId, nextDays },
    });
    return data;
}

export async function createLessonPlan(input: SaveLessonPlanInput): Promise<void> {
    const api = getApiClient();
    await api.post('/lesson-plans', input);
}

export async function updateLessonPlan(lessonPlanId: number, input: SaveLessonPlanInput): Promise<void> {
    const api = getApiClient();
    await api.patch(`/lesson-plans/${lessonPlanId}`, input);
}

export async function deleteLessonPlan(lessonPlanId: number): Promise<void> {
    const api = getApiClient();
    await api.delete(`/lesson-plans/${lessonPlanId}`);
}
