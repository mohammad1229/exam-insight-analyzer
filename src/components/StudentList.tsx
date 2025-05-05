
import { useState, useEffect } from "react";
import { Student } from "@/types";
import { getStudentsByClassAndSection } from "@/data/mockData";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ChevronRight, ChevronLeft } from "lucide-react";

interface StudentListProps {
  classId: string;
  sectionId: string;
  onStudentSelect: (studentId: string, isAbsent: boolean) => void;
  selectedStudents?: Record<string, { isAbsent: boolean, scores: Record<string, number> }>;
  questions: { id: string; type: string; maxScore: number }[];
}

const StudentList: React.FC<StudentListProps> = ({ 
  classId, 
  sectionId, 
  onStudentSelect,
  selectedStudents = {},
  questions = []
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"list" | "single">("list");
  
  useEffect(() => {
    if (classId && sectionId) {
      const filteredStudents = getStudentsByClassAndSection(classId, sectionId);
      setStudents(filteredStudents);
    } else {
      setStudents([]);
    }
  }, [classId, sectionId]);

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleScoreChange = (studentId: string, questionId: string, value: string) => {
    const score = parseInt(value) || 0;
    const question = questions.find(q => q.id === questionId);
    if (!question) return;
    
    const maxScore = question.maxScore;
    const validScore = Math.min(Math.max(0, score), maxScore);

    const student = selectedStudents[studentId] || { isAbsent: false, scores: {} };
    const updatedStudent = {
      ...student,
      scores: { ...(student.scores || {}), [questionId]: validScore }
    };

    onStudentSelect(studentId, updatedStudent.isAbsent);
  };

  const toggleAbsent = (studentId: string) => {
    const student = selectedStudents[studentId] || { isAbsent: false, scores: {} };
    const isAbsent = !student.isAbsent;
    
    onStudentSelect(studentId, isAbsent);
  };

  const nextStudent = () => {
    if (currentStudentIndex < filteredStudents.length - 1) {
      setCurrentStudentIndex(currentStudentIndex + 1);
    }
  };

  const prevStudent = () => {
    if (currentStudentIndex > 0) {
      setCurrentStudentIndex(currentStudentIndex - 1);
    }
  };

  // Render the single student score entry form
  const renderSingleStudentForm = () => {
    if (filteredStudents.length === 0) {
      return (
        <div className="text-center py-8">
          لا يوجد طلاب في هذا الصف والشعبة
        </div>
      );
    }

    const student = filteredStudents[currentStudentIndex];
    const studentData = selectedStudents[student.id] || { isAbsent: false, scores: {} };

    return (
      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex justify-between items-center">
            <div className="flex items-center">
              <span className="font-bold text-primary">
                طالب {currentStudentIndex + 1} من {filteredStudents.length}:
              </span>
              <span className="mr-2">{student.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor={`absent-${student.id}`} className="text-sm font-normal cursor-pointer">
                غائب
              </Label>
              <Checkbox
                id={`absent-${student.id}`}
                checked={studentData.isAbsent}
                onCheckedChange={() => toggleAbsent(student.id)}
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {!studentData.isAbsent ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {questions.map((question, idx) => (
                  <div key={question.id} className="space-y-2 border p-3 rounded-md">
                    <Label htmlFor={`score-${student.id}-${question.id}`} className="flex justify-between">
                      <span>السؤال {idx + 1}: {question.type}</span>
                      <span className="text-muted-foreground">من {question.maxScore}</span>
                    </Label>
                    <Input
                      id={`score-${student.id}-${question.id}`}
                      type="number"
                      min={0}
                      max={question.maxScore}
                      value={studentData.scores?.[question.id] || ""}
                      onChange={(e) => handleScoreChange(student.id, question.id, e.target.value)}
                      className="text-center"
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between pt-4">
                <Button onClick={prevStudent} disabled={currentStudentIndex === 0} variant="outline">
                  <ChevronRight className="ml-2 h-4 w-4" /> الطالب السابق
                </Button>
                <Button onClick={nextStudent} disabled={currentStudentIndex === filteredStudents.length - 1}>
                  الطالب التالي <ChevronLeft className="mr-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              الطالب مسجل كغائب. انتقل للطالب التالي.
              <div className="flex justify-between mt-4 pt-4 border-t">
                <Button onClick={prevStudent} disabled={currentStudentIndex === 0} variant="outline">
                  <ChevronRight className="ml-2 h-4 w-4" /> الطالب السابق
                </Button>
                <Button onClick={nextStudent} disabled={currentStudentIndex === filteredStudents.length - 1}>
                  الطالب التالي <ChevronLeft className="mr-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Render the table view of all students
  const renderStudentsTable = () => {
    return (
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">اسم الطالب</TableHead>
              <TableHead className="text-center">غائب</TableHead>
              {questions.map((question, idx) => (
                <TableHead key={question.id} className="text-center">
                  س{idx + 1} ({question.maxScore})
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => {
                const studentData = selectedStudents[student.id] || { isAbsent: false, scores: {} };
                return (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={studentData.isAbsent}
                        onCheckedChange={() => toggleAbsent(student.id)}
                      />
                    </TableCell>
                    {questions.map((question) => (
                      <TableCell key={question.id}>
                        <Input
                          type="number"
                          min={0}
                          max={question.maxScore}
                          value={studentData.scores?.[question.id] || ""}
                          onChange={(e) => handleScoreChange(student.id, question.id, e.target.value)}
                          disabled={studentData.isAbsent}
                          className="w-16 mx-auto text-center"
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={2 + questions.length} className="text-center py-4">
                  لا يوجد طلاب في هذا الصف والشعبة، أو تم تطبيق مرشح البحث
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-4 dir-rtl">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">قائمة الطلاب</h3>
        <div className="flex gap-2 items-center">
          <Input
            placeholder="بحث عن طالب..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
          <Select 
            value={viewMode} 
            onValueChange={(value: "list" | "single") => setViewMode(value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="طريقة العرض" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="list">عرض القائمة</SelectItem>
              <SelectItem value="single">طالب بطالب</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {viewMode === "single" ? renderSingleStudentForm() : renderStudentsTable()}
    </div>
  );
};

export default StudentList;
