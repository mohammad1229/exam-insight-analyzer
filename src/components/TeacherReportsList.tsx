import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit2, Trash2, FileText } from "lucide-react";
import { Test } from "@/types";
import {
  getTests,
  getClassById,
  getSectionById,
  getSubjectById,
  getCurrentTeacher,
  deleteTest,
} from "@/services/dataService";
import ReportPreview from "@/components/ReportPreview";
import TestResultsEditor from "@/components/TestResultsEditor";
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
import { toast } from "sonner";

interface Report {
  id: string;
  testId: string;
  testName: string;
  className: string;
  sectionName: string;
  subjectName: string;
  date: string;
  totalStudents: number;
  passedStudents: number;
  passRate: number;
  totalMaxScore: number;
  test: Test;
}

const TeacherReportsList = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [showReportPreview, setShowReportPreview] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [testToDelete, setTestToDelete] = useState<string | null>(null);
  const currentTeacher = getCurrentTeacher();

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = () => {
    const allTests = getTests();
    // Filter tests by current teacher
    const teacherTests = currentTeacher
      ? allTests.filter((t) => t.teacherId === currentTeacher.id && !t.draft)
      : [];

    const reportsData: Report[] = teacherTests.map((test) => {
      const classObj = getClassById(test.classId);
      const section = getSectionById(test.classId, test.sectionId);
      const subject = getSubjectById(test.subjectId);

      const presentResults = test.results.filter((r) => !r.isAbsent);
      const passedCount = presentResults.filter(
        (r) => r.percentage >= 50
      ).length;
      const passRate =
        presentResults.length > 0
          ? Math.round((passedCount / presentResults.length) * 100)
          : 0;

      // Calculate total max score from questions
      const totalMaxScore = test.questions?.reduce((sum: number, q: any) => sum + (q.maxScore || 0), 0) || 0;

      return {
        id: `report_${test.id}`,
        testId: test.id,
        testName: test.name,
        className: classObj?.name || "",
        sectionName: section?.name || "",
        subjectName: subject?.name || "",
        date: test.date,
        totalStudents: presentResults.length,
        passedStudents: passedCount,
        passRate,
        totalMaxScore,
        test,
      };
    });

    setReports(reportsData);
  };

  const handleViewReport = (test: Test) => {
    setSelectedTest(test);
    setShowReportPreview(true);
  };

  const handleEditReport = (test: Test) => {
    setSelectedTest(test);
    setShowEditDialog(true);
  };

  const handleDeleteReport = (testId: string) => {
    setTestToDelete(testId);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (testToDelete) {
      deleteTest(testToDelete);
      loadReports();
      toast.success("تم حذف التقرير بنجاح");
      setShowDeleteDialog(false);
      setTestToDelete(null);
    }
  };

  const handleSaveEditedTest = () => {
    loadReports();
    setShowEditDialog(false);
    setSelectedTest(null);
    toast.success("تم حفظ التعديلات بنجاح");
  };

  if (reports.length === 0) {
    return (
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            تقاريري
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mb-4 opacity-50" />
            <p>لا توجد تقارير حتى الآن</p>
            <p className="text-sm">أنشئ اختباراً جديداً لرؤية التقارير هنا</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-2 border-primary/20">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            تقاريري ({reports.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map((report) => (
              <Card key={report.id} className="border hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 to-transparent">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="truncate">{report.testName}</span>
                    <Badge
                      className={
                        report.passRate >= 70
                          ? "bg-green-500"
                          : report.passRate >= 50
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }
                    >
                      {report.passRate}%
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-xs">الصف</span>
                      <span className="font-medium">{report.className} {report.sectionName}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-xs">المادة</span>
                      <span className="font-medium">{report.subjectName}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-xs">التاريخ</span>
                      <span className="font-medium">{report.date}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-xs">علامة الاختبار</span>
                      <span className="font-medium text-primary">{report.totalMaxScore} درجة</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-xs">عدد الطلاب</span>
                      <Badge variant="outline" className="w-fit">{report.totalStudents}</Badge>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-xs">الناجحون</span>
                      <Badge variant="secondary" className="w-fit">{report.passedStudents}</Badge>
                    </div>
                  </div>
                  
                  <div className="flex justify-between gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewReport(report.test)}
                      title="عرض التقرير"
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 ml-1" />
                      عرض
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditReport(report.test)}
                      title="تعديل النتائج"
                      className="flex-1"
                    >
                      <Edit2 className="h-4 w-4 ml-1" />
                      تعديل
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteReport(report.testId)}
                      className="text-destructive hover:bg-destructive/10"
                      title="حذف"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Report Preview Dialog */}
      {selectedTest && (
        <ReportPreview
          test={selectedTest}
          open={showReportPreview}
          onClose={() => {
            setShowReportPreview(false);
            setSelectedTest(null);
          }}
        />
      )}

      {/* Edit Results Dialog */}
      {selectedTest && (
        <TestResultsEditor
          test={selectedTest}
          open={showEditDialog}
          onClose={() => {
            setShowEditDialog(false);
            setSelectedTest(null);
          }}
          onSave={handleSaveEditedTest}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف هذا التقرير نهائياً ولا يمكن استرجاعه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TeacherReportsList;
