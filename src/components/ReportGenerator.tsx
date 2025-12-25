
import React, { useState, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Download, FileText, Eye, Loader2 } from "lucide-react";
import { getStudentById, getClassById, getSectionById, getSubjectById, getTeacherById } from "@/services/dataService";
import { getClassesDB, getSectionsDB, getSubjectsDB, getTeachersDB, getStudentsDB } from "@/services/databaseService";
import { loadAmiriFont, ARABIC_FONT_NAME } from "@/utils/fontLoader";
import ReportPreview from "./ReportPreview";
import { toast } from "sonner";

// Add the required typings for jsPDF with autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable?: {
      finalY: number;
    };
  }
}

interface ReportGeneratorProps {
  test: any;
}

interface DBLookups {
  classById: Map<string, string>;
  sectionById: Map<string, string>;
  subjectById: Map<string, string>;
  teacherById: Map<string, string>;
  studentById: Map<string, string>;
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({ test }) => {
  const [reportType, setReportType] = useState<string>("all");
  const [showPreview, setShowPreview] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dbLookups, setDbLookups] = useState<DBLookups | null>(null);

  // Load database lookups on mount
  useEffect(() => {
    let isMounted = true;
    
    const loadLookups = async () => {
      try {
        const [classes, sections, subjects, teachers, students] = await Promise.all([
          getClassesDB(),
          getSectionsDB(),
          getSubjectsDB(),
          getTeachersDB(),
          getStudentsDB()
        ]);
        
        if (!isMounted) return;
        
        const classById = new Map<string, string>();
        const sectionById = new Map<string, string>();
        const subjectById = new Map<string, string>();
        const teacherById = new Map<string, string>();
        const studentById = new Map<string, string>();
        
        classes.forEach(c => classById.set(c.id, c.name));
        sections.forEach(s => sectionById.set(s.id, s.name));
        subjects.forEach(s => subjectById.set(s.id, s.name));
        teachers.forEach(t => teacherById.set(t.id, t.name));
        students.forEach(s => studentById.set(s.id, s.name));
        
        setDbLookups({ classById, sectionById, subjectById, teacherById, studentById });
      } catch (error) {
        console.error("Error loading lookups:", error);
      }
    };
    
    loadLookups();
    return () => { isMounted = false; };
  }, []);

  const getSchoolInfo = () => {
    const schoolName = localStorage.getItem("schoolName") || "المدرسة";
    const directorName = localStorage.getItem("directorName") || "المدير";
    const schoolLogo = localStorage.getItem("schoolLogo") || "";
    const isActivated = localStorage.getItem("systemActivated") === "true";
    
    return {
      schoolName,
      directorName,
      schoolLogo,
      isActivated
    };
  };

  const getStudentName = useCallback((studentId: string, studentNameFromResult?: string): string => {
    // Priority: 1. Name from result, 2. DB lookup, 3. localStorage, 4. ID
    if (studentNameFromResult) return studentNameFromResult;
    if (dbLookups?.studentById.has(studentId)) return dbLookups.studentById.get(studentId)!;
    const student = getStudentById(studentId);
    return student?.name || studentId;
  }, [dbLookups]);

  const getTestDetails = useCallback(() => {
    // Try DB lookup first, then fallback to localStorage
    const classId = test.classId || test.class_id;
    const sectionId = test.sectionId || test.section_id;
    const subjectId = test.subjectId || test.subject_id;
    const teacherId = test.teacherId || test.teacher_id;
    
    let className = dbLookups?.classById.get(classId) || "";
    let sectionName = dbLookups?.sectionById.get(sectionId) || "";
    let subjectName = dbLookups?.subjectById.get(subjectId) || "";
    let teacherName = dbLookups?.teacherById.get(teacherId) || "";
    
    // Fallback to localStorage if DB didn't have the data
    if (!className) {
      const classInfo = getClassById(classId);
      className = classInfo?.name || "";
    }
    if (!sectionName) {
      const sectionInfo = getSectionById(classId, sectionId);
      sectionName = sectionInfo?.name || "";
    }
    if (!subjectName) {
      const subjectInfo = getSubjectById(subjectId);
      subjectName = subjectInfo?.name || "";
    }
    if (!teacherName) {
      const teacherInfo = getTeacherById(teacherId);
      teacherName = teacherInfo?.name || "";
    }
    
    return { className, sectionName, subjectName, teacherName };
  }, [test, dbLookups]);

