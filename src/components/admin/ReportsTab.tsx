import { useState } from "react";
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
import { FileText, Download, Users, Filter } from "lucide-react";
import { 
  classesData, 
  subjectsData,
  teachersData,
} from "@/data/mockData";
import { getTests, getStudents, getClasses, getTeachers, getSubjects, getClassById, getSectionById, getSubjectById, getTeacherById } from "@/services/dataService";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { loadAmiriFont, ARABIC_FONT_NAME } from "@/utils/fontLoader";
import { toast } from "sonner";
import { getPerformanceLevels } from "./PerformanceLevelsTab";
import { getFooterSettings } from "./SettingsTab";
import { getHeaderSettings } from "./HeaderSettingsTab";

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
  const [isGeneratingDetailed, setIsGeneratingDetailed] = useState(false);

  // Filters for detailed report
  const [reportClassFilter, setReportClassFilter] = useState("all");
  const [reportTeacherFilter, setReportTeacherFilter] = useState("all");
  const [reportSubjectFilter, setReportSubjectFilter] = useState("all");

  // Get data for filters
  const allClasses = getClasses();
  const allTeachers = getTeachers();
  const allSubjects = getSubjects();

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

  // Generate detailed students report
  const generateDetailedStudentsReport = async () => {
    setIsGeneratingDetailed(true);
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

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
      const headerSettings = getHeaderSettings();

      // Get school info
      const schoolName = localStorage.getItem("schoolName") || "المدرسة";
      const schoolLogo = localStorage.getItem("schoolLogo");

      const students = getStudents();
      const tests = getTests();
      const classes = getClasses();

      // Helper to get performance level
      const getLevel = (pct: number) => {
        if (pct >= levels.excellent.min) return "ممتاز";
        if (pct >= levels.good.min) return "جيد";
        if (pct >= levels.average.min) return "متوسط";
        if (pct >= levels.low.min) return "متدني";
        return "راسب";
      };

      // Build student results data with filters
      const studentResults: any[] = [];

      students.forEach(student => {
        const cls = getClassById(student.classId);
        const section = getSectionById(student.classId, student.sectionId);
        
        // Apply class filter
        if (reportClassFilter !== "all" && student.classId !== reportClassFilter) return;
        
        // Find all tests for this student
        tests.forEach((test: any) => {
          if (!test.results) return;
          
          // Apply subject filter
          if (reportSubjectFilter !== "all" && test.subjectId !== reportSubjectFilter) return;
          
          // Apply teacher filter
          if (reportTeacherFilter !== "all" && test.teacherId !== reportTeacherFilter) return;
          
          const result = test.results.find((r: any) => r.studentId === student.id);
          if (result && !result.isAbsent) {
            const subject = getSubjectById(test.subjectId);
            const teacher = getTeacherById(test.teacherId);
            studentResults.push({
              studentName: student.name,
              className: cls?.name || "-",
              sectionName: section?.name || "-",
              subjectName: subject?.name || "-",
              teacherName: teacher?.name || "-",
              testName: test.name,
              score: result.totalScore || 0,
              maxScore: test.questions?.reduce((sum: number, q: any) => sum + (q.maxScore || 0), 0) || 100,
              percentage: result.percentage || 0,
              level: getLevel(result.percentage || 0),
              date: test.date || "-",
            });
          }
        });
      });

      // Header function for each page
      const addHeader = (yOffset: number = 0) => {
        // Classic frame
        doc.setDrawColor(80, 80, 80);
        doc.setLineWidth(0.8);
        doc.rect(margin, 8, pageWidth - margin * 2, 25);
        doc.setLineWidth(0.3);
        doc.rect(margin + 1, 9, pageWidth - margin * 2 - 2, 23);

        // Right side
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        doc.text(headerSettings.rightLine1 || "دولة فلسطين", pageWidth - margin - 5, 14, { align: "right" });
        doc.setFontSize(6);
        doc.text(headerSettings.rightLine1En || "State of Palestine", pageWidth - margin - 5, 18, { align: "right" });
        doc.setFontSize(7);
        doc.text(headerSettings.rightLine2 || "وزارة التربية والتعليم", pageWidth - margin - 5, 22, { align: "right" });
        doc.text(headerSettings.rightLine3 || "مديرية التربية والتعليم", pageWidth - margin - 5, 26, { align: "right" });

        // Logo in center
        if (schoolLogo) {
          try {
            doc.addImage(schoolLogo, "PNG", pageWidth / 2 - 6, 10, 12, 12);
          } catch (e) {}
        }
        doc.setFontSize(7);
        doc.text(schoolName, pageWidth / 2, 26, { align: "center" });

        // Left side
        doc.setFontSize(7);
        doc.text(headerSettings.leftLine1 || "Ministry of Education", margin + 5, 14, { align: "left" });
        doc.text(headerSettings.leftLine2 || "Directorate of Education", margin + 5, 18, { align: "left" });
        if (headerSettings.leftLine3) {
          doc.text(headerSettings.leftLine3, margin + 5, 22, { align: "left" });
        }

        // Title with filter info
        doc.setFontSize(12);
        doc.setTextColor(0, 100, 0);
        
        let reportTitle = "تقرير مفصل لنتائج الطلاب";
        const filterParts: string[] = [];
        
        if (reportClassFilter !== "all") {
          const cls = getClassById(reportClassFilter);
          if (cls) filterParts.push(`الصف: ${cls.name}`);
        }
        if (reportSubjectFilter !== "all") {
          const sub = getSubjectById(reportSubjectFilter);
          if (sub) filterParts.push(`المادة: ${sub.name}`);
        }
        if (reportTeacherFilter !== "all") {
          const tch = getTeacherById(reportTeacherFilter);
          if (tch) filterParts.push(`المعلم: ${tch.name}`);
        }
        
        doc.text(reportTitle, pageWidth / 2, 40 + yOffset, { align: "center" });
        
        if (filterParts.length > 0) {
          doc.setFontSize(9);
          doc.setTextColor(100, 100, 100);
          doc.text(filterParts.join(" | "), pageWidth / 2, 46 + yOffset, { align: "center" });
        }
        
        doc.setTextColor(0, 0, 0);

        return filterParts.length > 0 ? 52 + yOffset : 48 + yOffset;
      };

      let currentY = addHeader();

      // Summary with actual filtered counts
      const filteredStudentsCount = new Set(studentResults.map(r => r.studentName)).size;
      const filteredTestsCount = new Set(studentResults.map(r => r.testName)).size;
      
      doc.setFontSize(9);
      doc.text(`عدد الطلاب: ${filteredStudentsCount} | عدد الاختبارات: ${filteredTestsCount} | إجمالي النتائج: ${studentResults.length}`, pageWidth / 2, currentY, { align: "center" });
      currentY += 8;

      // Group by class
      const groupedByClass: { [key: string]: any[] } = {};
      studentResults.forEach(r => {
        const key = `${r.className} - ${r.sectionName}`;
        if (!groupedByClass[key]) groupedByClass[key] = [];
        groupedByClass[key].push(r);
      });

      Object.keys(groupedByClass).forEach((classKey, classIndex) => {
        const classResults = groupedByClass[classKey];

        // Check if we need a new page
        if (currentY > pageHeight - 60) {
          doc.addPage();
          currentY = addHeader();
        }

        // Class header
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 128);
        doc.text(`${classKey}`, pageWidth - margin, currentY, { align: "right" });
        doc.setTextColor(0, 0, 0);
        currentY += 6;

        // Table data
        const tableData = classResults.map((r, i) => [
          r.level,
          r.percentage.toFixed(1) + "%",
          `${r.score}/${r.maxScore}`,
          r.teacherName,
          r.subjectName,
          r.testName,
          r.studentName,
          i + 1
        ]);

        doc.autoTable({
          startY: currentY,
          head: [["المستوى", "النسبة", "الدرجة", "المعلم", "المادة", "الاختبار", "اسم الطالب", "م"]],
          body: tableData,
          theme: "grid",
          styles: { halign: "center", fontSize: 7, font: ARABIC_FONT_NAME, cellPadding: 1 },
          headStyles: { fillColor: [50, 50, 50], textColor: [255, 255, 255], fontSize: 7 },
          margin: { left: margin, right: margin },
          didParseCell: (data: any) => {
            if (data.section === "body" && data.column.index === 0) {
              const level = data.cell.raw;
              if (level === "ممتاز") data.cell.styles.textColor = [0, 128, 0];
              else if (level === "جيد") data.cell.styles.textColor = [0, 100, 200];
              else if (level === "متوسط") data.cell.styles.textColor = [200, 150, 0];
              else if (level === "متدني") data.cell.styles.textColor = [200, 100, 0];
              else data.cell.styles.textColor = [200, 0, 0];
            }
          }
        });

        currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : currentY + 30;
      });

      // Footer on last page
      const footerY = pageHeight - 10;
      if (footerSettings.showCopyright && footerSettings.copyrightText) {
        doc.setFontSize(7);
        doc.setTextColor(100, 100, 100);
        doc.text(footerSettings.copyrightText, pageWidth / 2, footerY, { align: "center" });
      }

      // Save
      doc.save("تقرير_مفصل_جميع_الطلاب.pdf");
      toast.success("تم إنشاء التقرير المفصل بنجاح");
    } catch (error) {
      console.error("Error generating detailed report:", error);
      toast.error("حدث خطأ أثناء إنشاء التقرير");
    } finally {
      setIsGeneratingDetailed(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Generate Reports Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Comprehensive Report */}
        <Card className="border-2 border-purple-500">
          <CardHeader className="bg-gradient-to-r from-purple-100 to-white border-b border-purple-500">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5" />
              تقرير شامل للمدرسة
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground mb-4">
              تقرير ملخص يتضمن إحصائيات عامة وقائمة بجميع التقارير
            </p>
            <Button 
              onClick={generateSchoolReport}
              disabled={isGenerating}
              className="bg-purple-600 hover:bg-purple-700 w-full"
            >
              <Download className="h-4 w-4 ml-2" />
              {isGenerating ? "جاري الإنشاء..." : "إنشاء تقرير شامل PDF"}
            </Button>
          </CardContent>
        </Card>

        {/* Detailed Students Report with Filters */}
        <Card className="border-2 border-blue-500">
          <CardHeader className="bg-gradient-to-r from-blue-100 to-white border-b border-blue-500">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5" />
              تقرير مفصل للطلاب
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              اختر الفلاتر ثم اضغط على زر الإنشاء
            </p>
            
            {/* Filters for detailed report */}
            <div className="grid grid-cols-1 gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">فلاتر التقرير:</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">الصف</Label>
                  <Select value={reportClassFilter} onValueChange={setReportClassFilter}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="جميع الصفوف" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الصفوف</SelectItem>
                      {allClasses.map(cls => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-xs">المادة</Label>
                  <Select value={reportSubjectFilter} onValueChange={setReportSubjectFilter}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="جميع المواد" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع المواد</SelectItem>
                      {allSubjects.map(sub => (
                        <SelectItem key={sub.id} value={sub.id}>
                          {sub.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-xs">المعلم</Label>
                  <Select value={reportTeacherFilter} onValueChange={setReportTeacherFilter}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="جميع المعلمين" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع المعلمين</SelectItem>
                      {allTeachers.map(t => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={generateDetailedStudentsReport}
              disabled={isGeneratingDetailed}
              className="bg-blue-600 hover:bg-blue-700 w-full"
            >
              <Download className="h-4 w-4 ml-2" />
              {isGeneratingDetailed ? "جاري الإنشاء..." : "إنشاء تقرير مفصل PDF"}
            </Button>
          </CardContent>
        </Card>
      </div>

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