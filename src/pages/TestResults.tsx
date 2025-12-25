import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import LicenseBanner from "@/components/LicenseBanner";
import AnimatedBackground from "@/components/AnimatedBackground";
import PageTransition from "@/components/PageTransition";
import TestForm from "@/components/TestForm";
import StudentList from "@/components/StudentList";
import QuestionAnalysis from "@/components/QuestionAnalysis";
import ReportPreview from "@/components/ReportPreview";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Question, TestResult, Test } from "@/types";
import { addTest, getTests, getCurrentTeacher, getStudentById, updateTest } from "@/services/dataService";
import { addTestDB, saveTestResultsDB } from "@/services/databaseService";
import { Save, Printer, Eye, FileDown } from "lucide-react";

const TestResults = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  // Test form state
  const [testFormData, setTestFormData] = useState({
    name: "",
    type: "",
    subjectId: "",
    teacherId: "",
    classId: "",
    sectionId: "",
    date: "",
    questions: [] as Question[],
    notes: "",
  });

  // Student results state
  const [selectedStudents, setSelectedStudents] = useState<Record<string, { isAbsent: boolean, scores: Record<string, number> }>>({});
  
  // Current active tab
  const [activeTab, setActiveTab] = useState("test-info");
  
  // Report preview state
  const [showReportPreview, setShowReportPreview] = useState(false);
  
  // Generate test ID (stable for the lifetime of this screen)
  const testIdRef = useRef("test_" + Date.now());
  const testId = testIdRef.current;

  // Generate test results based on current state
  const generateTestResults = (): TestResult[] => {
    return Object.entries(selectedStudents).map(([studentId, data]) => {
      const { isAbsent, scores } = data;
      
      // Calculate total score and percentage
      let totalScore = 0;
      let totalPossible = 0;
      
      if (!isAbsent) {
        testFormData.questions.forEach(question => {
          totalScore += scores[question.id] || 0;
          totalPossible += question.maxScore;
        });
      }
      
      const percentage = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;
      
      return {
        id: `result_${studentId}`,
        testId: testId,
        studentId,
        isAbsent,
        scores,
        totalScore,
        percentage
      };
    });
  };

  const handleStudentSelect = (studentId: string, isAbsent: boolean) => {
    setSelectedStudents(prev => {
      const student = prev[studentId] || { isAbsent: false, scores: {} };
      
      // If marking as absent, clear scores
      if (isAbsent && !student.isAbsent) {
        return {
          ...prev,
          [studentId]: { isAbsent: true, scores: {} }
        };
      }
      
      return {
        ...prev,
        [studentId]: { ...student, isAbsent }
      };
    });
  };

  // Handle changing scores for a student
  const handleScoreChange = (studentId: string, questionId: string, value: number) => {
    setSelectedStudents(prev => {
      const student = prev[studentId] || { isAbsent: false, scores: {} };
      return {
        ...prev,
        [studentId]: {
          ...student,
          scores: { ...student.scores, [questionId]: value }
        }
      };
    });
  };

  const handleSaveTest = async (asDraft = false) => {
    if (!testFormData.name || 
        !testFormData.type || 
        !testFormData.subjectId || 
        !testFormData.teacherId || 
        !testFormData.classId || 
        !testFormData.sectionId || 
        !testFormData.date) {
      toast({
        title: "بيانات غير مكتملة",
        description: "الرجاء ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }
    
    if (testFormData.questions.length === 0) {
      toast({
        title: "لا توجد أسئلة",
        description: "الرجاء إضافة سؤال واحد على الأقل",
        variant: "destructive",
      });
      return;
    }
    
    const results = generateTestResults();

    // Prepare local test object
    let testData: Test = {
      id: testId,
      name: testFormData.name,
      type: testFormData.type,
      subjectId: testFormData.subjectId,
      teacherId: testFormData.teacherId,
      classId: testFormData.classId,
      sectionId: testFormData.sectionId,
      date: testFormData.date,
      questions: testFormData.questions,
      notes: testFormData.notes,
      draft: asDraft,
      results: results.map(r => ({
        ...r,
        studentName: getStudentById(r.studentId)?.name || (r as any).studentName || r.studentId
      })),
    };

    // Try saving to database first so المدير يراه في "آخر التقارير"
    try {
      const created = await addTestDB({
        teacher_id: testFormData.teacherId,
        subject_id: testFormData.subjectId,
        class_id: testFormData.classId,
        section_id: testFormData.sectionId,
        name: testFormData.name,
        test_type: testFormData.type,
        test_date: testFormData.date,
        questions: testFormData.questions,
        notes: testFormData.notes,
        is_draft: asDraft,
      });

      if (created?.id) {
        const dbResults = results.map(r => ({
          student_id: r.studentId,
          is_absent: r.isAbsent,
          scores: r.scores,
          total_score: r.totalScore,
          percentage: r.percentage,
        }));

        await saveTestResultsDB(created.id, dbResults);

        // Keep local storage in sync using DB id to avoid duplicates
        testData = { ...testData, id: created.id, test_id: created.id } as any;
        testData.results = (testData.results || []).map(res => ({ ...res, testId: created.id }));

        // Upsert locally: remove any old temp test with same name+date (best-effort)
        const existing = getTests();
        const filtered = existing.filter(t => t.id !== testId);
        filtered.push(testData);
        // Use updateTest/addTest helpers
        // (save via updateTest if exists, else addTest)
        try {
          updateTest(created.id, testData);
        } catch {
          addTest(testData);
        }

        toast({
          title: asDraft ? "تم حفظ المسودة" : "تم حفظ النتائج",
          description: asDraft ? "تم حفظ الاختبار كمسودة" : "تم حفظ النتائج في قاعدة البيانات وأصبحت متاحة للمدير",
        });

        return testData;
      }
    } catch (e) {
      // Fallback to local only
    }

    // Local-only fallback
    addTest(testData);

    toast({
      title: asDraft ? "تم حفظ المسودة" : "تم حفظ النتائج وإرسالها للمدير",
      description: asDraft 
        ? "تم حفظ بيانات الاختبار كمسودة" 
        : "تم حفظ نتائج الاختبار محلياً (قد لا تظهر في لوحة المدير حتى تتم المزامنة)",
    });

    return testData;
  };

  const handleSaveAndPrint = async () => {
    const savedTest = await handleSaveTest(false);
    if (savedTest) {
      setShowReportPreview(true);
    }
  };

  const handlePreviewAndSave = async () => {
    const savedTest = await handleSaveTest(false);
    if (savedTest) {
      setShowReportPreview(true);
    }
  };

  // Mock test object for report preview
  const mockTest = {
    id: testId,
    ...testFormData,
    results: generateTestResults().map(r => ({
      ...r,
      studentName: getStudentById(r.studentId)?.name || r.studentId
    })),
    draft: false
  };

  return (
    <PageTransition className="min-h-screen">
      <AnimatedBackground>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <LicenseBanner />
            <Navbar />
            <main className="flex-1 container mx-auto p-6 dir-rtl">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-foreground">إدخال نتائج اختبار</h1>
                <p className="text-muted-foreground">إنشاء اختبار جديد وإدخال نتائج الطلاب</p>
              </div>

          <Tabs 
            defaultValue="test-info" 
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="test-info">بيانات الاختبار</TabsTrigger>
              <TabsTrigger 
                value="student-scores"
                disabled={!testFormData.classId || !testFormData.sectionId || testFormData.questions.length === 0}
              >
                درجات الطلاب
              </TabsTrigger>
              <TabsTrigger 
                value="analysis"
                disabled={Object.keys(selectedStudents).length === 0}
              >
                تحليل النتائج
              </TabsTrigger>
              <TabsTrigger 
                value="report-preview"
                disabled={Object.keys(selectedStudents).length === 0}
              >
                معاينة التقرير
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="test-info">
              <Card className="p-6">
                <TestForm onFormDataChange={setTestFormData} />
                
                <div className="flex justify-end mt-6">
                  <Button 
                    variant="secondary" 
                    className="mr-2"
                    onClick={() => navigate("/dashboard")}
                  >
                    إلغاء
                  </Button>
                  <Button 
                    onClick={() => handleSaveTest(true)}
                  >
                    حفظ كمسودة
                  </Button>
                  <Button 
                    className="mr-2"
                    onClick={() => setActiveTab("student-scores")}
                    disabled={!testFormData.classId || !testFormData.sectionId || testFormData.questions.length === 0}
                  >
                    التالي: درجات الطلاب
                  </Button>
                </div>
              </Card>
            </TabsContent>
            
            <TabsContent value="student-scores">
              <Card className="p-6">
                <StudentList 
                  classId={testFormData.classId}
                  sectionId={testFormData.sectionId}
                  onStudentSelect={handleStudentSelect}
                  selectedStudents={selectedStudents}
                  questions={testFormData.questions}
                  onScoreChange={handleScoreChange}
                />
                
                <div className="flex justify-end mt-6">
                  <Button 
                    variant="secondary" 
                    className="mr-2"
                    onClick={() => setActiveTab("test-info")}
                  >
                    رجوع
                  </Button>
                  <Button 
                    className="mr-2"
                    onClick={() => setActiveTab("analysis")}
                    disabled={Object.keys(selectedStudents).length === 0}
                  >
                    التالي: تحليل النتائج
                  </Button>
                </div>
              </Card>
            </TabsContent>
            
            <TabsContent value="analysis">
              <Card className="p-6">
                <QuestionAnalysis 
                  results={generateTestResults()} 
                  questions={testFormData.questions}
                />
                
                <div className="flex justify-end mt-6">
                  <Button 
                    variant="secondary" 
                    className="mr-2"
                    onClick={() => setActiveTab("student-scores")}
                  >
                    رجوع
                  </Button>
                  <Button 
                    className="mr-2"
                    onClick={() => setActiveTab("report-preview")}
                  >
                    معاينة التقرير
                  </Button>
                  <Button 
                    onClick={() => handleSaveTest(false)}
                  >
                    حفظ النتائج
                  </Button>
                </div>
              </Card>
            </TabsContent>
            
            <TabsContent value="report-preview">
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">معاينة التقرير</h3>
                <p className="mb-6 text-muted-foreground">معاينة كيف سيظهر التقرير النهائي. يمكنك حفظ وطباعة التقرير أو العودة لتعديل البيانات.</p>
                
                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 mb-6 justify-center">
                  <Button 
                    onClick={async () => { await handleSaveTest(false); }}
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    حفظ
                  </Button>
                  <Button 
                    onClick={handleSaveAndPrint}
                    variant="outline"
                    className="gap-2"
                  >
                    <Printer className="h-4 w-4" />
                    طباعة
                  </Button>
                  <Button 
                    onClick={handlePreviewAndSave}
                    variant="secondary"
                    className="gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    معاينة وحفظ
                  </Button>
                </div>
                
                {/* Preview iframe will be shown via ReportPreview */}
                <Card className="border-2 p-6 min-h-[400px] flex flex-col items-center justify-center bg-muted/30">
                  <FileDown className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <p className="text-center text-muted-foreground text-lg font-medium">انقر على "معاينة وحفظ" لعرض التقرير</p>
                  <p className="mt-2 text-sm text-center text-muted-foreground">سيحتوي التقرير على كافة البيانات الأساسية للاختبار، درجات الطلاب، والإحصائيات</p>
                </Card>
                
                <div className="flex justify-between mt-6">
                  <Button 
                    variant="outline"
                    onClick={() => setActiveTab("analysis")}
                  >
                    رجوع
                  </Button>
                  <Button 
                    onClick={async () => {
                      await handleSaveTest(false);
                      navigate("/dashboard");
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    حفظ والانتقال للوحة التحكم
                  </Button>
                </div>
              </Card>
            </TabsContent>
            
            {/* Report Preview Dialog */}
            <ReportPreview
              test={mockTest}
              open={showReportPreview}
              onClose={() => setShowReportPreview(false)}
            />
          </Tabs>
        </main>
          </div>
        </div>
      </AnimatedBackground>
    </PageTransition>
  );
};

export default TestResults;
