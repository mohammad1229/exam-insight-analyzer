
export interface Student {
  id: string;
  name: string;
  classId: string;
  sectionId: string;
}

export interface Teacher {
  id: string;
  name: string;
  subjects: string[];
}

export interface Class {
  id: string;
  name: string;
  sections: Section[];
}

export interface Section {
  id: string;
  name: string;
}

export interface Subject {
  id: string;
  name: string;
}

export interface Question {
  id: string;
  type: string;
  maxScore: number;
}

export interface TestResult {
  id: string;
  testId?: string;
  test_id?: string;
  studentId?: string;
  student_id?: string;
  studentName?: string;
  isAbsent?: boolean;
  is_absent?: boolean;
  scores: { [questionId: string]: number };
  totalScore?: number;
  total_score?: number;
  percentage: number;
  students?: { name: string };
}

export interface Test {
  id: string;
  name: string;
  type?: string;
  test_type?: string;
  subjectId?: string;
  subject_id?: string;
  teacherId?: string;
  teacher_id?: string;
  classId?: string;
  class_id?: string;
  sectionId?: string;
  section_id?: string;
  date?: string;
  test_date?: string;
  questions: Question[];
  results?: TestResult[];
  notes?: string;
  draft?: boolean;
  is_draft?: boolean;
  // Name lookups from related tables
  className?: string;
  sectionName?: string;
  subjectName?: string;
  teacherName?: string;
  subjects?: { name: string };
  teachers?: { name: string };
  classes?: { name: string };
  sections?: { name: string };
}

export interface School {
  id: string;
  name: string;
  principal: string;
}
