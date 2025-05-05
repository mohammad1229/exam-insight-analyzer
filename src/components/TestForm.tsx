
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
import { 
  classesData, 
  subjectsData, 
  teachersData 
} from "@/data/mockData";
import { Class, Question, Section } from "@/types";
import { toast } from "@/hooks/use-toast";

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

const TEST_QUESTION_TYPES = [
  { id: "اختيار من متعدد", name: "اختيار من متعدد" },
  { id: "صواب وخطأ", name: "صواب وخطأ" },
  { id: "مقالي", name: "مقالي" },
  { id: "تكميلي", name: "تكميلي" },
  { id: "مطابقة", name: "مطابقة" },
  { id: "custom", name: "سؤال مخصص" }
];

const TestForm: React.FC<TestFormProps> = ({ onFormDataChange }) => {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [date, setDate] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [notes, setNotes] = useState("");
  const [sections, setSections] = useState<Section[]>([]);

  // Question form state
  const [questionType, setQuestionType] = useState("");
  const [customQuestionType, setCustomQuestionType] = useState("");
  const [maxScore, setMaxScore] = useState<number>(5);

  useEffect(() => {
    if (classId) {
      const selectedClass = classesData.find(c => c.id === classId);
      if (selectedClass) {
        setSections(selectedClass.sections);
      } else {
        setSections([]);
      }
    } else {
      setSections([]);
    }
  }, [classId]);

  useEffect(() => {
    onFormDataChange({
      name,
      type,
      subjectId,
      teacherId,
      classId,
      sectionId,
      date,
      questions,
      notes,
    });
  }, [name, type, subjectId, teacherId, classId, sectionId, date, questions, notes]);

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
                <SelectItem value="exam">امتحان رسمي</SelectItem>
                <SelectItem value="quiz">اختبار قصير</SelectItem>
                <SelectItem value="homework">واجب منزلي</SelectItem>
                <SelectItem value="worksheet">ورقة عمل</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">المادة</Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger id="subject">
                <SelectValue placeholder="اختر المادة" />
              </SelectTrigger>
              <SelectContent>
                {subjectsData.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
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
                {teachersData.map((teacher) => (
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
                {classesData.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
