
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { FileText, Download, Printer } from "lucide-react";
import { 
  classesData, 
  subjectsData,
  teachersData,
} from "@/data/mockData";
import { getTests, getStudents, getClasses, getTeachers, getSubjects } from "@/services/dataService";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { loadAmiriFont, ARABIC_FONT_NAME } from "@/utils/fontLoader";
import { toast } from "sonner";
import { getPerformanceLevels } from "./PerformanceLevelsTab";
import { getFooterSettings } from "./SettingsTab";

// Mock reports type
interface Report {
  id: string;
  testId: string;
  testName: string;
  className: string;
  sectionName: string;
  subjectName: string;
  teacherName: string;
  date: string;
  totalStudents: number;
  passedStudents: number;
  passRate: number;
}

interface ReportsTabProps {
  mockReports: Report[];
}

const ReportsTab = ({ mockReports }: ReportsTabProps) => {
  const navigate = useNavigate();
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedTeacher, setSelectedTeacher] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [isGenerating, setIsGenerating] = useState(false);

  // Filter reports based on selections
  const filteredReports = mockReports.filter(report => {
    let matches = true;
    
    if (selectedClass && selectedClass !== "all" && report.className !== selectedClass) {
      matches = false;
    }
    
    if (selectedTeacher && selectedTeacher !== "all" && report.teacherName !== selectedTeacher) {
      matches = false;
    }
    
    if (selectedSubject && selectedSubject !== "all" && report.subjectName !== selectedSubject) {
      matches = false;
    }
    
    return matches;
  });

  // Handle report view
  const handleViewReport = (testId: string) => {
    navigate(`/reports/${testId}`);
  };

  // Generate comprehensive school report
  const generateSchoolReport = async () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

      // Load Arabic font
      try {
        const fontBase64 = await loadAmiriFont();
        doc.addFileToVFS("Amiri-Regular.ttf", fontBase64);
        doc.addFont("Amiri-Regular.ttf", ARABIC_FONT_NAME, "normal");
        doc.setFont(ARABIC_FONT_NAME);
      } catch (error) {
        console.error("Failed to load Arabic font:", error);
        doc.setFont("helvetica");
      }

      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 10;
      const levels = getPerformanceLevels();
      const footerSettings = getFooterSettings();

      // Get school info
      const schoolName = localStorage.getItem("schoolName") || "المدرسة";
      const schoolLogo = localStorage.getItem("schoolLogo");

      // Header
      doc.setDrawColor(80, 80, 80);
      doc.setLineWidth(0.8);
      doc.rect(margin, 8, pageWidth - margin * 2, 20);
      doc.setLineWidth(0.3);
      doc.rect(margin + 1, 9, pageWidth - margin * 2 - 2, 18);

      // Logo in center
      if (schoolLogo) {
        try {
          doc.addImage(schoolLogo, "PNG", pageWidth / 2 - 8, 10, 16, 16);
        } catch (e) {}
      }

      doc.setFontSize(14);
      doc.setTextColor(0, 100, 0);
      doc.text("تقرير شامل لنتائج الطلاب", pageWidth / 2, 35, { align: "center" });

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(schoolName, pageWidth / 2, 42, { align: "center" });

      let currentY = 50;

      // Summary stats
      const tests = getTests();
      const students = getStudents();
      const teachers = getTeachers();
      const classes = getClasses();

      let totalExcellent = 0, totalGood = 0, totalAverage = 0, totalLow = 0, totalFailed = 0;

      tests.forEach((test: any) => {
        if (!test.results) return;
        test.results.filter((r: any) => !r.isAbsent).forEach((r: any) => {
          const pct = r.percentage || 0;
          if (pct >= levels.excellent.min) totalExcellent++;
          else if (pct >= levels.good.min) totalGood++;
          else if (pct >= levels.average.min) totalAverage++;
          else if (pct >= levels.low.min) totalLow++;
          else totalFailed++;
        });
      });

      // Summary table
      doc.autoTable({
        startY: currentY,
        head: [["راسب", "متدني", "متوسط", "جيد", "ممتاز", "عدد الاختبارات", "عدد المعلمين", "عدد الطلاب"]],
        body: [[totalFailed, totalLow, totalAverage, totalGood, totalExcellent, tests.length, teachers.length, students.length]],
        theme: "grid",
        styles: { halign: "center", fontSize: 9, font: ARABIC_FONT_NAME },
        headStyles: { fillColor: [0, 100, 0], textColor: [255, 255, 255] },
        margin: { left: margin, right: margin },
      });

      currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : currentY + 20;

      // Reports list
      doc.setFontSize(11);
      doc.text("قائمة التقارير المسجلة:", pageWidth - margin, currentY, { align: "right" });
      currentY += 5;

      const reportsData = filteredReports.map((r, i) => [
        r.passRate.toFixed(1) + "%",
        r.totalStudents,
        r.date,
        r.teacherName,
        r.subjectName,
        r.className + " " + r.sectionName,
        r.testName,
        i + 1
      ]);

      doc.autoTable({
        startY: currentY,
        head: [["نسبة النجاح", "عدد الطلاب", "التاريخ", "المعلم", "المادة", "الصف", "الاختبار", "م"]],
        body: reportsData,
        theme: "grid",
        styles: { halign: "center", fontSize: 8, font: ARABIC_FONT_NAME },
        headStyles: { fillColor: [50, 50, 50], textColor: [255, 255, 255] },
        margin: { left: margin, right: margin },
        didParseCell: (data: any) => {
          if (data.section === "body" && data.column.index === 0) {
            const rate = parseFloat(data.cell.raw);
            if (rate >= 70) data.cell.styles.textColor = [0, 128, 0];
            else if (rate >= 50) data.cell.styles.textColor = [200, 150, 0];
            else data.cell.styles.textColor = [200, 0, 0];
          }
        }
      });

      // Footer
      const footerY = pageHeight - 15;
      if (footerSettings.showCopyright && footerSettings.copyrightText) {
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(footerSettings.copyrightText, pageWidth / 2, footerY, { align: "center" });
      }
      if (footerSettings.footerNote) {
        doc.setFontSize(7);
        doc.text(footerSettings.footerNote, pageWidth / 2, footerY + 4, { align: "center" });
      }

      // Save
      doc.save("تقرير_شامل_المدرسة.pdf");
      toast.success("تم إنشاء التقرير الشامل بنجاح");
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("حدث خطأ أثناء إنشاء التقرير");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Generate Comprehensive Report */}
      <Card className="border-2 border-purple-500">
        <CardHeader className="bg-gradient-to-r from-purple-100 to-white border-b border-purple-500">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            تقرير شامل للمدرسة
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-muted-foreground mb-4">
            أنشئ تقريراً شاملاً يتضمن جميع نتائج الطلاب والصفوف والمعلمين في ملف PDF واحد
          </p>
          <Button 
            onClick={generateSchoolReport}
            disabled={isGenerating}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Download className="h-4 w-4 ml-2" />
            {isGenerating ? "جاري الإنشاء..." : "إنشاء تقرير شامل PDF"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-2 border-green-500">
        <CardHeader className="bg-gradient-to-r from-green-100 to-white border-b border-green-500">
          <CardTitle>تصفية التقارير</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>الصف</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="اختر الصف" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الصفوف</SelectItem>
                  {classesData.map(cls => (
                    <SelectItem key={cls.id} value={cls.name}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>المعلم</Label>
              <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="اختر المعلم" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المعلمين</SelectItem>
                  {teachersData.map(teacher => (
                    <SelectItem key={teacher.id} value={teacher.name}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>المادة</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="اختر المادة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المواد</SelectItem>
                  {subjectsData.map(subject => (
                    <SelectItem key={subject.id} value={subject.name}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-2 border-red-500">
        <CardHeader className="bg-gradient-to-r from-red-100 to-white border-b border-red-500">
          <CardTitle>قائمة التقارير</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Table>
            <TableHeader className="bg-black">
              <TableRow>
                <TableHead className="text-white">اسم الاختبار</TableHead>
                <TableHead className="text-white">الصف</TableHead>
                <TableHead className="text-white">المادة</TableHead>
                <TableHead className="text-white">المعلم</TableHead>
                <TableHead className="text-white">التاريخ</TableHead>
                <TableHead className="text-center text-white">نسبة النجاح</TableHead>
                <TableHead className="text-white"></TableHead>
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {filteredReports.length > 0 ? (
                filteredReports.map(report => (
                  <TableRow key={report.id} className="hover:bg-green-50">
                    <TableCell className="font-medium">{report.testName}</TableCell>
                    <TableCell>{report.className} {report.sectionName}</TableCell>
                    <TableCell>{report.subjectName}</TableCell>
                    <TableCell>{report.teacherName}</TableCell>
                    <TableCell>{report.date}</TableCell>
                    <TableCell className="text-center">
                      <span className={`px-2 py-1 rounded-full text-white ${
                        report.passRate >= 70 ? 'bg-green-500' : 
                        report.passRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}>
                        {report.passRate}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewReport(report.testId)}
                      >
                        عرض التقرير
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">
                    لا توجد تقارير تطابق معايير التصفية المحددة
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsTab;
