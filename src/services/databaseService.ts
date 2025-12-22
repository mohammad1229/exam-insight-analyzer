// Database Service - Manages all data with Supabase for persistence
// Each school has its own isolated data using school_id

import { supabase } from "@/integrations/supabase/client";

// Get current school ID for data isolation
export const getCurrentSchoolId = (): string => {
  return localStorage.getItem("currentSchoolId") || "";
};

// Types
export interface DBClass {
  id: string;
  school_id: string;
  name: string;
  display_order: number;
  sections?: DBSection[];
}

export interface DBSection {
  id: string;
  class_id: string;
  school_id: string;
  name: string;
  display_order: number;
}

export interface DBSubject {
  id: string;
  school_id: string;
  name: string;
  display_order: number;
}

export interface DBStudent {
  id: string;
  school_id: string;
  class_id: string;
  section_id: string;
  name: string;
  student_number?: string;
  classes?: { name: string };
  sections?: { name: string };
}

export interface DBTeacher {
  id: string;
  school_id: string;
  name: string;
  username: string;
  email?: string;
  phone?: string;
  role: string;
  is_active: boolean;
  must_change_password: boolean;
  teacher_subjects?: { subject_id: string; subjects?: { name: string } }[];
  teacher_classes?: { class_id: string; classes?: { name: string } }[];
}

export interface DBTest {
  id: string;
  school_id: string;
  teacher_id: string;
  subject_id: string;
  class_id: string;
  section_id: string;
  name: string;
  test_type: string;
  test_date: string;
  questions: any[];
  notes?: string;
  is_draft: boolean;
  teachers?: { name: string };
  subjects?: { name: string };
  classes?: { name: string };
  sections?: { name: string };
  test_results?: DBTestResult[];
}

export interface DBTestResult {
  id: string;
  test_id: string;
  student_id: string;
  is_absent: boolean;
  scores: Record<string, number>;
  total_score: number;
  percentage: number;
  students?: { name: string };
}

export interface DBPerformanceLevel {
  id: string;
  school_id: string;
  name: string;
  min_score: number;
  max_score: number;
  color: string;
  display_order: number;
}

// API helper
const callSchoolDataAPI = async (action: string, data?: any) => {
  const schoolId = getCurrentSchoolId();
  if (!schoolId) {
    console.warn(`لم يتم تحديد المدرسة للعملية: ${action}`);
    // For read operations, return empty array; for write operations, throw error
    if (action.startsWith('get') || action.startsWith('Get')) {
      return [];
    }
    throw new Error("لم يتم تحديد المدرسة - يرجى تسجيل الدخول مرة أخرى");
  }

  const { data: result, error } = await supabase.functions.invoke('school-data', {
    body: { action, schoolId, data }
  });

  if (error) throw error;
  if (!result.success) throw new Error(result.error);
  
  return result.data;
};

// ========== CLASSES ==========
export const getClassesDB = async (): Promise<DBClass[]> => {
  return await callSchoolDataAPI('getClasses');
};

export const addClassDB = async (classData: { name: string; sections?: { name: string }[] }): Promise<DBClass> => {
  return await callSchoolDataAPI('addClass', classData);
};

export const updateClassDB = async (id: string, name: string): Promise<void> => {
  await callSchoolDataAPI('updateClass', { id, name });
};

export const deleteClassDB = async (id: string): Promise<void> => {
  await callSchoolDataAPI('deleteClass', { id });
};

// ========== SECTIONS ==========
export const getSectionsDB = async (): Promise<DBSection[]> => {
  return await callSchoolDataAPI('getSections');
};

export const addSectionDB = async (classId: string, name: string): Promise<DBSection> => {
  return await callSchoolDataAPI('addSection', { class_id: classId, name });
};

export const deleteSectionDB = async (id: string): Promise<void> => {
  await callSchoolDataAPI('deleteSection', { id });
};

// ========== SUBJECTS ==========
export const getSubjectsDB = async (): Promise<DBSubject[]> => {
  return await callSchoolDataAPI('getSubjects');
};

export const addSubjectDB = async (name: string): Promise<DBSubject> => {
  return await callSchoolDataAPI('addSubject', { name });
};

export const updateSubjectDB = async (id: string, name: string): Promise<void> => {
  await callSchoolDataAPI('updateSubject', { id, name });
};

export const deleteSubjectDB = async (id: string): Promise<void> => {
  await callSchoolDataAPI('deleteSubject', { id });
};

// ========== STUDENTS ==========
export const getStudentsDB = async (): Promise<DBStudent[]> => {
  return await callSchoolDataAPI('getStudents');
};

export const addStudentDB = async (studentData: { 
  name: string; 
  class_id: string; 
  section_id: string;
  student_number?: string;
}): Promise<DBStudent> => {
  return await callSchoolDataAPI('addStudent', studentData);
};