  // Calculate statistics
  const calculateStats = () => {
    const presentStudents = test.results.filter((r: any) => !r.isAbsent);
    const passedStudents = presentStudents.filter((r: any) => r.percentage >= 50);
    const failedStudents = presentStudents.filter((r: any) => r.percentage < 50);
    const absentStudents = test.results.filter((r: any) => r.isAbsent);
    
    const scores = presentStudents.map((r: any) => r.percentage);
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;
    const avgScore = scores.length > 0 
      ? scores.reduce((sum: number, s: number) => sum + s, 0) / scores.length 
      : 0;
    const passRate = presentStudents.length > 0 
      ? (passedStudents.length / presentStudents.length) * 100 
      : 0;
    
    const questionStats = test.questions.map((question: any, idx: number) => {
      let totalScore = 0;
      let answeredCount = 0;
      let passedCount = 0;
      
      test.results.forEach((result: any) => {
        if (!result.isAbsent) {
          const score = result.scores[question.id] || 0;
          totalScore += score;
          answeredCount++;
          if (score >= question.maxScore * 0.5) {
            passedCount++;
          }
        }
      });
      
      const avgQuestionScore = answeredCount > 0 ? totalScore / answeredCount : 0;
      const questionPassRate = answeredCount > 0 ? (passedCount / answeredCount) * 100 : 0;
      
      return {
        questionNum: idx + 1,
        type: question.type,
        maxScore: question.maxScore,
        avgScore: avgQuestionScore,
        passRate: questionPassRate,
        passedCount,
        failedCount: answeredCount - passedCount
      };
    });
    
    return {
      totalStudents: test.results.length,
      presentCount: presentStudents.length,
      absentCount: absentStudents.length,
      passedCount: passedStudents.length,
      failedCount: failedStudents.length,
      highestScore,
      lowestScore,
      avgScore,
      passRate,
      questionStats
    };
  };
  
  const generateExcelReport = () => {
    const { name, type, date, questions, results } = test;
    const { schoolName, directorName } = getSchoolInfo();
    const { className, sectionName, subjectName, teacherName } = getTestDetails();
    const stats = calculateStats();
    
    const wb = XLSX.utils.book_new();
    
    // Test info sheet (Arabic)
    const testInfoData = [
      ["اسم المدرسة", schoolName],
      ["اسم الاختبار", name],
      ["نوع الاختبار", type],
      ["المادة", subjectName],
      ["المعلم", teacherName],
      ["الصف", className],
      ["الشعبة", sectionName],
      ["التاريخ", date],
      ["عدد الأسئلة", questions.length],
      ["عدد الطلاب", results.length]
    ];
    
    const testInfoWs = XLSX.utils.aoa_to_sheet(testInfoData);
    XLSX.utils.book_append_sheet(wb, testInfoWs, "معلومات الاختبار");
    
    // Statistics Summary sheet (Arabic)
    const statsData = [
      ["الإحصائيات العامة", ""],
      ["إجمالي الطلاب", stats.totalStudents],
      ["الطلاب الحاضرين", stats.presentCount],
      ["الطلاب الغائبين", stats.absentCount],
      ["عدد الناجحين", stats.passedCount],
      ["عدد الراسبين", stats.failedCount],
      ["نسبة النجاح", `${stats.passRate.toFixed(1)}%`],
      ["متوسط الدرجات", `${stats.avgScore.toFixed(1)}%`],
      ["أعلى درجة", `${stats.highestScore}%`],
      ["أدنى درجة", `${stats.lowestScore}%`],
      ["", ""],
      ["تحليل الأسئلة", ""],
      ["السؤال", "نسبة النجاح"]
    ];
    
    stats.questionStats.forEach((q: any) => {
      statsData.push([`س${q.questionNum}`, `${q.passRate.toFixed(1)}%`]);
    });
    
    const statsWs = XLSX.utils.aoa_to_sheet(statsData);
    XLSX.utils.book_append_sheet(wb, statsWs, "الإحصائيات");
    
    // Results sheet (Arabic)
    const resultsHeaders = [
      "اسم الطالب", 
      "الحضور", 
      ...questions.map((_: any, idx: number) => `س${idx + 1}`),
      "المجموع",
      "النسبة",
      "الحالة"
    ];
    
    const resultsData = [
      resultsHeaders,
      ...results.map((result: any) => {
        const studentName = getStudentName(result.studentId || result.student_id, result.studentName || result.students?.name);
        const scoreItems = questions.map((q: any) => result.isAbsent || result.is_absent ? "-" : (result.scores[q.id] || 0));
        const isAbsent = result.isAbsent || result.is_absent;
        const percentage = result.percentage ?? 0;
        const totalScore = result.totalScore ?? result.total_score ?? 0;
        const status = isAbsent ? "غائب" : (percentage >= 50 ? "ناجح" : "راسب");
        
        return [
          studentName,
          isAbsent ? "غائب" : "حاضر",
          ...scoreItems,
          isAbsent ? "0" : totalScore,
          isAbsent ? "0%" : `${percentage}%`,
          status
        ];
      })
    ];
    
    const resultsWs = XLSX.utils.aoa_to_sheet(resultsData);
    XLSX.utils.book_append_sheet(wb, resultsWs, "نتائج الطلاب");
    
    // Questions analysis sheet (Arabic)
    const questionsData = [
      ["السؤال", "النوع", "الدرجة القصوى", "المتوسط", "نسبة النجاح", "ناجحون", "راسبون"],
      ...stats.questionStats.map((q: any) => [
        `س${q.questionNum}`,
        q.type,
        q.maxScore,
        q.avgScore.toFixed(2),
        `${q.passRate.toFixed(1)}%`,
        q.passedCount,
        q.failedCount
      ])
    ];
    
    const questionsWs = XLSX.utils.aoa_to_sheet(questionsData);
    XLSX.utils.book_append_sheet(wb, questionsWs, "تحليل الأسئلة");
    
    // Footer
    const footerWs = XLSX.utils.aoa_to_sheet([
      ["تم إنشاء هذا التقرير بواسطة نظام تحليل نتائج الاختبارات"],
      [`مدير المدرسة: ${directorName}`],
      ["نشكر ثقتكم بخدماتنا"]
    ]);
    XLSX.utils.book_append_sheet(wb, footerWs, "معلومات إضافية");
    
    XLSX.writeFile(wb, `تقرير_${name}_${date}.xlsx`);
    toast.success("تم تصدير التقرير بنجاح");
  };
  
