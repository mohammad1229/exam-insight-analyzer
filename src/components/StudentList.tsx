import { useState, useEffect, useMemo } from "react";
import { Student } from "@/types";
import { getStudentsDB, DBStudent } from "@/services/databaseService";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StudentListProps {
  classId: string;
  sectionId: string;
  onStudentSelect: (studentId: string, isAbsent: boolean) => void;
  selectedStudents?: Record<string, { isAbsent: boolean, scores: Record<string, number> }>;
  questions: { id: string; type: string; maxScore: number }[];
  onScoreChange?: (studentId: string, questionId: string, value: number) => void;
}

const StudentList: React.FC<StudentListProps> = ({ 
  classId, 
  sectionId, 
  onStudentSelect,
  selectedStudents = {},
  questions = [],
  onScoreChange
}) => {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"list" | "single">("list");
  const [loading, setLoading] = useState(false);
  
  // Local scores for immediate UI updates
  const [localScores, setLocalScores] = useState<Record<string, Record<string, number>>>({});
  
  useEffect(() => {
    let isMounted = true;
    
    const fetchStudents = async () => {
      if (classId && sectionId) {
        setLoading(true);
        try {
          const allStudents = await getStudentsDB();
          
          if (!isMounted) return;
          
          // Filter students by class_id and section_id, and map to Student type
          const filteredStudents: Student[] = (allStudents || [])
            .filter((s: DBStudent) => s.class_id === classId && s.section_id === sectionId)
            .map((s: DBStudent) => ({
              id: s.id,
              name: s.name || "طالب",
              classId: s.class_id,
              sectionId: s.section_id
            }));
          
          setStudents(filteredStudents);
          
          // Initialize local scores for all students and auto-select them
          const initialScores: Record<string, Record<string, number>> = {};
          filteredStudents.forEach(student => {
            initialScores[student.id] = selectedStudents[student.id]?.scores || {};
            // Auto-initialize student in selectedStudents if not already there
            if (!selectedStudents[student.id]) {
              onStudentSelect(student.id, false);
            }
          });
          setLocalScores(initialScores);
        } catch (error) {
          console.error("StudentList: Error fetching students:", error);
          if (isMounted) {
            toast({
              title: "خطأ",
              description: "فشل في تحميل بيانات الطلاب",
              variant: "destructive",
            });
            setStudents([]);
            setLocalScores({});
          }
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      } else {
        setStudents([]);
        setLocalScores({});
      }
    };

    fetchStudents();
    
    return () => {
      isMounted = false;
    };
  }, [classId, sectionId]);

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate total possible score from all questions
  const totalPossibleScore = useMemo(() => {
    return questions.reduce((sum, q) => sum + q.maxScore, 0);
  }, [questions]);

  // Calculate student's total score from individual question scores
  const calculateTotalScore = (studentId: string): number => {
    const scores = localScores[studentId] || {};
    const studentData = selectedStudents[studentId];
    if (studentData?.isAbsent) return 0;
    
    return Object.values(scores).reduce((sum, score) => sum + (score || 0), 0);
  };

  // Calculate percentage score
  const calculatePercentage = (studentId: string): number => {
    if (totalPossibleScore === 0) return 0;
    const totalScore = calculateTotalScore(studentId);
    return Math.round((totalScore / totalPossibleScore) * 100);
  };

  const handleScoreChange = (studentId: string, questionId: string, value: string) => {
    const score = parseInt(value) || 0;
    const question = questions.find(q => q.id === questionId);
    if (!question) return;
    
    const maxScore = question.maxScore;
    const validScore = Math.min(Math.max(0, score), maxScore);

    if (score > maxScore) {
      toast({
        title: "تنبيه",
        description: `لا يمكن أن تتجاوز العلامة ${maxScore}`,
        variant: "destructive",
      });
    }

    // Update local scores immediately for responsive UI
    setLocalScores(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [questionId]: validScore
      }
    }));

    // Call parent callback if provided
    if (onScoreChange) {
      onScoreChange(studentId, questionId, validScore);
    }
    
    // Also ensure student is initialized in selectedStudents
    const studentData = selectedStudents[studentId];
    if (!studentData) {
      onStudentSelect(studentId, false);
    }
  };

  const toggleAbsent = (studentId: string) => {
    const student = selectedStudents[studentId] || { isAbsent: false, scores: {} };
    const isAbsent = !student.isAbsent;
    
    // Clear scores if marking as absent
    if (isAbsent) {
      setLocalScores(prev => ({
        ...prev,
        [studentId]: {}
      }));
    }
    
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
    if (loading) {
      return (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          <span className="mr-2">جاري تحميل الطلاب...</span>
        </div>
      );
    }

    if (filteredStudents.length === 0) {
      return (
        <div className="text-center py-8">
          لا يوجد طلاب في هذا الصف والشعبة
        </div>
      );
    }

    const student = filteredStudents[currentStudentIndex];
    const studentData = selectedStudents[student.id] || { isAbsent: false, scores: {} };
    const studentScores = localScores[student.id] || {};
    const totalScore = calculateTotalScore(student.id);
    const percentage = calculatePercentage(student.id);

    return (
      <Card className="border shadow-sm bg-white">
        <CardHeader className="pb-2 bg-gradient-to-r from-green-50 to-white border-b border-green-100">
          <CardTitle className="text-lg flex justify-between items-center">
            <div className="flex items-center">
              <span className="font-bold text-green-700">
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
                  <div key={question.id} className="space-y-2 border p-3 rounded-md bg-white shadow-sm hover:shadow-md transition-shadow">
                    <Label htmlFor={`score-${student.id}-${question.id}`} className="flex justify-between">
                      <span>السؤال {idx + 1}: {question.type}</span>
                      <span className="text-muted-foreground">من {question.maxScore}</span>
                    </Label>
                    <Input
                      id={`score-${student.id}-${question.id}`}
                      type="number"
                      min={0}
                      max={question.maxScore}
                      value={studentScores[question.id] ?? ""}
                      onChange={(e) => handleScoreChange(student.id, question.id, e.target.value)}
                      className="text-center"
                    />
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">مجموع العلامات:</span>
                  <span className="font-bold text-lg">{totalScore} من {totalPossibleScore}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>النسبة المئوية:</span>
                    <span>{percentage}%</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              </div>
              
              <div className="flex justify-between pt-4">
                <Button 
                  onClick={prevStudent} 
                  disabled={currentStudentIndex === 0} 
                  variant="outline"
                  className="border-black hover:bg-black hover:text-white"
                >
                  <ChevronRight className="ml-2 h-4 w-4" /> الطالب السابق
                </Button>
                <Button 
                  onClick={nextStudent} 
                  disabled={currentStudentIndex === filteredStudents.length - 1}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  الطالب التالي <ChevronLeft className="mr-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              الطالب مسجل كغائب. انتقل للطالب التالي.
              <div className="flex justify-between mt-4 pt-4 border-t">
                <Button 
                  onClick={prevStudent} 
                  disabled={currentStudentIndex === 0} 
                  variant="outline"
                  className="border-black hover:bg-black hover:text-white"
                >
                  <ChevronRight className="ml-2 h-4 w-4" /> الطالب السابق
                </Button>
                <Button 
                  onClick={nextStudent} 
                  disabled={currentStudentIndex === filteredStudents.length - 1}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
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
    if (loading) {
      return (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          <span className="mr-2">جاري تحميل الطلاب...</span>
        </div>
      );
    }

    return (
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader className="bg-black">
            <TableRow>
              <TableHead className="text-right text-white">اسم الطالب</TableHead>
              <TableHead className="text-center text-white">غائب</TableHead>
              {questions.map((question, idx) => (
                <TableHead key={question.id} className="text-center text-white">
                  س{idx + 1} ({question.maxScore})
                </TableHead>
              ))}
              <TableHead className="text-center text-white">المجموع</TableHead>
              <TableHead className="text-center text-white">النسبة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => {
                const studentData = selectedStudents[student.id] || { isAbsent: false, scores: {} };
                const studentScores = localScores[student.id] || {};
                const totalScore = calculateTotalScore(student.id);
                const percentage = calculatePercentage(student.id);
                
                return (
                  <TableRow key={student.id} className="hover:bg-green-50">
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={studentData.isAbsent}
                        onCheckedChange={() => toggleAbsent(student.id)}
                      />
                    </TableCell>
                    {questions.map((question) => (
                      <TableCell key={question.id} className="p-1">
                        <Input
                          type="number"
                          min={0}
                          max={question.maxScore}
                          value={studentScores[question.id] ?? ""}
                          onChange={(e) => handleScoreChange(student.id, question.id, e.target.value)}
                          disabled={studentData.isAbsent}
                          className="w-16 mx-auto text-center"
                        />
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-bold">
                      {studentData.isAbsent ? "غائب" : `${totalScore} / ${totalPossibleScore}`}
                    </TableCell>
                    <TableCell className="text-center">
                      {studentData.isAbsent ? (
                        <span className="text-red-500">0%</span>
                      ) : (
                        <span className={`px-2 py-1 rounded-full ${
                          percentage >= 70 ? 'bg-green-500 text-white' : 
                          percentage >= 50 ? 'bg-yellow-500 text-black' : 
                          'bg-red-500 text-white'
                        }`}>
                          {percentage}%
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={questions.length + 4} className="text-center py-4">
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
        <h3 className="text-xl font-semibold text-green-700">قائمة الطلاب</h3>
        <div className="flex gap-2 items-center">
          <Input
            placeholder="بحث عن طالب..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs border-green-300 focus:border-green-500"
          />
          <Select 
            value={viewMode} 
            onValueChange={(value: "list" | "single") => setViewMode(value)}
          >
            <SelectTrigger className="w-32 border-green-300">
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
