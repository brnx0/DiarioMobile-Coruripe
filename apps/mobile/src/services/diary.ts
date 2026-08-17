import type {
    AttendanceStudent,
    ContentHistoryItem,
    UpdateAttendanceStudent,
} from '@diariomobile/shared-types';
import { getApiClient } from './apiClient';

export async function fetchAttendance(
    classDisciplineId: number,
    date: string,
): Promise<AttendanceStudent[]> {
    const api = getApiClient();
    const { data } = await api.get<AttendanceStudent[]>(
        `/diary/class-disciplines/${classDisciplineId}/attendance`,
        { params: { date } },
    );
    return data;
}

export async function updateAttendance(students: UpdateAttendanceStudent[]): Promise<void> {
    const api = getApiClient();
    await api.patch('/diary/attendance', { students });
}

export async function updateContent(
    diaryContentId: number,
    content: string,
    methodology: string,
): Promise<void> {
    const api = getApiClient();
    await api.patch(`/diary/content/${diaryContentId}`, { content, methodology });
}

export async function fetchContentHistory(classDisciplineId: number): Promise<ContentHistoryItem[]> {
    const api = getApiClient();
    const { data } = await api.get<ContentHistoryItem[]>(
        `/diary/class-disciplines/${classDisciplineId}/content-history`,
    );
    return data;
}

export async function replicateContent(
    diaryContentId: number,
    sourceDiaryContentIds: number[],
): Promise<void> {
    const api = getApiClient();
    await api.post(`/diary/content/${diaryContentId}/replicate`, { sourceDiaryContentIds });
}
