export interface AttendanceStudent {
    attendanceControlId: number;
    enrollmentId: number;
    observation: string | null;
    studentName: string;
    hasDisability: boolean;
    diaryContentId: number;
    subjectId: number;
    attendance: number[];
    justification: string | null;
    classCount: number;
    lessonDate: string;
    content: string;
    methodology: string;
}

export interface UpdateAttendanceStudent {
    attendanceControlId: number;
    attendance: number[];
    justification?: string | null;
}

export interface ContentHistoryItem {
    diaryContentId: number;
    subjectId: number;
    content: string;
    methodology: string;
    lessonDate: string;
    classCount: number;
}
