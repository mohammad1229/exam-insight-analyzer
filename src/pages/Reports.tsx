import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import LicenseBanner from "@/components/LicenseBanner";
import AnimatedBackground from "@/components/AnimatedBackground";
import PageTransition from "@/components/PageTransition";
import QuestionAnalysis from "@/components/QuestionAnalysis";
import ReportGenerator from "@/components/ReportGenerator";
import ReportsCharts from "@/components/ReportsCharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Test } from "@/types";
import { 
  getTests, 
  getClassById, 
  getSectionById, 
  getSubjectById, 
  getTeacherById, 
  getStudentById,
  getCurrentTeacher
} from "@/services/dataService";
import { 
  getTestsDB, 
  getPerformanceLevelsDB,
  getClassesDB,
  getSectionsDB,
  getSubjectsDB,
  getTeachersDB,
  getStudentsDB,
  DBPerformanceLevel,
  DBClass,
  DBSection,
  DBSubject,
  DBTeacher,
  DBStudent,
  DBTest
} from "@/services/databaseService";
import { FileText, BarChart3, TableIcon, Loader2 } from "lucide-react";

interface DBLookups {
  classes: DBClass[];
  sections: DBSection[];
  subjects: DBSubject[];
  teachers: DBTeacher[];
  students: DBStudent[];
  classById: Record<string, DBClass>;
  sectionById: Record<string, DBSection>;
  subjectById: Record<string, DBSubject>;
  teacherById: Record<string, DBTeacher>;
  studentById: Record<string, DBStudent>;
}

