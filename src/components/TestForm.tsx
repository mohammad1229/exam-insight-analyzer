import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { Class, Question, Section } from "@/types";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TestFormProps {
  onFormDataChange: (data: {
    name: string;
    type: string;
    subjectId: string;
    teacherId: string;
    classId: string;
    sectionId: string;
    date: string;
    questions: Question[];
    notes: string;
  }) => void;
}

const TEST_TYPES = [
  { id: "exam", name: "امتحان رسمي" },
  { id: "quiz", name: "اختبار قصير" },
  { id: "homework", name: "واجب منزلي" },
  { id: "worksheet", name: "ورقة عمل" },
  { id: "manual", name: "إدخال يدوي" },
  { id: "other", name: "أخرى" }
];

const TEST_QUESTION_TYPES = [
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
  { id: "custom", name: "سؤال مخصص" }
];

const TestForm: React.FC<TestFormProps> = ({ onFormDataChange }) => {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [customType, setCustomType] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [date, setDate] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [notes, setNotes] = useState("");
  const [sections, setSections] = useState<Section[]>([]);

  // Data from service
  const [availableClasses, setAvailableClasses] = useState<Class[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<{ id: string; name: string }[]>([]);
  const [availableTeachers, setAvailableTeachers] = useState<{ id: string; name: string }[]>([]);

  // Question form state
  const [questionType, setQuestionType] = useState("");
  const [customQuestionType, setCustomQuestionType] = useState("");
  const [maxScore, setMaxScore] = useState<number>(5);

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      // Check if there's a logged in teacher
      const loggedInTeacher = localStorage.getItem("loggedInTeacher");
      const schoolId = localStorage.getItem("currentSchoolId");
      
      if (loggedInTeacher && schoolId) {
        try {
          const teacher = JSON.parse(loggedInTeacher);
          if (!isMounted) return;
          
          setTeacherId(teacher.id);
          setAvailableTeachers([{ id: teacher.id, name: teacher.name }]);
          
          // Fetch teacher's assigned classes, sections, and subjects from localStorage (stored on login)
          const teacherClasses = teacher.assignedClasses || teacher.classes || [];
          const teacherSubjects = teacher.assignedSubjects || teacher.subjects || [];
          const teacherSections = teacher.assignedSections || teacher.sections || [];
          
          // Fetch all classes, sections, and subjects then filter
          const [classesResponse, subjectsResponse, sectionsResponse] = await Promise.all([
            supabase.functions.invoke("school-data", {
              body: { action: "getClasses", schoolId }
            }),
            supabase.functions.invoke("school-data", {
              body: { action: "getSubjects", schoolId }
            }),
            supabase.functions.invoke("school-data", {
              body: { action: "getSections", schoolId }
            })
          ]);
          
          if (!isMounted) return;
          
          const classesResult = classesResponse.data;
          const subjectsResult = subjectsResponse.data;
          const sectionsResult = sectionsResponse.data;
          
          // Get all sections data
          const allSectionsData = sectionsResult?.success ? sectionsResult.data : [];
          
          if (classesResult?.success && classesResult.data) {
            // Filter to only teacher's assigned classes + dedupe by (id + name)
            const byName = new Map<string, any>();
            const seenIds = new Set<string>();
            for (const c of classesResult.data) {
              if (!teacherClasses.includes(c.id)) continue;
              if (seenIds.has(c.id)) continue;
              const key = String(c.name || "").trim().toLowerCase();
              if (!byName.has(key)) {
                // Add sections for this class
                const classSections = allSectionsData.filter((s: any) => 
                  s.class_id === c.id && teacherSections.includes(s.id)
                );
                byName.set(key, { ...c, sections: classSections });
              }
              seenIds.add(c.id);
            }

            const filteredClasses = Array.from(byName.values()).map((c: any) => ({
              id: c.id,
              name: c.name,
              sections: c.sections || [],
            }));
            
            setAvailableClasses(filteredClasses);
            
            // Auto-select if only one class
            if (filteredClasses.length === 1) {
              setClassId(filteredClasses[0].id);
              setSections(filteredClasses[0].sections);
              
              // Auto-select if only one section
              if (filteredClasses[0].sections.length === 1) {
                setSectionId(filteredClasses[0].sections[0].id);
              }
            }
          }

          if (subjectsResult?.success && subjectsResult.data) {
            // Filter to only teacher's assigned subjects + dedupe by (id + name)
            const byName = new Map<string, any>();
            const seenIds = new Set<string>();
            for (const s of subjectsResult.data) {
              if (!teacherSubjects.includes(s.id)) continue;
              if (seenIds.has(s.id)) continue;
              const key = String(s.name || "").trim().toLowerCase();
              if (!byName.has(key)) {
                byName.set(key, s);
              }
              seenIds.add(s.id);
            }

            const filteredSubjects = Array.from(byName.values()).map((s: any) => ({
              id: s.id,
              name: s.name,
            }));
            
            setAvailableSubjects(filteredSubjects);
            
            // Auto-select if only one subject
            if (filteredSubjects.length === 1) {
              setSubjectId(filteredSubjects[0].id);
            }
          }
        } catch (e) {
          console.error("Error fetching teacher data:", e);
        }
      } else if (schoolId) {
        // Admin mode - show all classes and subjects
        try {
          const [classesResponse, subjectsResponse, teachersResponse] = await Promise.all([
            supabase.functions.invoke("school-data", {
              body: { action: "getClasses", schoolId }
            }),
            supabase.functions.invoke("school-data", {
              body: { action: "getSubjects", schoolId }
            }),
            supabase.functions.invoke("school-data", {
              body: { action: "getTeachers", schoolId }
            })
          ]);
          
          if (!isMounted) return;
          
          const classesResult = classesResponse.data;
          const subjectsResult = subjectsResponse.data;
          const teachersResult = teachersResponse.data;
          
          if (classesResult?.success) {
            // Dedupe classes by name (some datasets may contain duplicates with different IDs)
            const byName = new Map<string, any>();
            const seenIds = new Set<string>();
            for (const c of classesResult.data || []) {
              if (seenIds.has(c.id)) continue;
              const key = String(c.name || "").trim().toLowerCase();
              if (!byName.has(key)) {
                byName.set(key, c);
              }
              seenIds.add(c.id);
            }

            setAvailableClasses(
              Array.from(byName.values()).map((c: any) => ({
                id: c.id,
                name: c.name,
                sections: c.sections || [],
              }))
            );
          }

          if (subjectsResult?.success) {
            // Dedupe subjects by name
            const byName = new Map<string, any>();
            const seenIds = new Set<string>();
            for (const s of subjectsResult.data || []) {
              if (seenIds.has(s.id)) continue;
              const key = String(s.name || "").trim().toLowerCase();
              if (!byName.has(key)) {
                byName.set(key, s);
              }
              seenIds.add(s.id);
            }

            setAvailableSubjects(
              Array.from(byName.values()).map((s: any) => ({
                id: s.id,
                name: s.name,
              }))
            );
          }

          if (teachersResult?.success) {
            // Dedupe teachers by id (safety)
            const seenTeacherIds = new Set<string>();
            setAvailableTeachers(
              (teachersResult.data || [])
                .filter((t: any) => {
                  if (seenTeacherIds.has(t.id)) return false;
                  seenTeacherIds.add(t.id);
                  return true;
                })
                .map((t: any) => ({ id: t.id, name: t.name }))
            );
          }
        } catch (e) {
          console.error("Error fetching data:", e);
        }
      }
    };
    
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (classId) {
      const selectedClass = availableClasses.find(c => c.id === classId);
      if (selectedClass) {
        setSections(selectedClass.sections);
      } else {
        setSections([]);
      }
    } else {
      setSections([]);
    }
  }, [classId, availableClasses]);

  useEffect(() => {
    const finalType = type === "other" ? customType : type;
    onFormDataChange({
      name,
      type: finalType,
      subjectId,
      teacherId,
      classId,
      sectionId,
      date,
      questions,
      notes,
    });
  }, [name, type, customType, subjectId, teacherId, classId, sectionId, date, questions, notes]);

  const addQuestion = () => {
    if ((!questionType) || (questionType === "custom" && !customQuestionType)) {
      toast({
        title: "خطأ",
        description: "الرجاء تحديد نوع السؤال أو إدخال نوع مخصص",
        variant: "destructive",
      });
      return;
    }

    // Use custom type if "custom" is selected
    const finalQuestionType = questionType === "custom" ? customQuestionType : questionType;

    const newQuestion: Question = {
      id: `q${questions.length + 1}`,
      type: finalQuestionType,
      maxScore,
    };

    setQuestions([...questions, newQuestion]);
    setQuestionType("");
    setCustomQuestionType("");
    setMaxScore(5);
  };

  const removeQuestion = (index: number) => {
    const updatedQuestions = [...questions];
    updatedQuestions.splice(index, 1);
    setQuestions(updatedQuestions);
  };

  return (
    <div className="space-y-6 dir-rtl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="testName">اسم الاختبار</Label>
            <Input
              id="testName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="أدخل اسم الاختبار"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="testType">نوع الاختبار</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="testType">
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

          {type === "other" && (
            <div className="space-y-2">
              <Label htmlFor="customType">نوع الاختبار المخصص</Label>
              <Input
                id="customType"
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                placeholder="أدخل نوع الاختبار"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="subject">المادة</Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger id="subject">
                <SelectValue placeholder="اختر المادة" />
              </SelectTrigger>
              <SelectContent>
                {availableSubjects.length > 0 ? (
                  availableSubjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>لا توجد مواد مخصصة لك</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="teacher">المعلم</Label>
            <Select value={teacherId} onValueChange={setTeacherId}>
              <SelectTrigger id="teacher">
                <SelectValue placeholder="اختر المعلم" />
              </SelectTrigger>
              <SelectContent>
                {availableTeachers.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="class">الصف</Label>
            <Select
              value={classId}
              onValueChange={(value) => {
                setClassId(value);
                setSectionId(""); // Reset section when class changes
              }}
            >
              <SelectTrigger id="class">
                <SelectValue placeholder="اختر الصف" />
              </SelectTrigger>
              <SelectContent>
                {availableClasses.length > 0 ? (
                  availableClasses.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>لا توجد صفوف مخصصة لك</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="section">الشعبة</Label>
            <Select 
              value={sectionId} 
              onValueChange={setSectionId}
              disabled={!classId}
            >
              <SelectTrigger id="section">
                <SelectValue placeholder={classId ? "اختر الشعبة" : "اختر الصف أولاً"} />
              </SelectTrigger>
              <SelectContent>
                {sections.map((section) => (
                  <SelectItem key={section.id} value={section.id}>
                    {section.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">تاريخ الاختبار</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">الأسئلة</h3>
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="questionType">نوع السؤال</Label>
                <Select value={questionType} onValueChange={setQuestionType}>
                  <SelectTrigger id="questionType">
                    <SelectValue placeholder="اختر نوع السؤال" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEST_QUESTION_TYPES.map(type => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {questionType === "custom" && (
                <div className="space-y-2">
                  <Label htmlFor="customQuestionType">نوع السؤال المخصص</Label>
                  <Input
                    id="customQuestionType"
                    value={customQuestionType}
                    onChange={(e) => setCustomQuestionType(e.target.value)}
                    placeholder="أدخل نوع السؤال المخصص"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="maxScore">العلامة القصوى</Label>
                <Input
                  id="maxScore"
                  type="number"
                  min={1}
                  value={maxScore}
                  onChange={(e) => setMaxScore(parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="flex items-end">
                <Button onClick={addQuestion} className="w-full">
                  <Plus className="mr-2 h-4 w-4" /> إضافة سؤال
                </Button>
              </div>
            </div>

            {questions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">رقم السؤال</TableHead>
                    <TableHead className="text-right">نوع السؤال</TableHead>
                    <TableHead className="text-right">العلامة القصوى</TableHead>
                    <TableHead className="text-center">حذف</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {questions.map((question, index) => (
                    <TableRow key={question.id}>
                      <TableCell>السؤال {index + 1}</TableCell>
                      <TableCell>{question.type}</TableCell>
                      <TableCell>{question.maxScore}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeQuestion(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                لم تتم إضافة أسئلة بعد.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">ملاحظات</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="أضف أي ملاحظات حول الاختبار"
          rows={3}
        />
      </div>
    </div>
  );
};

export default TestForm;
