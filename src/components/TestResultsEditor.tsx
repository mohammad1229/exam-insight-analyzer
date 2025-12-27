import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit2, Save, X, User, Plus, Trash2, FileText, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Test, TestResult, Question } from "@/types";
import { getStudentById, updateTest } from "@/services/dataService";
import { getStudentsDB } from "@/services/databaseService";
import { supabase } from "@/integrations/supabase/client";

interface TestResultsEditorProps {
  test: Test;
  open: boolean;
  onClose: () => void;
  onSave: (updatedTest: Test) => void;
}

const TEST_TYPES = [
  { id: "exam", name: "امتحان رسمي" },
  { id: "quiz", name: "اختبار قصير" },
  { id: "homework", name: "واجب منزلي" },
  { id: "worksheet", name: "ورقة عمل" },
  { id: "manual", name: "إدخال يدوي" },
  { id: "other", name: "أخرى" }
];

const QUESTION_TYPES = [
  { id: "اختيار من متعدد", name: "اختيار من متعدد" },
  { id: "صواب وخطأ", name: "صواب وخطأ" },
  { id: "مقالي", name: "مقالي" },
  { id: "تكميلي", name: "تكميلي" },
  { id: "مطابقة", name: "مطابقة" },
  { id: "استماع", name: "استماع" },
  { id: "قراءة", name: "قراءة" },
  { id: "تدريبات", name: "تدريبات" },
  { id: "إملاء", name: "إملاء" },
  { id: "تعبير", name: "تعبير" },
];