  const generatePDFReport = async () => {
    setIsGenerating(true);
    try {
      const { schoolName, directorName, schoolLogo } = getSchoolInfo();
      const { className, sectionName, subjectName, teacherName } = getTestDetails();
      const stats = calculateStats();
      
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Load and embed Arabic font
      try {
        const fontBase64 = await loadAmiriFont();
        doc.addFileToVFS("Amiri-Regular.ttf", fontBase64);
        doc.addFont("Amiri-Regular.ttf", ARABIC_FONT_NAME, "normal");
        doc.setFont(ARABIC_FONT_NAME);
      } catch (fontError) {
        console.error("Failed to load Arabic font, using fallback:", fontError);
        doc.setFont("helvetica");
      }
      
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 15;
      
      // Header with Palestinian colors
      doc.setFillColor(0, 0, 0);
      doc.rect(0, 0, pageWidth, 6, 'F');
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 6, pageWidth, 6, 'F');
      doc.setFillColor(0, 128, 0);
      doc.rect(0, 12, pageWidth, 6, 'F');
      doc.setFillColor(206, 17, 38);
      doc.triangle(0, 0, 0, 18, 30, 9, 'F');
      
      let currentY = 25;
      
      // Logo
      if (schoolLogo) {
        try {
          doc.addImage(schoolLogo, 'PNG', pageWidth - margin - 25, currentY, 25, 25);
        } catch (e) {
          console.error('Error adding logo:', e);
        }
      }
      
      // School Name Header
      doc.setFontSize(18);
      doc.setTextColor(0, 0, 0);
      doc.text(schoolName, pageWidth / 2, currentY + 8, { align: 'center' });
      
      // Title
      doc.setFontSize(14);
      doc.text("تقرير نتائج الاختبار", pageWidth / 2, currentY + 18, { align: 'center' });
      
      currentY += 35;
      
      // Test Information Box
      doc.setDrawColor(0, 128, 0);
      doc.setLineWidth(1);
      doc.rect(margin, currentY, pageWidth - 2 * margin, 40, 'S');
      
      doc.setFontSize(10);
      
      const rightX = pageWidth - margin - 5;
      doc.text(`الاختبار: ${test.name}`, rightX, currentY + 8, { align: 'right' });
      doc.text(`المادة: ${subjectName}`, rightX, currentY + 16, { align: 'right' });
      doc.text(`المعلم: ${teacherName}`, rightX, currentY + 24, { align: 'right' });
      doc.text(`التاريخ: ${test.date}`, rightX, currentY + 32, { align: 'right' });
      
      doc.text(`الصف: ${className}`, margin + 65, currentY + 8);
      doc.text(`الشعبة: ${sectionName}`, margin + 65, currentY + 16);
      doc.text(`عدد الطلاب: ${stats.totalStudents}`, margin + 65, currentY + 24);
      doc.text(`الغائبون: ${stats.absentCount}`, margin + 65, currentY + 32);
      
      currentY += 47;
      
      // Statistics Summary Table
      doc.setFontSize(12);
      doc.text("ملخص الإحصائيات", pageWidth / 2, currentY, { align: 'center' });
      currentY += 5;
      
      doc.autoTable({
        startY: currentY,
        head: [['القيمة', 'البيان', 'القيمة', 'البيان']],
        body: [
          [`${stats.highestScore}%`, 'أعلى درجة', `${stats.lowestScore}%`, 'أدنى درجة'],
          [`${stats.avgScore.toFixed(1)}%`, 'متوسط الدرجات', `${stats.passRate.toFixed(1)}%`, 'نسبة النجاح'],
          [stats.passedCount, 'عدد الناجحين', stats.failedCount, 'عدد الراسبين'],
        ],
        theme: 'grid',
        styles: { 
          halign: 'center', 
          fontSize: 9,
          cellPadding: 3,
          font: ARABIC_FONT_NAME
        },
        headStyles: { 
          fillColor: [0, 128, 0], 
          textColor: [255, 255, 255],
          fontSize: 9
        },
        columnStyles: {
          1: { fontStyle: 'bold', fillColor: [240, 240, 240] },
          3: { fontStyle: 'bold', fillColor: [240, 240, 240] }
        }
      });
      
      currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : currentY + 30;
      
      // Question Pass Rates Table
      doc.setFontSize(12);
      doc.text("نسبة النجاح لكل سؤال", pageWidth / 2, currentY, { align: 'center' });
      currentY += 5;
      
      const questionPassRates = stats.questionStats.map((q: any) => [
        q.failedCount,
        q.passedCount,
        `${q.passRate.toFixed(1)}%`,
        q.avgScore.toFixed(1),
        q.maxScore,
        q.type,
        `س${q.questionNum}`
      ]);
      
      doc.autoTable({
        startY: currentY,
        head: [['راسبون', 'ناجحون', 'نسبة النجاح', 'المتوسط', 'الدرجة', 'النوع', 'السؤال']],
        body: questionPassRates,
        theme: 'grid',
        styles: { 
          halign: 'center', 
          fontSize: 8,
          cellPadding: 2,
          font: ARABIC_FONT_NAME
        },
        headStyles: { 
          fillColor: [0, 0, 0], 
          textColor: [255, 255, 255],
          fontSize: 8
        },
        didParseCell: (data: any) => {
          if (data.section === 'body' && data.column.index === 2) {
            const percentage = parseFloat(data.cell.raw);
            if (percentage < 50) {
              data.cell.styles.fillColor = [255, 200, 200];
              data.cell.styles.textColor = [150, 0, 0];
            } else {
              data.cell.styles.fillColor = [200, 255, 200];
              data.cell.styles.textColor = [0, 100, 0];
            }
          }
        }
      });
      
      currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : currentY + 30;
      
      // Results table
      if (reportType === "all" || reportType === "results") {
        if (currentY > pageHeight - 80) {
          doc.addPage();
          currentY = 20;
        }
        
        doc.setFontSize(12);
        doc.text("نتائج الطلاب", pageWidth / 2, currentY, { align: 'center' });
        currentY += 5;
        
        const resultsTableData = test.results.map((result: any, index: number) => {
          const studentName = getStudentName(result.studentId || result.student_id, result.studentName || result.students?.name);
          const isAbsent = result.isAbsent || result.is_absent;
          const percentage = result.percentage ?? 0;
          const totalScore = result.totalScore ?? result.total_score ?? 0;
          const status = isAbsent ? "غائب" : (percentage >= 50 ? "ناجح" : "راسب");
          return [
            status,
            isAbsent ? "-" : `${percentage}%`,
            isAbsent ? "-" : totalScore,
            isAbsent ? "غائب" : "حاضر",
            studentName,
            index + 1
          ];
        });
        
        doc.autoTable({
          startY: currentY,
          head: [["الحالة", "%", "المجموع", "الحضور", "اسم الطالب", "#"]],
          body: resultsTableData,
          theme: 'grid',
          styles: { 
            halign: 'center', 
            fontSize: 8,
            cellPadding: 2,
            font: ARABIC_FONT_NAME
          },
          headStyles: { 
            fillColor: [0, 0, 0], 
            textColor: [255, 255, 255],
            fontSize: 8
          },
          columnStyles: {
            0: { cellWidth: 22 },
            1: { cellWidth: 18 },
            2: { cellWidth: 18 },
            3: { cellWidth: 22 },
            4: { cellWidth: 'auto' },
            5: { cellWidth: 12 }
          },
          didParseCell: (data: any) => {
            if (data.section === 'body' && data.column.index === 0) {
              const text = data.cell.raw;
              if (text === 'ناجح') {
                data.cell.styles.fillColor = [200, 255, 200];
                data.cell.styles.textColor = [0, 100, 0];
              } else if (text === 'راسب') {
                data.cell.styles.fillColor = [255, 200, 200];
                data.cell.styles.textColor = [150, 0, 0];
              } else if (text === 'غائب') {
                data.cell.styles.fillColor = [240, 240, 240];
                data.cell.styles.textColor = [100, 100, 100];
              }
            }
          }
        });
      }
      
      // Footer on each page
      const pageCount = doc.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        doc.setDrawColor(0, 128, 0);
        doc.setLineWidth(0.5);
        doc.line(margin, pageHeight - 25, pageWidth - margin, pageHeight - 25);
        
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text(`مدير المدرسة: ${directorName}`, pageWidth - margin, pageHeight - 18, { align: 'right' });
        doc.text("نشكر ثقتكم بخدماتنا", pageWidth / 2, pageHeight - 18, { align: 'center' });
        doc.text(`${i} / ${pageCount}`, margin, pageHeight - 18);
        
        // Small Palestinian flag indicator
        doc.setFillColor(0, 0, 0);
        doc.rect(margin, pageHeight - 12, 15, 2, 'F');
        doc.setFillColor(255, 255, 255);
        doc.rect(margin, pageHeight - 10, 15, 2, 'F');
        doc.setFillColor(0, 128, 0);
        doc.rect(margin, pageHeight - 8, 15, 2, 'F');
      }
      
