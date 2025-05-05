
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

  return (
    <div className="space-y-4 dir-rtl">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">قائمة الطلاب</h3>
        <Input
          placeholder="بحث عن طالب..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">اسم الطالب</TableHead>
              <TableHead className="text-center">غائب</TableHead>
              {questions.map((question) => (
                <TableHead key={question.id} className="text-center">
                  س{questions.findIndex(q => q.id === question.id) + 1} ({question.maxScore})
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
    </div>
  );
};

export default StudentList;