const TestResultsEditor: React.FC<TestResultsEditorProps> = ({ test, open, onClose, onSave }) => {
  const [editedResults, setEditedResults] = useState<TestResult[]>([]);
  const [testName, setTestName] = useState("");
  const [testType, setTestType] = useState("");
  const [testDate, setTestDate] = useState("");
  const [testNotes, setTestNotes] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [saving, setSaving] = useState(false);
  const [studentNamesMap, setStudentNamesMap] = useState<Map<string, string>>(new Map());
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Load student names from database
  useEffect(() => {
    const loadStudentNames = async () => {
      setLoadingStudents(true);
      try {
        const students = await getStudentsDB();
        const namesMap = new Map<string, string>();
        (students || []).forEach((s: any) => namesMap.set(s.id, s.name));
        setStudentNamesMap(namesMap);
      } catch (error) {
        console.error("Error loading student names:", error);
      } finally {
        setLoadingStudents(false);
      }
    };

    if (open) {
      loadStudentNames();
    }
  }, [open]);

  useEffect(() => {
    if (test) {
      setTestName(test.name || "");
      setTestType(test.type || test.test_type || "quiz");
      setTestDate(test.date || test.test_date || "");
      setTestNotes(test.notes || "");
      setQuestions(test.questions || []);
      if (test.results) {
        setEditedResults([...test.results]);
      }
    }
  }, [test]);

  const handleScoreChange = (resultIndex: number, questionId: string, value: number, maxScore: number) => {
    const clampedValue = Math.max(0, Math.min(value, maxScore));
    
    setEditedResults(prev => {
      const updated = [...prev];
      const result = { ...updated[resultIndex] };
      result.scores = { ...result.scores, [questionId]: clampedValue };
      
      // Recalculate total and percentage
      const totalScore = questions.reduce((sum, q) => sum + (result.scores[q.id] || 0), 0);
      const totalMaxScore = questions.reduce((sum, q) => sum + q.maxScore, 0);
      result.totalScore = totalScore;
      result.percentage = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;
      
      updated[resultIndex] = result;
      return updated;
    });
  };

  const handleAbsentChange = (resultIndex: number, isAbsent: boolean) => {
    setEditedResults(prev => {
      const updated = [...prev];
      const result = { ...updated[resultIndex] };
      result.isAbsent = isAbsent;
      
      if (isAbsent) {
        result.scores = {};
        result.totalScore = 0;
        result.percentage = 0;
      }
      
      updated[resultIndex] = result;
      return updated;
    });
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `q${Date.now()}`,
      type: "اختيار من متعدد",
      maxScore: 5
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    const updated = [...questions];
    updated.splice(index, 1);
    setQuestions(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Add student names to results - prioritize from loaded DB names
      const resultsWithNames = editedResults.map(r => {
        const sid = r.studentId || (r as any).student_id;
        const nameFromDb = studentNamesMap.get(sid);
        const nameFromLocal = getStudentById(sid)?.name;
        return {
          ...r,
          studentName: nameFromDb || nameFromLocal || r.studentName || sid
        };
      });

      const schoolId = localStorage.getItem("currentSchoolId");
      
      // Try to save to database first
      if (schoolId && test.id) {
        try {
          const { data: result } = await supabase.functions.invoke("school-data", {
            body: { 
              action: "updateTest", 
              schoolId, 
              data: {
                id: test.id,
                name: testName,
                test_type: testType,
                test_date: testDate,
                notes: testNotes,
                questions: questions
              }
            }
          });
          
          // Update results in database
          if (resultsWithNames.length > 0) {
            await supabase.functions.invoke("school-data", {
              body: { 
                action: "updateTestResults", 
                schoolId, 
                data: {
                  test_id: test.id,
                  results: resultsWithNames
                }
              }
            });
          }
          
          if (result?.success) {
            toast.success("تم حفظ التعديلات في قاعدة البيانات");
          }
        } catch (e) {
          console.error("Error saving to database, saving locally:", e);
          // Save to localStorage as fallback
          updateTest(test.id, { 
            name: testName,
            type: testType,
            date: testDate,
            notes: testNotes,
            questions: questions,
            results: resultsWithNames 
          });
          toast.success("تم حفظ التعديلات محلياً (سيتم المزامنة عند الاتصال)");
        }
      } else {
        // Save to localStorage
        updateTest(test.id, { 
          name: testName,
          type: testType,
          date: testDate,
          notes: testNotes,
          questions: questions,
          results: resultsWithNames 
        });
        toast.success("تم حفظ التعديلات بنجاح");
      }

      const updatedTest = {
        ...test,
        name: testName,
        type: testType,
        test_type: testType,
        date: testDate,
        test_date: testDate,
        notes: testNotes,
        questions: questions,
        results: resultsWithNames
      };

      onSave(updatedTest);
      onClose();
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const getStudentName = (studentId: string, result?: any): string => {
    // First try from result data
    if (result?.studentName && result.studentName !== studentId) return result.studentName;
    if (result?.students?.name) return result.students.name;
    // Then from loaded database names
    const fromDb = studentNamesMap.get(studentId);
    if (fromDb) return fromDb;
    // Fallback to local storage
    const student = getStudentById(studentId);
    return student?.name || "طالب غير معروف";
  };

  const getPerformanceLevel = (percentage: number): { label: string; color: string } => {
    if (percentage >= 85) return { label: "ممتاز", color: "text-green-600 bg-green-50" };
    if (percentage >= 75) return { label: "جيد", color: "text-blue-600 bg-blue-50" };
    if (percentage >= 65) return { label: "متوسط", color: "text-yellow-600 bg-yellow-50" };
    if (percentage >= 50) return { label: "متدني", color: "text-orange-600 bg-orange-50" };
    return { label: "راسب", color: "text-red-600 bg-red-50" };
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b bg-gradient-to-r from-primary/10 to-primary/5">
          <DialogTitle className="flex items-center gap-2">
            <Edit2 className="h-5 w-5" />
            تعديل الاختبار - {test?.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="flex-1 flex flex-col">
          <TabsList className="mx-4 mt-2">
            <TabsTrigger value="info" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              بيانات الاختبار
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              نتائج الطلاب
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 p-4">
            <TabsContent value="info" className="mt-0 space-y-6">
              {/* Test Info */}
              <Card className="p-4">
                <h3 className="font-semibold mb-4">معلومات الاختبار الأساسية</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>اسم الاختبار</Label>
                    <Input
                      value={testName}
                      onChange={(e) => setTestName(e.target.value)}
                      placeholder="أدخل اسم الاختبار"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>نوع الاختبار</Label>
                    <Select value={testType} onValueChange={setTestType}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع الاختبار" />
                      </SelectTrigger>
                      <SelectContent>
                        {TEST_TYPES.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>تاريخ الاختبار</Label>
                    <Input
                      type="date"
                      value={testDate}
                      onChange={(e) => setTestDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>ملاحظات</Label>
                    <Textarea
                      value={testNotes}
                      onChange={(e) => setTestNotes(e.target.value)}
                      placeholder="أضف ملاحظات حول الاختبار"
                      rows={3}
                    />
                  </div>
                </div>
              </Card>

              {/* Questions */}
              <Card className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">الأسئلة ({questions.length})</h3>
                  <Button size="sm" onClick={addQuestion}>
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة سؤال
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {questions.map((q, idx) => (
                    <div key={q.id} className="flex gap-3 items-center p-3 bg-muted/30 rounded-lg">
                      <span className="font-medium text-sm w-16">سؤال {idx + 1}</span>
                      <Select
                        value={q.type}
                        onValueChange={(value) => updateQuestion(idx, "type", value)}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {QUESTION_TYPES.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-2">
                        <Label className="text-sm">الدرجة:</Label>
                        <Input
                          type="number"
                          min={1}
                          value={q.maxScore}
                          onChange={(e) => updateQuestion(idx, "maxScore", parseInt(e.target.value) || 1)}
                          className="w-20"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(idx)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  {questions.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      لم تتم إضافة أسئلة بعد
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="results" className="mt-0">
              {/* Results Table */}
              {editedResults.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-2 text-right border-b">#</th>
                        <th className="p-2 text-right border-b">اسم الطالب</th>
                        <th className="p-2 text-center border-b">غائب</th>
                        {questions.map((q, idx) => (
                          <th key={q.id} className="p-2 text-center border-b">
                            {q.type}
                            <span className="block text-xs text-muted-foreground">({q.maxScore})</span>
                          </th>
                        ))}
                        <th className="p-2 text-center border-b">المجموع</th>
                        <th className="p-2 text-center border-b">النسبة</th>
                        <th className="p-2 text-center border-b">المستوى</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editedResults.map((result, index) => {
                        const isAbsent = result.isAbsent || result.is_absent;
                        const level = getPerformanceLevel(result.percentage);
                        return (
                          <tr key={result.id || index} className="hover:bg-muted/50">
                            <td className="p-2 border-b text-center">{index + 1}</td>
                            <td className="p-2 border-b">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                {getStudentName(result.studentId || result.student_id, result)}
                              </div>
                            </td>
                            <td className="p-2 border-b text-center">
                              <Checkbox
                                checked={isAbsent}
                                onCheckedChange={(checked) => handleAbsentChange(index, checked as boolean)}
                              />
                            </td>
                            {questions.map((q) => (
                              <td key={q.id} className="p-2 border-b text-center">
                                <Input
                                  type="number"
                                  min={0}
                                  max={q.maxScore}
                                  value={isAbsent ? "" : (result.scores?.[q.id] || 0)}
                                  onChange={(e) => handleScoreChange(index, q.id, parseInt(e.target.value) || 0, q.maxScore)}
                                  disabled={isAbsent}
                                  className="w-16 text-center mx-auto"
                                />
                              </td>
                            ))}
                            <td className="p-2 border-b text-center font-semibold">
                              {isAbsent ? "-" : result.totalScore || result.total_score || 0}
                            </td>
                            <td className="p-2 border-b text-center font-semibold">
                              {isAbsent ? "-" : `${result.percentage}%`}
                            </td>
                            <td className="p-2 border-b text-center">
                              {isAbsent ? (
                                <span className="px-2 py-1 rounded text-gray-500 bg-gray-100">غائب</span>
                              ) : (
                                <span className={`px-2 py-1 rounded ${level.color}`}>{level.label}</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground text-lg">لا توجد نتائج لهذا الاختبار</p>
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="p-4 border-t bg-muted/30">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            <X className="ml-2 h-4 w-4" />
            إلغاء
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90">
            <Save className="ml-2 h-4 w-4" />
            {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TestResultsEditor;
