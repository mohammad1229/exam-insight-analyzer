
import { 
  testsData, 
  classesData, 
  subjectsData,
  getClassById,
  getSectionById,
  getSubjectById,
  getTeacherById
} from "@/data/mockData";

export interface Report {
  id: string;
  testId: string;
  testName: string;
  className: string;
  sectionName: string;
  subjectName: string;
  teacherName: string;
  date: string;
  totalStudents: number;
  passedStudents: number;
  passRate: number;
}

// Prepare mock reports data
export const prepareMockReports = (): Report[] => {
  return testsData.map(test => {
    const classObj = getClassById(test.classId);
    const section = getSectionById(test.classId, test.sectionId);
    const subject = getSubjectById(test.subjectId);
    const teacher = getTeacherById(test.teacherId);
    
    return {
      id: `report_${test.id}`,
      testId: test.id,
      testName: test.name,
      className: classObj?.name || '',
      sectionName: section?.name || '',
      subjectName: subject?.name || '',
      teacherName: teacher?.name || '',
      date: test.date,
      totalStudents: test.results.filter(r => !r.isAbsent).length,
      passedStudents: test.results.filter(r => !r.isAbsent && r.percentage >= 50).length,
      passRate: (() => {
        const present = test.results.filter(r => !r.isAbsent).length;
        const passed = test.results.filter(r => !r.isAbsent && r.percentage >= 50).length;
        return present > 0 ? Math.round((passed / present) * 100) : 0;
      })()
    };
  });
};

// Prepare chart data
export const prepareChartData = (reports: Report[], filteredClass = "") => {
  const subjectStats = subjectsData.map(subject => {
    const subjectTests = filteredClass ? 
      reports.filter(report => report.subjectName === subject.name && report.className === filteredClass) :
      reports.filter(report => report.subjectName === subject.name);
    
    const avgPassRate = subjectTests.length > 0 
      ? Math.round(subjectTests.reduce((sum, test) => sum + test.passRate, 0) / subjectTests.length)
      : 0;
      
    return {
      name: subject.name,
      نسبة_النجاح: avgPassRate,
      اختبارات: subjectTests.length
    };
  }).filter(subject => subject.اختبارات > 0);
  
  return subjectStats;
};
