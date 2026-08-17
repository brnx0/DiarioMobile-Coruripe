export interface AcademicYear {
    id: number;
    year: number;
    label: string;
    active: boolean;
}

export interface School {
    id: number;
    name: string;
}

export interface ClassDiscipline {
    id: number;
    classId: number;
    schoolId: number;
    gradeId: number;
    gradeName: string;
    className: string;
    shiftName: string;
    courseName: string;
    subjectId: number;
    subjectName: string;
    teacherPersonId: number;
    year: number;
}

export interface Subject {
    id: number;
    name: string;
}

export interface WeekdayAllocation {
    day: 1 | 2 | 3 | 4 | 5 | 6 | 7;
    allocated: boolean;
}

export interface UpcomingClass {
    schoolId: number;
    classId: number;
    slot: number;
    teacherId: number;
    subjectId: number;
    subjectName: string;
    day: number;
    className: string;
    gradeName: string;
    teacherName: string;
}