export const updateStudentDB = async (id: string, studentData: { 
  name?: string; 
  class_id?: string; 
  section_id?: string;
  student_number?: string;
}): Promise<void> => {
  await callSchoolDataAPI('updateStudent', { id, ...studentData });
};

export const deleteStudentDB = async (id: string): Promise<void> => {
  await callSchoolDataAPI('deleteStudent', { id });
};

export const bulkAddStudentsDB = async (students: { 
  name: string; 
  class_id: string; 
  section_id: string;
  student_number?: string;
}[]): Promise<DBStudent[]> => {
  return await callSchoolDataAPI('bulkAddStudents', { students });
};

// ========== TEACHERS ==========
export const getTeachersDB = async (): Promise<DBTeacher[]> => {
  return await callSchoolDataAPI('getTeachers');
};

export const addTeacherDB = async (teacherData: { 
  name: string; 
  username: string;
  password: string;
  email?: string;
  phone?: string;
  role?: string;
  subjects?: string[];
  classes?: string[];
  must_change_password?: boolean;
}): Promise<DBTeacher> => {
  return await callSchoolDataAPI('addTeacher', teacherData);
};

export const updateTeacherDB = async (id: string, teacherData: { 
  name?: string; 
  username?: string;
  password?: string;
  email?: string;
  phone?: string;
  role?: string;
  is_active?: boolean;
  subjects?: string[];
  classes?: string[];
  must_change_password?: boolean;
}): Promise<void> => {
  await callSchoolDataAPI('updateTeacher', { id, ...teacherData });
};

export const deleteTeacherDB = async (id: string): Promise<void> => {
  await callSchoolDataAPI('deleteTeacher', { id });
};

export const verifyTeacherLoginDB = async (username: string, password: string): Promise<{
  success: boolean;
  error?: string;
  must_change_password?: boolean;
  teacher?: any;
}> => {
  try {
    // Use the special action that doesn't require schoolId
    const { data: result, error } = await supabase.functions.invoke('school-data', {
      body: { action: 'verifyTeacherLoginByUsername', schoolId: 'none', data: { username, password } }
    });

    if (error) throw error;
    
    if (result.success && result.teacher?.school_id) {
      // Set the school ID for future requests
      localStorage.setItem("currentSchoolId", result.teacher.school_id);
    }
    
    return result;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// ========== TESTS ==========
export const getTestsDB = async (): Promise<DBTest[]> => {
  return await callSchoolDataAPI('getTests');
};

export const addTestDB = async (testData: {
  teacher_id: string;
  subject_id: string;
  class_id: string;
  section_id: string;
  name: string;
  test_type?: string;
  test_date?: string;
  questions?: any[];
  notes?: string;
  is_draft?: boolean;
}): Promise<DBTest> => {
  return await callSchoolDataAPI('addTest', testData);
};

export const updateTestDB = async (id: string, testData: {
  name?: string;
  test_type?: string;
  test_date?: string;
  questions?: any[];
  notes?: string;
  is_draft?: boolean;
}): Promise<void> => {
  await callSchoolDataAPI('updateTest', { id, ...testData });
};

export const deleteTestDB = async (id: string): Promise<void> => {
  await callSchoolDataAPI('deleteTest', { id });
};

export const saveTestResultsDB = async (testId: string, results: {
  student_id: string;
  is_absent?: boolean;
  scores?: Record<string, number>;
  total_score?: number;
  percentage?: number;
}[]): Promise<void> => {
  await callSchoolDataAPI('saveTestResults', { test_id: testId, results });
};

// ========== PERFORMANCE LEVELS ==========
export const getPerformanceLevelsDB = async (): Promise<DBPerformanceLevel[]> => {
  return await callSchoolDataAPI('getPerformanceLevels');
};

export const addPerformanceLevelDB = async (levelData: {
  name: string;
  min_score: number;
  max_score: number;
  color: string;
}): Promise<DBPerformanceLevel> => {
  return await callSchoolDataAPI('addPerformanceLevel', levelData);
};

export const updatePerformanceLevelDB = async (id: string, levelData: {
  name?: string;
  min_score?: number;
  max_score?: number;
  color?: string;
}): Promise<void> => {
  await callSchoolDataAPI('updatePerformanceLevel', { id, ...levelData });
};

export const deletePerformanceLevelDB = async (id: string): Promise<void> => {
  await callSchoolDataAPI('deletePerformanceLevel', { id });
};

export const bulkSavePerformanceLevelsDB = async (levels: {
  name: string;
  min_score: number;
  max_score: number;
  color: string;
}[]): Promise<void> => {
  await callSchoolDataAPI('bulkSavePerformanceLevels', { levels });
};

// ========== INITIALIZE SCHOOL DATA ==========
export const initializeSchoolDataDB = async (): Promise<void> => {
  await callSchoolDataAPI('initializeSchoolData');
};
