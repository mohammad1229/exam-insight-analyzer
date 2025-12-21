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
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead className="text-right">اسم الاختبار</TableHead>
                <TableHead className="text-right">الصف</TableHead>
                <TableHead className="text-right">المادة</TableHead>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-center">عدد الطلاب</TableHead>
                <TableHead className="text-center">نسبة النجاح</TableHead>
                <TableHead className="text-center">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    {report.testName}
                  </TableCell>
                  <TableCell>
                    {report.className} {report.sectionName}
                  </TableCell>
                  <TableCell>{report.subjectName}</TableCell>
                  <TableCell>{report.date}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{report.totalStudents}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
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
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewReport(report.test)}
                        title="عرض التقرير"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditReport(report.test)}
                        title="تعديل النتائج"
                      >
                        <Edit2 className="h-4 w-4" />
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
