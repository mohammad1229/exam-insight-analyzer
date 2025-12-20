import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FileText, Eye, Trash2, Search, Calendar, Filter, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { 
  getTestsDB, 
  deleteTestDB, 
  getClassesDB, 
  getSubjectsDB, 
  getTeachersDB,
  getSectionsDB 
} from "@/services/databaseService";
import TestResultsEditor from "@/components/TestResultsEditor";

interface DBTest {
  id: string;
  name: string;
  test_date: string;
  test_type: string;
  class_id: string;
  section_id: string;
  subject_id: string;
  teacher_id: string;
  questions: any[];
  notes?: string;
  is_draft: boolean;
  results?: any[];
}

interface DBClass {
  id: string;
  name: string;
}

interface DBSection {
  id: string;
  name: string;
  class_id: string;
}

interface DBSubject {
  id: string;
  name: string;
}

interface DBTeacher {
  id: string;
  name: string;
}

const TestsTab = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [tests, setTests] = useState<DBTest[]>([]);
  const [classes, setClasses] = useState<DBClass[]>([]);
  const [sections, setSections] = useState<DBSection[]>([]);
  const [subjects, setSubjects] = useState<DBSubject[]>([]);
  const [teachers, setTeachers] = useState<DBTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState<string>("all");
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [filterTeacher, setFilterTeacher] = useState<string>("all");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [testToDelete, setTestToDelete] = useState<string | null>(null);
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [showEditor, setShowEditor] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [testsData, classesData, subjectsData, teachersData, sectionsData] = await Promise.all([
        getTestsDB(),
        getClassesDB(),
        getSubjectsDB(),
        getTeachersDB(),
        getSectionsDB()
      ]);
      setTests(testsData || []);
      setClasses(classesData || []);
      setSubjects(subjectsData || []);
      setTeachers(teachersData || []);
      setSections(sectionsData || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحميل البيانات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getClassName = (classId: string) => {
    return classes.find(c => c.id === classId)?.name || "غير محدد";
  };

  const getSectionName = (sectionId: string) => {
    return sections.find(s => s.id === sectionId)?.name || "";
  };

  const getSubjectName = (subjectId: string) => {
    return subjects.find(s => s.id === subjectId)?.name || "غير محدد";
  };

  const getTeacherName = (teacherId: string) => {
    return teachers.find(t => t.id === teacherId)?.name || "غير محدد";
  };

  const getTestTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      quiz: "اختبار قصير",
      midterm: "اختبار منتصف الفصل",
      final: "اختبار نهائي",
      homework: "واجب منزلي",
    };
    return types[type] || type;
  };

  const handleDeleteClick = (testId: string) => {
    setTestToDelete(testId);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!testToDelete) return;

    try {
      await deleteTestDB(testToDelete);
      setTests(tests.filter(t => t.id !== testToDelete));
      toast({
        title: "تم الحذف",
        description: "تم حذف الاختبار بنجاح",
      });
    } catch (error) {
      console.error("Error deleting test:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف الاختبار",
        variant: "destructive",
      });
    } finally {
      setDeleteConfirmOpen(false);
      setTestToDelete(null);
    }
  };

  const handleViewTest = (test: DBTest) => {
    navigate(`/reports/${test.id}`);
  };

  const handleEditTest = (test: DBTest) => {
    setSelectedTest(test);
    setShowEditor(true);
  };

  const calculatePassRate = (results: any[]) => {
    if (!results || results.length === 0) return 0;
    const presentResults = results.filter(r => !r.isAbsent && !r.is_absent);
    if (presentResults.length === 0) return 0;
    const passed = presentResults.filter(r => (r.percentage || 0) >= 50).length;
    return (passed / presentResults.length) * 100;
  };

  const filteredTests = tests.filter(test => {
    const matchesSearch = !searchTerm || 
      test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getSubjectName(test.subject_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getTeacherName(test.teacher_id).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesClass = filterClass === "all" || test.class_id === filterClass;
    const matchesSubject = filterSubject === "all" || test.subject_id === filterSubject;
    const matchesTeacher = filterTeacher === "all" || test.teacher_id === filterTeacher;

    return matchesSearch && matchesClass && matchesSubject && matchesTeacher;
  });

  return (
    <Card className="border-2 border-blue-500">
      <CardHeader className="bg-blue-50 pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            إدارة الاختبارات
          </CardTitle>
          <Button onClick={() => navigate("/test-results")}>
            إضافة اختبار جديد
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث باسم الاختبار أو المادة أو المعلم..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={filterClass} onValueChange={setFilterClass}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="جميع الصفوف" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الصفوف</SelectItem>
              {classes.map(cls => (
                <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterSubject} onValueChange={setFilterSubject}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="جميع المواد" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المواد</SelectItem>
              {subjects.map(sub => (
                <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterTeacher} onValueChange={setFilterTeacher}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="جميع المعلمين" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المعلمين</SelectItem>
              {teachers.map(teacher => (
                <SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{tests.length}</p>
            <p className="text-sm text-muted-foreground">إجمالي الاختبارات</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">
              {tests.filter(t => !t.is_draft).length}
            </p>
            <p className="text-sm text-muted-foreground">مكتملة</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">
              {tests.filter(t => t.is_draft).length}
            </p>
            <p className="text-sm text-muted-foreground">مسودات</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">
              {tests.filter(t => {
                const date = new Date(t.test_date);
                const now = new Date();
                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
              }).length}
            </p>
            <p className="text-sm text-muted-foreground">هذا الشهر</p>
          </div>
        </div>

        {/* Tests Table */}
        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">جاري تحميل البيانات...</p>
          </div>
        ) : filteredTests.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-right">اسم الاختبار</TableHead>
                  <TableHead className="text-right">المادة</TableHead>
                  <TableHead className="text-right">الصف</TableHead>
                  <TableHead className="text-right">المعلم</TableHead>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">النوع</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">نسبة النجاح</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTests.map((test) => {
                  const passRate = calculatePassRate(test.results || []);
                  return (
                    <TableRow key={test.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium">{test.name}</TableCell>
                      <TableCell>{getSubjectName(test.subject_id)}</TableCell>
                      <TableCell>
                        {getClassName(test.class_id)} {getSectionName(test.section_id)}
                      </TableCell>
                      <TableCell>{getTeacherName(test.teacher_id)}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {test.test_date}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-700">
                          {getTestTypeLabel(test.test_type)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${
                          test.is_draft 
                            ? "bg-yellow-100 text-yellow-700" 
                            : "bg-green-100 text-green-700"
                        }`}>
                          {test.is_draft ? "مسودة" : "مكتمل"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {test.results && test.results.length > 0 ? (
                          <span className={`px-2 py-1 rounded text-sm font-medium ${
                            passRate >= 70 
                              ? "bg-green-100 text-green-700" 
                              : passRate >= 50 
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                          }`}>
                            {passRate.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">لا توجد نتائج</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewTest(test)}
                            className="text-blue-600 hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditTest(test)}
                            className="text-green-600 hover:bg-green-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(test.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground text-lg">لا توجد اختبارات</p>
            <p className="text-sm text-muted-foreground mt-2">
              اضغط على "إضافة اختبار جديد" لإنشاء اختبار
            </p>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد من حذف هذا الاختبار؟ سيتم حذف جميع النتائج المرتبطة به. لا يمكن التراجع عن هذا الإجراء.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-red-600 hover:bg-red-700"
              >
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Test Editor Dialog */}
        {selectedTest && (
          <TestResultsEditor
            test={selectedTest}
            open={showEditor}
            onClose={() => {
              setShowEditor(false);
              setSelectedTest(null);
            }}
            onSave={() => {
              setShowEditor(false);
              setSelectedTest(null);
              loadData();
            }}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default TestsTab;