const Reports = () => {
  const { testId } = useParams();
  const [tests, setTests] = useState<Test[]>([]);
  const [selectedTestId, setSelectedTestId] = useState("");
  const [performanceLevels, setPerformanceLevels] = useState<DBPerformanceLevel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dbLookups, setDbLookups] = useState<DBLookups | null>(null);
  
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load performance levels from database
        const levels = await getPerformanceLevelsDB();
        setPerformanceLevels(levels);

        // Load lookups from database
        const [classes, sections, subjects, teachers, students] = await Promise.all([
          getClassesDB(),
          getSectionsDB(),
          getSubjectsDB(),
          getTeachersDB(),
          getStudentsDB()
        ]);

        const lookups: DBLookups = {
          classes,
          sections,
          subjects,
          teachers,
          students,
          classById: Object.fromEntries(classes.map(c => [c.id, c])),
          sectionById: Object.fromEntries(sections.map(s => [s.id, s])),
          subjectById: Object.fromEntries(subjects.map(s => [s.id, s])),
          teacherById: Object.fromEntries(teachers.map(t => [t.id, t])),
          studentById: Object.fromEntries(students.map(s => [s.id, s]))
        };
        setDbLookups(lookups);

        // Try to load tests from database first
        try {
          const dbTests = await getTestsDB();
          if (dbTests && dbTests.length > 0) {
            // Convert DB tests to local format
            const convertedTests: Test[] = dbTests.map((test: DBTest) => ({
              id: test.id,
              name: test.name,
              type: test.test_type,
              date: test.test_date,
              classId: test.class_id,
              sectionId: test.section_id,
              subjectId: test.subject_id,
              teacherId: test.teacher_id,
              questions: test.questions || [],
              notes: test.notes || "",
              results: (test.test_results || []).map(r => ({
                id: r.id,
                studentId: r.student_id,
                isAbsent: r.is_absent,
                scores: r.scores || {},
                totalScore: Number(r.total_score) || 0,
                percentage: Number(r.percentage) || 0,
                studentName: r.students?.name || lookups.studentById[r.student_id]?.name
              }))
            }));

            const currentTeacher = getCurrentTeacher();
            const filteredTests = currentTeacher 
              ? convertedTests.filter(t => t.teacherId === currentTeacher.id)
              : convertedTests;

            setTests(filteredTests);

            if (testId && filteredTests.find(t => t.id === testId)) {
              setSelectedTestId(testId);
            } else if (filteredTests.length > 0) {
              setSelectedTestId(filteredTests[0].id);
            }
            return;
          }
        } catch (dbError) {
          console.log("Falling back to local storage for tests:", dbError);
        }

        // Fallback to local storage
        const currentTeacher = getCurrentTeacher();
        const allTests = getTests();
        
        const filteredTests = currentTeacher 
          ? allTests.filter(t => t.teacherId === currentTeacher.id)
          : allTests;
        
        setTests(filteredTests);
        
        if (testId && filteredTests.find(t => t.id === testId)) {
          setSelectedTestId(testId);
        } else if (filteredTests.length > 0) {
          setSelectedTestId(filteredTests[0].id);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        // Fallback to local storage
        const currentTeacher = getCurrentTeacher();
        const allTests = getTests();
        const filteredTests = currentTeacher 
          ? allTests.filter(t => t.teacherId === currentTeacher.id)
          : allTests;
        setTests(filteredTests);
        if (filteredTests.length > 0) {
          setSelectedTestId(filteredTests[0].id);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [testId]);
  
  const selectedTest = tests.find(test => test.id === selectedTestId);
  
  // Get names using DB lookups first, then fallback to local
  const getClassName = (classId: string): string => {
    if (dbLookups?.classById[classId]) {
      return dbLookups.classById[classId].name;
    }
    return getClassById(classId)?.name || '';
  };

  const getSectionName = (classId: string, sectionId: string): string => {
    if (dbLookups?.sectionById[sectionId]) {
      return dbLookups.sectionById[sectionId].name;
    }
    return getSectionById(classId, sectionId)?.name || '';
  };

  const getSubjectName = (subjectId: string): string => {
    if (dbLookups?.subjectById[subjectId]) {
      return dbLookups.subjectById[subjectId].name;
    }
    return getSubjectById(subjectId)?.name || '';
  };

  const getTeacherName = (teacherId: string): string => {
    if (dbLookups?.teacherById[teacherId]) {
      return dbLookups.teacherById[teacherId].name;
    }
    return getTeacherById(teacherId)?.name || '';
  };

  const getStudentName = (studentId: string, studentName?: string): string => {
    if (studentName) return studentName;
    if (dbLookups?.studentById[studentId]) {
      return dbLookups.studentById[studentId].name;
    }
    const student = getStudentById(studentId);
    return student?.name || studentId;
  };

  // Get performance level for a student
  const getPerformanceLevel = (percentage: number): { name: string; color: string } | null => {
    if (performanceLevels.length === 0) return null;
    const level = performanceLevels.find(
      l => percentage >= l.min_score && percentage <= l.max_score
    );
    return level ? { name: level.name, color: level.color } : null;
  };

  if (isLoading) {
    return (
      <PageTransition className="min-h-screen">
        <AnimatedBackground>
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-lg text-muted-foreground">جاري تحميل البيانات...</p>
            </div>
          </div>
        </AnimatedBackground>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="min-h-screen">
      <AnimatedBackground>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <LicenseBanner />
            <Navbar />
            <main className="flex-1 container mx-auto p-6 dir-rtl">
              <div className="mb-8 pb-4 border-b-2 border-primary">
                <h1 className="text-3xl font-bold text-foreground">تقارير الاختبارات</h1>
                <p className="text-muted-foreground">عرض وتحليل نتائج الاختبارات وإنشاء التقارير</p>
              </div>

              <div className="mb-8 flex items-center gap-4">
                <h2 className="text-lg font-semibold">اختر الاختبار:</h2>
                <Select value={selectedTestId} onValueChange={setSelectedTestId}>
                  <SelectTrigger className="w-72 border-black">
                    <SelectValue placeholder="اختر الاختبار" />
                  </SelectTrigger>
                  <SelectContent>
                    {tests.map(test => (
                      <SelectItem key={test.id} value={test.id}>
                        {test.name} - {getSubjectName(test.subjectId)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTest ? (
                <div className="space-y-8">
                  <Card className="border-2 border-green-500 shadow-lg bg-white">
                    <CardHeader className="bg-gradient-to-r from-green-100 to-white border-b border-green-500">
                      <CardTitle className="text-black">بيانات الاختبار</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">اسم الاختبار</p>
                          <p className="font-medium">{selectedTest.name}</p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">نوع الاختبار</p>
                          <p className="font-medium">{selectedTest.type}</p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">المادة</p>
                          <p className="font-medium">{getSubjectName(selectedTest.subjectId)}</p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">المعلم</p>
                          <p className="font-medium">{getTeacherName(selectedTest.teacherId)}</p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">الصف</p>
                          <p className="font-medium">
                            {getClassName(selectedTest.classId)} {getSectionName(selectedTest.classId, selectedTest.sectionId)}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">تاريخ الاختبار</p>
                          <p className="font-medium">{selectedTest.date}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Tabs defaultValue="charts" className="w-full">
                    <TabsList className="grid grid-cols-3 mb-6 h-14">
                      <TabsTrigger value="charts" className="flex items-center gap-2 text-base">
                        <BarChart3 className="h-5 w-5" />
                        المخططات البيانية
                      </TabsTrigger>
                      <TabsTrigger value="results" className="flex items-center gap-2 text-base">
                        <TableIcon className="h-5 w-5" />
                        نتائج الطلاب
                      </TabsTrigger>
                      <TabsTrigger value="export" className="flex items-center gap-2 text-base">
                        <FileText className="h-5 w-5" />
                        تصدير التقرير
                      </TabsTrigger>
                    </TabsList>

                    {/* Charts Tab */}
                    <TabsContent value="charts" className="space-y-6">
                      <ReportsCharts 
                        results={selectedTest.results}
                        performanceLevels={performanceLevels}
                      />
                    </TabsContent>

                    {/* Results Tab */}
                    <TabsContent value="results" className="space-y-6">
                      <Card className="border-2 border-red-500 shadow-lg bg-white">
                        <CardHeader className="bg-gradient-to-r from-red-100 to-white border-b border-red-500">
                          <CardTitle className="text-black">نتائج الطلاب</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader className="bg-black">
                              <TableRow>
                                <TableHead className="text-right text-white">اسم الطالب</TableHead>
                                <TableHead className="text-right text-white">الحالة</TableHead>
                                <TableHead className="text-right text-white">العلامة النهائية</TableHead>
                                <TableHead className="text-right text-white">النسبة المئوية</TableHead>
                                <TableHead className="text-right text-white">المستوى</TableHead>
                                <TableHead className="text-right text-white">النتيجة</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedTest.results.map(result => {
                                const studentName = getStudentName(result.studentId, (result as any).studentName);
                                const level = !result.isAbsent ? getPerformanceLevel(result.percentage) : null;
                                
                                return (
                                  <TableRow key={result.id} className="hover:bg-green-50">
                                    <TableCell className="font-medium">{studentName}</TableCell>
                                    <TableCell>{result.isAbsent ? 'غائب' : 'حاضر'}</TableCell>
                                    <TableCell>
                                      {result.isAbsent ? '-' : result.totalScore}
                                    </TableCell>
                                    <TableCell>
                                      {result.isAbsent ? '-' : `${result.percentage}%`}
                                    </TableCell>
                                    <TableCell>
                                      {result.isAbsent ? '-' : (
                                        level ? (
                                          <span 
                                            className="px-2 py-1 rounded-full text-xs font-medium"
                                            style={{ 
                                              backgroundColor: `${level.color}20`,
                                              color: level.color,
                                              borderWidth: 1,
                                              borderColor: level.color
                                            }}
                                          >
                                            {level.name}
                                          </span>
                                        ) : '-'
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {result.isAbsent ? '-' : (
                                        result.percentage >= 50 ? 
                                          <span className="text-green-600 font-medium">ناجح</span> : 
                                          <span className="text-red-600 font-medium">راسب</span>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>

                      <Card className="border-2 border-black shadow-lg bg-white">
                        <CardHeader className="bg-gradient-to-r from-gray-100 to-white border-b border-black">
                          <CardTitle className="text-black">تحليل الأسئلة</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                          <QuestionAnalysis 
                            results={selectedTest.results} 
                            questions={selectedTest.questions}
                          />
                          
                          <div className="mt-8 bg-green-50 p-4 rounded-lg border-2 border-green-500">
                            <h3 className="text-lg font-bold mb-4 text-black">جدول تلخيص النتائج</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                              <div className="bg-white p-4 rounded-lg shadow text-center border border-green-500">
                                <p className="text-sm text-gray-600">إجمالي الطلاب</p>
                                <p className="text-2xl font-bold text-black">
                                  {selectedTest.results.filter(r => !r.isAbsent).length}
                                </p>
                              </div>
                              <div className="bg-white p-4 rounded-lg shadow text-center border border-green-500">
                                <p className="text-sm text-gray-600">عدد الناجحين</p>
                                <p className="text-2xl font-bold text-green-600">
                                  {selectedTest.results.filter(r => !r.isAbsent && r.percentage >= 50).length}
                                </p>
                              </div>
                              <div className="bg-white p-4 rounded-lg shadow text-center border border-green-500">
                                <p className="text-sm text-gray-600">عدد الراسبين</p>
                                <p className="text-2xl font-bold text-red-600">
                                  {selectedTest.results.filter(r => !r.isAbsent && r.percentage < 50).length}
                                </p>
                              </div>
                              <div className="bg-white p-4 rounded-lg shadow text-center border border-green-500">
                                <p className="text-sm text-gray-600">نسبة النجاح</p>
                                {(() => {
                                  const present = selectedTest.results.filter(r => !r.isAbsent).length;
                                  const passed = selectedTest.results.filter(r => !r.isAbsent && r.percentage >= 50).length;
                                  const rate = present > 0 ? Math.round((passed / present) * 100) : 0;
                                  return (
                                    <p className={`text-2xl font-bold ${rate >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                                      {rate}%
                                    </p>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* Export Tab */}
                    <TabsContent value="export">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <ReportGenerator test={selectedTest} />
                        
                        {selectedTest.notes && (
                          <Card className="border-2 border-green-500 shadow-lg bg-white">
                            <CardHeader className="bg-gradient-to-r from-green-100 to-white border-b border-green-500">
                              <CardTitle className="text-black">ملاحظات</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                              <p>{selectedTest.notes}</p>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              ) : (
                <div className="text-center py-12 bg-white p-8 rounded-lg border-2 border-green-500 shadow-lg">
                  <h3 className="text-xl font-semibold mb-2 text-black">لا يوجد اختبار محدد</h3>
                  <p className="text-muted-foreground">الرجاء اختيار اختبار من القائمة</p>
                </div>
              )}
            </main>
          </div>
        </div>
      </AnimatedBackground>
    </PageTransition>
  );
};

export default Reports;
