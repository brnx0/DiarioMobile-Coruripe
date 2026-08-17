import type {
    AcademicYear,
    CalendarMonth,
    ClassDiscipline,
    School,
    Subject,
    UpcomingClass,
    WeekdayAllocation,
} from '@diariomobile/shared-types';
import { getApiClient } from './apiClient';

export async function fetchYears(): Promise<AcademicYear[]> {
    const api = getApiClient();
    const { data } = await api.get<AcademicYear[]>('/academic/years');
    return data;
}

export async function fetchSchools(year?: number): Promise<School[]> {
    const api = getApiClient();
    const { data } = await api.get<School[]>('/academic/schools', {
        params: year ? { year } : undefined,
    });
    return data;
}

export async function fetchClasses(schoolId: number, year?: number): Promise<ClassDiscipline[]> {
    const api = getApiClient();
    const { data } = await api.get<ClassDiscipline[]>(`/academic/schools/${schoolId}/classes`, {
        params: year ? { year } : undefined,
    });
    return data;
}

export async function fetchGrades(schoolId: number): Promise<Array<{ id: number; name: string }>> {
    const api = getApiClient();
    const { data } = await api.get<Array<{ id: number; name: string }>>(
        `/academic/schools/${schoolId}/grades`,
    );
    return data;
}

export async function fetchSubjects(
    schoolId: number,
    filters: { classId?: number; gradeId?: number; year?: number } = {},
): Promise<Subject[]> {
    const api = getApiClient();
    const { data } = await api.get<Subject[]>(`/academic/schools/${schoolId}/subjects`, {
        params: filters,
    });
    return data;
}

export async function fetchWeekdays(classDisciplineId: number): Promise<WeekdayAllocation[]> {
    const api = getApiClient();
    const { data } = await api.get<WeekdayAllocation[]>(
        `/academic/class-disciplines/${classDisciplineId}/weekdays`,
    );
    return data;
}

export async function fetchUpcomingClasses(schoolId: number, year?: number): Promise<UpcomingClass[]> {
    const api = getApiClient();
    const { data } = await api.get<UpcomingClass[]>(
        `/academic/schools/${schoolId}/upcoming-classes`,
        { params: year ? { year } : undefined },
    );
    return data;
}

export async function fetchCalendar(
    classDisciplineId: number,
    year: number,
    month: number,
): Promise<CalendarMonth> {
    const api = getApiClient();
    const { data } = await api.get<CalendarMonth>(
        `/academic/class-disciplines/${classDisciplineId}/calendar`,
        { params: { year, month } },
    );
    return data;
}
