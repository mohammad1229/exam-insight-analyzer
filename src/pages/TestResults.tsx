
import { useState } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import TestForm from "@/components/TestForm";
import StudentList from "@/components/StudentList";
import QuestionAnalysis from "@/components/QuestionAnalysis";
import ReportGenerator from "@/components/ReportGenerator"; 
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { getStudentsByClassAndSection } from "@/data/mockData";
import { Question, Student, TestResult } from "@/types";

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
  
  // Generate test ID
  const testId = "test_" + Date.now();

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

  const handleSaveTest = (asDraft = false) => {
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

    // Create test object
    const testData = {
      id: testId,
      ...testFormData,
      draft: asDraft,
      results,
    };
    
    // In a real app, you would save this to the database
    console.log(testData);
    
    toast({
      title: asDraft ? "تم حفظ المسودة" : "تم حفظ النتائج",
      description: asDraft 
        ? "تم حفظ بيانات الاختبار كمسودة" 
        : "تم حفظ نتائج الاختبار بنجاح",
    });
    
    // Navigate to dashboard after saving
    navigate("/dashboard");
  };

  // Mock test object for report preview
  const mockTest = {
    id: testId,
    ...testFormData,
    results: generateTestResults(),
    draft: false
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto p-6 dir-rtl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">إدخال نتائج اختبار</h1>
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
                <p className="mb-4 text-muted-foreground">معاينة كيف سيظهر التقرير النهائي. يمكنك تنزيل التقرير أو العودة لتعديل البيانات.</p>
                
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <div className="lg:col-span-1">
                    <ReportGenerator test={mockTest} />
                  </div>
                  <div className="lg:col-span-3">
                    <Card className="border-dashed border-2 p-6 h-full flex flex-col items-center justify-center">
                      <p className="text-center text-muted-foreground">معاينة التقرير ستظهر هنا بعد التنزيل</p>
                      <p className="mt-2 text-sm text-center">سيحتوي التقرير على كافة البيانات الأساسية للاختبار، درجات الطلاب، والرسوم البيانية للتحليل</p>
                    </Card>
                  </div>
                </div>
                
                <div className="flex justify-end mt-6">
                  <Button 
                    variant="secondary" 
                    className="mr-2"
                    onClick={() => setActiveTab("analysis")}
                  >
                    رجوع
                  </Button>
                  <Button 
                    onClick={() => handleSaveTest(false)}
                  >
                    حفظ النتائج
                  </Button>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default TestResults;
