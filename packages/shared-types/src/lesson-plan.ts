export interface LessonPlan {
    id: number;
    theme: string;
    startDate: string;
    endDate: string;
    gradeId: number;
    gradeName: string | null;
    subjectId: number;
    subjectName: string | null;
    conceptualContent: string;
    strategy: string;
    schoolId: number;
    schoolName: string | null;
}

export interface SaveLessonPlanInput {
    theme: string;
    startDate: string;
    endDate: string;
    gradeId: number;
    subjectId: number;
    conceptualContent: string;
    strategy: string;
    schoolId: number;
}