      doc.save(`تقرير_${test.name}_${test.date}.pdf`);
      toast.success("تم تصدير التقرير بنجاح");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("حدث خطأ أثناء إنشاء التقرير");
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <>
      <Card className="border-2 border-[#E84c3d]">
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">تصدير التقرير</h3>
            <p className="text-sm text-muted-foreground">يمكنك معاينة وتصدير التقرير بصيغة إكسل أو PDF</p>
          </div>
          
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="اختر نوع التقرير" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">تقرير كامل</SelectItem>
              <SelectItem value="results">نتائج الطلاب فقط</SelectItem>
              <SelectItem value="analysis">تحليل الأسئلة فقط</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Preview Button */}
          <Button 
            onClick={() => setShowPreview(true)}
            className="w-full bg-gradient-to-r from-[#000000] via-[#008000] to-[#CE1126] hover:opacity-90 text-white"
            variant="default"
          >
            <Eye className="ml-2 h-4 w-4" />
            معاينة التقرير
          </Button>
          
          <div className="grid grid-cols-2 gap-4">
            <Button 
              onClick={generateExcelReport}
              className="w-full bg-[#008000] hover:bg-[#006600] text-white"
            >
              <Download className="ml-2 h-4 w-4" />
              Excel
            </Button>
            
            <Button 
              onClick={generatePDFReport}
              disabled={isGenerating}
              className="w-full bg-[#E84c3d] hover:bg-[#d43d2e] text-white"
            >
              {isGenerating ? (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              ) : (
                <FileText className="ml-2 h-4 w-4" />
              )}
              PDF
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <ReportPreview 
        test={test} 
        open={showPreview} 
        onClose={() => setShowPreview(false)} 
      />
    </>
  );
};

export default ReportGenerator;
