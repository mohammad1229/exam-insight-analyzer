import { Student, Teacher, Class, Section, Subject, Question, TestResult, Test, School } from "@/types";

// Get school name from license or localStorage
const getSchoolName = () => {
  return localStorage.getItem("licenseSchoolName") || "اسم المدرسة";
};

const getDirectorName = () => {
  return localStorage.getItem("licenseDirectorName") || "";
};

export const schoolData: School = {
  id: "school1",
  name: getSchoolName(),
  principal: getDirectorName()
};

export const teachersData: Teacher[] = [
  { id: "t1", name: "محمد الشوامرة", subjects: ["sub1", "sub2"] },
  { id: "t2", name: "سارة أحمد", subjects: ["sub3"] },
  { id: "t3", name: "خالد عبد الله", subjects: ["sub1", "sub4"] }
];

export const classesData: Class[] = [
  {
    id: "c1",
    name: "الصف الأول",
    sections: [
      { id: "s1c1", name: "أ" },
      { id: "s2c1", name: "ب" }
    ]
  },
  {
    id: "c2",
    name: "الصف الثاني",
    sections: [
      { id: "s1c2", name: "أ" },
      { id: "s2c2", name: "ب" }
    ]
  },
  {
    id: "c3",
    name: "الصف الثالث",
    sections: [
      { id: "s1c3", name: "أ" },
      { id: "s2c3", name: "ب" }
    ]
  }
];

export const subjectsData: Subject[] = [
  { id: "sub1", name: "الرياضيات" },
  { id: "sub2", name: "العلوم" },
  { id: "sub3", name: "اللغة العربية" },
  { id: "sub4", name: "اللغة الإنجليزية" }
];

export const studentsData: Student[] = [
  { id: "st1", name: "أحمد محمد", classId: "c1", sectionId: "s1c1" },
  { id: "st2", name: "فاطمة علي", classId: "c1", sectionId: "s1c1" },
  { id: "st3", name: "عمر خالد", classId: "c1", sectionId: "s2c1" },
  { id: "st4", name: "نور سامي", classId: "c1", sectionId: "s2c1" },
  { id: "st5", name: "حسن كريم", classId: "c2", sectionId: "s1c2" },
  { id: "st6", name: "رنا أحمد", classId: "c2", sectionId: "s1c2" },
  { id: "st7", name: "سعيد محمود", classId: "c2", sectionId: "s2c2" },
  { id: "st8", name: "ليلى رامي", classId: "c2", sectionId: "s2c2" },
  { id: "st9", name: "يوسف سالم", classId: "c3", sectionId: "s1c3" },
  { id: "st10", name: "دانا وليد", classId: "c3", sectionId: "s1c3" },
  { id: "st11", name: "باسم عماد", classId: "c3", sectionId: "s2c3" },
  { id: "st12", name: "سمر طارق", classId: "c3", sectionId: "s2c3" }
];

export const testsData: Test[] = [
  {
    id: "test1",
    name: "اختبار منتصف الفصل",
    type: "امتحان شهري",
    subjectId: "sub1",
    teacherId: "t1",
    classId: "c1",
    sectionId: "s1c1",
    date: "2024-05-05",
    questions: [
      { id: "q1", type: "اختيار من متعدد", maxScore: 5 },
      { id: "q2", type: "اكمل الفراغ", maxScore: 5 },
      { id: "q3", type: "مسائل حسابية", maxScore: 10 },
      { id: "q4", type: "أسئلة قصيرة", maxScore: 5 }
    ],
    results: [
      {
        id: "r1",
        testId: "test1",
        studentId: "st1",
        isAbsent: false,
        scores: { q1: 4, q2: 3, q3: 8, q4: 4 },
        totalScore: 19,
        percentage: 76
      },
      {
        id: "r2",
        testId: "test1",
        studentId: "st2",
        isAbsent: false,
        scores: { q1: 5, q2: 5, q3: 9, q4: 5 },
        totalScore: 24,
        percentage: 96
      },
      {
        id: "r3",
        testId: "test1",
        studentId: "st3",
        isAbsent: true,
        scores: {},
        totalScore: 0,
        percentage: 0
      },
      {
        id: "r4",
        testId: "test1",
        studentId: "st4",
        isAbsent: false,
        scores: { q1: 3, q2: 4, q3: 5, q4: 3 },
        totalScore: 15,
        percentage: 60
      }
    ],
    notes: "تم إجراء الاختبار ب��جاح",
    draft: false
  }
];

export const getStudentsByClassAndSection = (
  classId: string,
  sectionId: string
): Student[] => {
  return studentsData.filter(
    student => student.classId === classId && student.sectionId === sectionId
  );
};

export const getClassById = (classId: string): Class | undefined => {
  return classesData.find(c => c.id === classId);
};

export const getSectionById = (
  classId: string,
  sectionId: string
): Section | undefined => {
  const targetClass = classesData.find(c => c.id === classId);
  return targetClass?.sections.find(s => s.id === sectionId);
};

export const getTeacherById = (teacherId: string): Teacher | undefined => {
  return teachersData.find(t => t.id === teacherId);
};

export const getSubjectById = (subjectId: string): Subject | undefined => {
  return subjectsData.find(s => s.id === subjectId);
};

export const getStudentById = (studentId: string): Student | undefined => {
  return studentsData.find(s => s.id === studentId);
};
