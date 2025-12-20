// Data Service - Manages all data with localStorage for persistence
// Each school has its own isolated data using school_id prefix

import { Student, Teacher, Class, Subject, Section, Test, School } from "@/types";
import { studentsData as initialStudents, classesData as initialClasses, subjectsData as initialSubjects, teachersData as initialTeachers, testsData as initialTests, schoolData as initialSchool } from "@/data/mockData";

// Get current school ID for data isolation
const getCurrentSchoolId = (): string => {
  return localStorage.getItem("currentSchoolId") || "default";
};

// Generate storage key with school prefix for data isolation
const getSchoolStorageKey = (baseKey: string): string => {
  const schoolId = getCurrentSchoolId();
  return `${schoolId}_${baseKey}`;
};

// Keys for localStorage (base keys - will be prefixed with school_id)
const BASE_STORAGE_KEYS = {
  STUDENTS: "students",
  CLASSES: "classes",
  SUBJECTS: "subjects",
  TEACHERS: "teachers",
  TESTS: "tests",
  SCHOOL: "school",
};

// Extended types
export interface TeacherWithCredentials extends Teacher {
  username: string;
  password: string;
  assignedClasses: string[];
  assignedSubjects: string[];
  must_change_password?: boolean;
  role?: 'teacher' | 'senior_teacher';
}

// Initialize data from localStorage or use defaults
const initializeData = <T>(baseKey: string, defaultData: T): T => {
  try {
    const key = getSchoolStorageKey(baseKey);
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
    localStorage.setItem(key, JSON.stringify(defaultData));
    return defaultData;
  } catch (error) {
    console.error(`Error loading ${baseKey}:`, error);
    return defaultData;
  }
};

