
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
  testId: string;
  studentId: string;
  isAbsent: boolean;
  scores: { [questionId: string]: number };
  totalScore: number;
  percentage: number;
}

export interface Test {
  id: string;
  name: string;
  type: string;
  subjectId: string;
  teacherId: string;
  classId: string;
  sectionId: string;
  date: string;
  questions: Question[];
  results: TestResult[];
  notes: string;
  draft: boolean;
}

export interface School {
  id: string;
  name: string;
  principal: string;
}