// Save data to localStorage with school prefix
const saveData = <T>(baseKey: string, data: T): void => {
  try {
    const key = getSchoolStorageKey(baseKey);
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${baseKey}:`, error);
  }
};

// Students
export const getStudents = (): Student[] => {
  return initializeData(BASE_STORAGE_KEYS.STUDENTS, initialStudents);
};

export const saveStudents = (students: Student[]): void => {
  saveData(BASE_STORAGE_KEYS.STUDENTS, students);
};

export const addStudent = (student: Student): void => {
  const students = getStudents();
  students.push(student);
  saveStudents(students);
};

export const updateStudent = (studentId: string, updates: Partial<Student>): void => {
  const students = getStudents();
  const index = students.findIndex(s => s.id === studentId);
  if (index !== -1) {
    students[index] = { ...students[index], ...updates };
    saveStudents(students);
  }
};

export const deleteStudent = (studentId: string): void => {
  const students = getStudents();
  saveStudents(students.filter(s => s.id !== studentId));
};

export const getStudentsByClassAndSection = (classId: string, sectionId: string): Student[] => {
  return getStudents().filter(s => s.classId === classId && s.sectionId === sectionId);
};

export const getStudentById = (studentId: string): Student | undefined => {
  return getStudents().find(s => s.id === studentId);
};

// Classes
export const getClasses = (): Class[] => {
  return initializeData(BASE_STORAGE_KEYS.CLASSES, initialClasses);
};

export const saveClasses = (classes: Class[]): void => {
  saveData(BASE_STORAGE_KEYS.CLASSES, classes);
};

export const addClass = (cls: Class): void => {
  const classes = getClasses();
  classes.push(cls);
  saveClasses(classes);
};

export const updateClass = (classId: string, updates: Partial<Class>): void => {
  const classes = getClasses();
  const index = classes.findIndex(c => c.id === classId);
  if (index !== -1) {
    classes[index] = { ...classes[index], ...updates };
    saveClasses(classes);
  }
};

export const deleteClass = (classId: string): void => {
  const classes = getClasses();
  saveClasses(classes.filter(c => c.id !== classId));
};

export const getClassById = (classId: string): Class | undefined => {
  return getClasses().find(c => c.id === classId);
};

export const getSectionById = (classId: string, sectionId: string): Section | undefined => {
  const targetClass = getClasses().find(c => c.id === classId);
  return targetClass?.sections.find(s => s.id === sectionId);
};

// Subjects
export const getSubjects = (): Subject[] => {
  return initializeData(BASE_STORAGE_KEYS.SUBJECTS, initialSubjects);
};

export const saveSubjects = (subjects: Subject[]): void => {
  saveData(BASE_STORAGE_KEYS.SUBJECTS, subjects);
};

export const addSubject = (subject: Subject): void => {
  const subjects = getSubjects();
  subjects.push(subject);
  saveSubjects(subjects);
};

export const updateSubject = (subjectId: string, updates: Partial<Subject>): void => {
  const subjects = getSubjects();
  const index = subjects.findIndex(s => s.id === subjectId);
  if (index !== -1) {
    subjects[index] = { ...subjects[index], ...updates };
    saveSubjects(subjects);
  }
};

export const deleteSubject = (subjectId: string): void => {
  const subjects = getSubjects();
  saveSubjects(subjects.filter(s => s.id !== subjectId));
};

export const getSubjectById = (subjectId: string): Subject | undefined => {
  return getSubjects().find(s => s.id === subjectId);
};

// Teachers
export const getTeachers = (): TeacherWithCredentials[] => {
  const key = getSchoolStorageKey(BASE_STORAGE_KEYS.TEACHERS);
  const stored = localStorage.getItem(key);
  if (stored) {
    return JSON.parse(stored);
  }
  // Initialize with mock data
  const teachers: TeacherWithCredentials[] = initialTeachers.map(t => ({
    ...t,
    username: t.name.split(' ')[0].toLowerCase(),
    password: "12345",
    assignedClasses: [],
    assignedSubjects: t.subjects
  }));
  saveTeachers(teachers);
  return teachers;
};

export const saveTeachers = (teachers: TeacherWithCredentials[]): void => {
  saveData(BASE_STORAGE_KEYS.TEACHERS, teachers);
};

export const addTeacher = (teacher: TeacherWithCredentials): void => {
  const teachers = getTeachers();
  teachers.push(teacher);
  saveTeachers(teachers);
};

export const updateTeacher = (teacherId: string, updates: Partial<TeacherWithCredentials>): void => {
  const teachers = getTeachers();
  const index = teachers.findIndex(t => t.id === teacherId);
  if (index !== -1) {
    teachers[index] = { ...teachers[index], ...updates };
    saveTeachers(teachers);
  }
};

export const deleteTeacher = (teacherId: string): void => {
  const teachers = getTeachers();
  saveTeachers(teachers.filter(t => t.id !== teacherId));
};

export const getTeacherById = (teacherId: string): TeacherWithCredentials | undefined => {
  return getTeachers().find(t => t.id === teacherId);
};

// Tests
export const getTests = (): Test[] => {
  return initializeData(BASE_STORAGE_KEYS.TESTS, initialTests);
};

export const saveTests = (tests: Test[]): void => {
  saveData(BASE_STORAGE_KEYS.TESTS, tests);
};

export const addTest = (test: Test): void => {
  const tests = getTests();
  tests.push(test);
  saveTests(tests);
};

export const updateTest = (testId: string, updates: Partial<Test>): void => {
  const tests = getTests();
  const index = tests.findIndex(t => t.id === testId);
  if (index !== -1) {
    tests[index] = { ...tests[index], ...updates };
    saveTests(tests);
  }
};

export const deleteTest = (testId: string): void => {
  const tests = getTests();
  saveTests(tests.filter(t => t.id !== testId));
};

// School
export const getSchool = (): School => {
  return initializeData(BASE_STORAGE_KEYS.SCHOOL, initialSchool);
};

export const saveSchool = (school: School): void => {
  saveData(BASE_STORAGE_KEYS.SCHOOL, school);
};

// Get current logged in teacher
export const getCurrentTeacher = (): TeacherWithCredentials | null => {
  // First try currentTeacherId
  let teacherId = localStorage.getItem("currentTeacherId");
  
  // Fallback to loggedInTeacher for backward compatibility
  if (!teacherId) {
    const loggedInTeacher = localStorage.getItem("loggedInTeacher");
    if (loggedInTeacher) {
      try {
        const parsed = JSON.parse(loggedInTeacher);
        teacherId = parsed.id;
        // Also set currentTeacherId for future use
        if (teacherId) {
          localStorage.setItem("currentTeacherId", teacherId);
        }
      } catch (e) {
        console.error("Error parsing loggedInTeacher:", e);
      }
    }
  }
  
  if (teacherId) {
    return getTeacherById(teacherId) || null;
  }
  return null;
};

export const setCurrentTeacher = (teacherId: string): void => {
  localStorage.setItem("currentTeacherId", teacherId);
};

export const clearCurrentTeacher = (): void => {
  localStorage.removeItem("currentTeacherId");
};

// Get classes for a specific teacher
export const getTeacherClasses = (teacherId: string): Class[] => {
  const teacher = getTeacherById(teacherId);
  if (!teacher) return [];
  
  const allClasses = getClasses();
  return allClasses.filter(c => teacher.assignedClasses.includes(c.id));
};

// Get subjects for a specific teacher
export const getTeacherSubjects = (teacherId: string): Subject[] => {
  const teacher = getTeacherById(teacherId);
  if (!teacher) return [];
  
  const allSubjects = getSubjects();
  return allSubjects.filter(s => teacher.assignedSubjects.includes(s.id));
};

// Get students for teacher's assigned classes
export const getTeacherStudents = (teacherId: string): Student[] => {
  const teacher = getTeacherById(teacherId);
  if (!teacher) return [];
  
  const allStudents = getStudents();
  return allStudents.filter(s => teacher.assignedClasses.includes(s.classId));
};

// Get current logged in admin
export const getCurrentAdmin = (): any | null => {
  const adminData = localStorage.getItem("adminData");
  if (adminData) {
    try {
      return JSON.parse(adminData);
    } catch (e) {
      console.error("Error parsing adminData:", e);
    }
  }
  return null;
};

// Check if user is admin only (not teacher)
export const isAdminOnly = (): boolean => {
  const admin = getCurrentAdmin();
  const teacher = getCurrentTeacher();
  return admin && !teacher;
};

// Check if user is teacher only (not admin)
export const isTeacherOnly = (): boolean => {
  const admin = getCurrentAdmin();
  const teacher = getCurrentTeacher();
  return teacher && !admin;
};
