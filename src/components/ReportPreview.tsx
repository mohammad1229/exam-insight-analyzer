import React, { useState, useEffect, useRef } from "react";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download, FileText, X, Loader2 } from "lucide-react";
import { getStudentById, getClassById, getSectionById, getSubjectById, getTeacherById } from "@/services/dataService";
import { loadAmiriFont, ARABIC_FONT_NAME } from "@/utils/fontLoader";
import { toast } from "sonner";

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable?: { finalY: number };
  }
}

interface ReportPreviewProps {
  test: any;
  open: boolean;
  onClose: () => void;
}

// Get performance levels from settings
const getPerformanceLevels = () => {
  const saved = localStorage.getItem("performanceLevels");
  if (saved) {
    const levels = JSON.parse(saved);
    return {
      excellent: { min: levels.excellent.min, label: "ممتاز", color: [34, 197, 94] },
      good: { min: levels.good.min, max: levels.excellent.min - 1, label: "جيد", color: [59, 130, 246] },
      average: { min: levels.average.min, max: levels.good.min - 1, label: "متوسط", color: [245, 158, 11] },
      low: { min: levels.low.min, max: levels.average.min - 1, label: "متدني", color: [239, 68, 68] },
      failed: { max: levels.low.min - 1, label: "راسب", color: [220, 38, 38] }
    };
  }
  return {
    excellent: { min: 85, label: "ممتاز", color: [34, 197, 94] },
    good: { min: 75, max: 84, label: "جيد", color: [59, 130, 246] },
    average: { min: 65, max: 74, label: "متوسط", color: [245, 158, 11] },
    low: { min: 50, max: 64, label: "متدني", color: [239, 68, 68] },
    failed: { max: 49, label: "راسب", color: [220, 38, 38] }
  };
};

// Get header settings
const getHeaderSettings = () => {
  const saved = localStorage.getItem("headerSettings");
  if (saved) {
    return JSON.parse(saved);
  }
  return {
    rightLine1: "دولة فلسطين",
    rightLine1En: "State of Palestine",
    rightLine2: "وزارة التربية والتعليم العالي",
    rightLine3: "مديرية التربية والتعليم",
    leftLine1: "Ministry of Education",
    leftLine2: "Directorate of Education",
    leftLine3: "",
  };
};

const ReportPreview: React.FC<ReportPreviewProps> = ({ test, open, onClose }) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const pdfDocRef = useRef<jsPDF | null>(null);

  const getSchoolInfo = () => {
    return {
      schoolName: localStorage.getItem("schoolName") || "المدرسة",
      directorName: localStorage.getItem("directorName") || "المدير",
      schoolLogo: localStorage.getItem("schoolLogo") || "",
      ministryName: localStorage.getItem("ministryName") || "وزارة التربية والتعليم العالي",
      directorateName: localStorage.getItem("directorateName") || "مديرية التربية والتعليم",
    };
  };

  const getStudentName = (studentId: string): string => {
    const student = getStudentById(studentId);
    return student?.name || studentId;
  };

  const getTestDetails = () => {
    const classInfo = getClassById(test.classId);
    const sectionInfo = getSectionById(test.classId, test.sectionId);
    const subjectInfo = getSubjectById(test.subjectId);
    const teacherInfo = getTeacherById(test.teacherId);
    return {
      className: classInfo?.name || "",
      sectionName: sectionInfo?.name || "",
      subjectName: subjectInfo?.name || "",
      teacherName: teacherInfo?.name || "",
    };
  };

  const getTestTypeLabel = (type: string): string => {
    const types: Record<string, string> = {
      exam: "امتحان رسمي",
      quiz: "اختبار قصير",
      homework: "واجب منزلي",
      worksheet: "ورقة عمل",
      manual: "إدخال يدوي"
    };
    return types[type] || type;
  };

  const calculateStats = () => {
    const levels = getPerformanceLevels();
    const presentStudents = test.results.filter((r: any) => !r.isAbsent);
    const totalMaxScore = test.questions.reduce((sum: number, q: any) => sum + q.maxScore, 0);
    
    // Dynamic performance levels calculation
    const excellentStudents = presentStudents.filter((r: any) => r.percentage >= levels.excellent.min);
    const goodStudents = presentStudents.filter((r: any) => r.percentage >= levels.good.min && r.percentage < levels.excellent.min);
    const averageStudents = presentStudents.filter((r: any) => r.percentage >= levels.average.min && r.percentage < levels.good.min);
    const lowStudents = presentStudents.filter((r: any) => r.percentage >= levels.low.min && r.percentage < levels.average.min);
    const failedStudents = presentStudents.filter((r: any) => r.percentage < levels.low.min);
    const absentStudents = test.results.filter((r: any) => r.isAbsent);

    const scores = presentStudents.map((r: any) => r.percentage);
    const totalScores = presentStudents.map((r: any) => r.totalScore);
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;
    const highestTotal = totalScores.length > 0 ? Math.max(...totalScores) : 0;
    const lowestTotal = totalScores.length > 0 ? Math.min(...totalScores) : 0;
    const avgScore = scores.length > 0 ? scores.reduce((sum: number, s: number) => sum + s, 0) / scores.length : 0;
    const avgTotal = totalScores.length > 0 ? totalScores.reduce((sum: number, s: number) => sum + s, 0) / totalScores.length : 0;
    const passRate = presentStudents.length > 0 ? ((presentStudents.length - failedStudents.length) / presentStudents.length) * 100 : 0;

    // Calculate stats for each question
    const questionStats = test.questions.map((question: any, idx: number) => {
      const questionScores: number[] = [];
      
      presentStudents.forEach((result: any) => {
        const score = result.scores[question.id] || 0;
        const percentage = (score / question.maxScore) * 100;
        questionScores.push(percentage);
      });

      const excellentCount = questionScores.filter(s => s >= 85).length;
      const goodCount = questionScores.filter(s => s >= 75 && s < 85).length;
      const averageCount = questionScores.filter(s => s >= 65 && s < 75).length;
      const lowCount = questionScores.filter(s => s >= 50 && s < 65).length;
      const failedCount = questionScores.filter(s => s < 50).length;
      
      const rawScores = presentStudents.map((r: any) => r.scores[question.id] || 0);
      const questionTotal = rawScores.reduce((a: number, b: number) => a + b, 0);
      const questionAvg = rawScores.length > 0 ? questionTotal / rawScores.length : 0;
      const questionHighest = rawScores.length > 0 ? Math.max(...rawScores) : 0;
      const questionLowest = rawScores.length > 0 ? Math.min(...rawScores) : 0;
      const questionPassRate = questionScores.length > 0 
        ? (questionScores.filter(s => s >= 50).length / questionScores.length) * 100 
        : 0;

      return {
        questionNum: idx + 1,
        type: question.type,
        maxScore: question.maxScore,
        excellentCount,
        goodCount,
        averageCount,
        lowCount,
        failedCount,
        avgScore: questionAvg,
        highestScore: questionHighest,
        lowestScore: questionLowest,
        passRate: questionPassRate,
      };
    });

    return {
      totalStudents: test.results.length,
      presentCount: presentStudents.length,
      absentCount: absentStudents.length,
      excellentCount: excellentStudents.length,
      goodCount: goodStudents.length,
      averageCount: averageStudents.length,
      lowCount: lowStudents.length,
      failedCount: failedStudents.length,
      passedCount: presentStudents.length - failedStudents.length,
      highestScore,
      lowestScore,
      highestTotal,
      lowestTotal,
      avgScore,
      avgTotal,
      passRate,
      questionStats,
      totalMaxScore,
    };
  };

  const generatePDF = async (): Promise<jsPDF> => {
    const { schoolName, directorName, ministryName, directorateName } = getSchoolInfo();
    const { className, sectionName, subjectName, teacherName } = getTestDetails();
    const stats = calculateStats();

    // Always use landscape for better fit with 50 students
    const doc = new jsPDF({ 
      orientation: "landscape", 
      unit: "mm", 
      format: "a4" 
    });

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
    const margin = 8;

    // === HEADER SECTION - Classic Frame Layout ===
    let currentY = 8;

    // Classic double-line frame border at top
    doc.setDrawColor(80, 80, 80);
    doc.setLineWidth(0.8);
    doc.rect(margin, 6, pageWidth - margin * 2, 22);
    doc.setLineWidth(0.3);
    doc.rect(margin + 1, 7, pageWidth - margin * 2 - 2, 20);

    currentY = 12;

    // Get header settings
    const headerSettings = getHeaderSettings();

    // Three-column header
    const leftCol = pageWidth - margin - 60;
    const centerCol = pageWidth / 2;
    const rightCol = margin + 60;

    // Right side - Ministry info
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(headerSettings.rightLine1, rightCol, currentY, { align: "center" });
    doc.text(headerSettings.rightLine1En, rightCol, currentY + 4, { align: "center" });
    doc.text(headerSettings.rightLine2 || ministryName, rightCol, currentY + 8, { align: "center" });
    doc.text(headerSettings.rightLine3 || directorateName, rightCol, currentY + 12, { align: "center" });

    // Center - Logo/School Name
    const schoolLogo = getSchoolInfo().schoolLogo;
    if (schoolLogo) {
      try {
        doc.addImage(schoolLogo, "PNG", centerCol - 8, currentY - 2, 16, 16);
      } catch (e) {
        // If logo fails, just show school name
      }
    }
    doc.setFontSize(10);
    doc.text(schoolName, centerCol, currentY + 14, { align: "center" });

    // Left side - English info
    doc.setFontSize(9);
    doc.text(headerSettings.leftLine1, leftCol, currentY + 4, { align: "center" });
    doc.text(headerSettings.leftLine2, leftCol, currentY + 8, { align: "center" });
    if (headerSettings.leftLine3) {
      doc.text(headerSettings.leftLine3, leftCol, currentY + 12, { align: "center" });
    }

    currentY = 32;

    // Report Title with test type
    const testTypeLabel = test.type ? ` (${getTestTypeLabel(test.type)})` : "";
    doc.setFontSize(12);
    doc.setTextColor(0, 100, 0);
    doc.text(`تحليل امتحان ${test.name}${testTypeLabel}`, centerCol, currentY, { align: "center" });
    
    currentY += 6;

    // === TEST INFO ROW ===
    doc.autoTable({
      startY: currentY,
      head: [["معلم المادة", "التاريخ", "الصف / الشعبة", "المبحث"]],
      body: [[teacherName, test.date, `${className} / ${sectionName}`, subjectName]],
      theme: "grid",
      styles: { 
        halign: "center", 
        fontSize: 8, 
        cellPadding: 1.5, 
        font: ARABIC_FONT_NAME 
      },
      headStyles: { 
        fillColor: [0, 100, 0], 
        textColor: [255, 255, 255], 
        fontSize: 8 
      },
      margin: { left: margin, right: margin },
    });

    currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 3 : currentY + 15;

    // === MAIN RESULTS TABLE - Optimized for 50 students ===
    const questionHeaders = test.questions.map((q: any) => q.type);
    const mainHeaders = ["ملاحظات", "النسبة", "المجموع", ...questionHeaders.reverse(), "اسم الطالب", "م"];

    const mainTableData = test.results.map((result: any, index: number) => {
      const studentName = result.studentName || getStudentName(result.studentId);
      
      if (result.isAbsent) {
        const emptyScores = test.questions.map(() => "-");
        return ["غائب", "-", "-", ...emptyScores.reverse(), studentName, index + 1];
      }

      const questionScores = test.questions.map((q: any) => result.scores[q.id] || 0);
      let status = "";
      if (result.percentage < 50) status = "راسب";
      else if (result.percentage < 65) status = "متدني";
      else if (result.percentage < 75) status = "متوسط";
      else if (result.percentage < 85) status = "جيد";
      else status = "ممتاز";
      
      return [
        status,
        `${result.percentage}%`,
        result.totalScore,
        ...questionScores.reverse(),
        studentName,
        index + 1
      ];
    });

    // Calculate dynamic font size based on number of students
    const studentCount = test.results.length;
    const fontSize = studentCount > 40 ? 6 : studentCount > 30 ? 7 : 8;
    const cellPadding = studentCount > 40 ? 0.8 : studentCount > 30 ? 1 : 1.5;

    doc.autoTable({
      startY: currentY,
      head: [mainHeaders],
      body: mainTableData,
      theme: "grid",
      styles: { 
        halign: "center", 
        fontSize: fontSize, 
        cellPadding: cellPadding, 
        font: ARABIC_FONT_NAME,
        lineWidth: 0.1,
      },
      headStyles: { 
        fillColor: [0, 100, 0], 
        textColor: [255, 255, 255], 
        fontSize: fontSize,
        cellPadding: 1.5,
      },
      columnStyles: {
        0: { cellWidth: 14 },
        1: { cellWidth: 12 },
        2: { cellWidth: 12 },
      },
      margin: { left: margin, right: margin },
      didParseCell: (data: any) => {
        if (data.section === "body" && data.column.index === 0) {
          const text = data.cell.raw;
          if (text === "راسب") {
            data.cell.styles.fillColor = [255, 200, 200];
            data.cell.styles.textColor = [150, 0, 0];
          } else if (text === "متدني") {
            data.cell.styles.fillColor = [255, 230, 200];
            data.cell.styles.textColor = [180, 80, 0];
          } else if (text === "متوسط") {
            data.cell.styles.fillColor = [255, 255, 200];
            data.cell.styles.textColor = [150, 120, 0];
          } else if (text === "جيد") {
            data.cell.styles.fillColor = [200, 220, 255];
            data.cell.styles.textColor = [0, 60, 150];
          } else if (text === "ممتاز") {
            data.cell.styles.fillColor = [200, 255, 200];
            data.cell.styles.textColor = [0, 100, 0];
          } else if (text === "غائب") {
            data.cell.styles.fillColor = [240, 240, 240];
            data.cell.styles.textColor = [100, 100, 100];
          }
        }
      },
    });

    currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 4 : currentY + 50;

    // === COMPACT STATISTICS SECTION - Always at Bottom ===
    // Check if we need a new page
    if (currentY > pageHeight - 50) {
      doc.addPage();
      currentY = 15;
    }

    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text("الإحصائيات", pageWidth - margin, currentY, { align: "right" });
    currentY += 3;

    // Small stats table (right side) - 60mm width
    const statsTableWidth = 55;
    const chartWidth = 90;
    const chartStartX = margin;

    // Performance levels summary table - smaller
    doc.autoTable({
      startY: currentY,
      head: [["النسبة", "العدد", "المستوى"]],
      body: [
        [`${((stats.excellentCount / stats.presentCount) * 100 || 0).toFixed(0)}%`, stats.excellentCount, "ممتاز (85%+)"],
        [`${((stats.goodCount / stats.presentCount) * 100 || 0).toFixed(0)}%`, stats.goodCount, "جيد (75-84%)"],
        [`${((stats.averageCount / stats.presentCount) * 100 || 0).toFixed(0)}%`, stats.averageCount, "متوسط (65-74%)"],
        [`${((stats.lowCount / stats.presentCount) * 100 || 0).toFixed(0)}%`, stats.lowCount, "متدني (50-64%)"],
        [`${((stats.failedCount / stats.presentCount) * 100 || 0).toFixed(0)}%`, stats.failedCount, "راسب (<50%)"],
      ],
      theme: "grid",
      styles: { 
        halign: "center", 
        fontSize: 7, 
        cellPadding: 1, 
        font: ARABIC_FONT_NAME 
      },
      headStyles: { 
        fillColor: [50, 50, 50], 
        textColor: [255, 255, 255], 
        fontSize: 7 
      },
      margin: { left: pageWidth - margin - statsTableWidth, right: margin },
      tableWidth: statsTableWidth,
      didParseCell: (data: any) => {
        if (data.section === "body") {
          const rowIndex = data.row.index;
          if (rowIndex === 0) data.cell.styles.fillColor = [200, 255, 200];
          else if (rowIndex === 1) data.cell.styles.fillColor = [200, 220, 255];
          else if (rowIndex === 2) data.cell.styles.fillColor = [255, 255, 200];
          else if (rowIndex === 3) data.cell.styles.fillColor = [255, 230, 200];
          else if (rowIndex === 4) data.cell.styles.fillColor = [255, 200, 200];
        }
      },
    });

    // Draw smaller bar chart on the left side
    const chartY = currentY;
    const chartHeight = 28;
    const barWidth = (chartWidth - 30) / 5;
    
    const levels = [
      { count: stats.excellentCount, label: "ممتاز", color: [34, 197, 94] },
      { count: stats.goodCount, label: "جيد", color: [59, 130, 246] },
      { count: stats.averageCount, label: "متوسط", color: [245, 158, 11] },
      { count: stats.lowCount, label: "متدني", color: [239, 68, 68] },
      { count: stats.failedCount, label: "راسب", color: [220, 38, 38] },
    ];

    const maxCount = Math.max(...levels.map(l => l.count), 1);

    // Chart border
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.2);
    doc.rect(chartStartX, chartY, chartWidth, chartHeight);

    // Draw bars
    levels.forEach((level, i) => {
      const barHeight = (level.count / maxCount) * (chartHeight - 8);
      const barX = chartStartX + 5 + i * (barWidth + 5);
      const barY = chartY + chartHeight - barHeight - 4;

      doc.setFillColor(level.color[0], level.color[1], level.color[2]);
      doc.rect(barX, barY, barWidth, barHeight, "F");

      // Label
      doc.setFontSize(5);
      doc.setTextColor(0, 0, 0);
      doc.text(level.label, barX + barWidth / 2, chartY + chartHeight - 1, { align: "center" });
      doc.text(String(level.count), barX + barWidth / 2, barY - 1, { align: "center" });
    });

    currentY = Math.max(
      doc.lastAutoTable ? doc.lastAutoTable.finalY : currentY,
      chartY + chartHeight
    ) + 3;

    // Removed detailed question statistics table

    // === SUMMARY BOX ===
    if (currentY > pageHeight - 25) {
      doc.addPage();
      currentY = 15;
    }

    doc.autoTable({
      startY: currentY,
      head: [["نسبة النجاح", "راسب", "ناجح", "غائب", "حاضر", "المجموع"]],
      body: [[
        `${stats.passRate.toFixed(1)}%`,
        stats.failedCount,
        stats.passedCount,
        stats.absentCount,
        stats.presentCount,
        stats.totalStudents
      ]],
      theme: "grid",
      styles: { 
        halign: "center", 
        fontSize: 8, 
        cellPadding: 1.5, 
        font: ARABIC_FONT_NAME 
      },
      headStyles: { 
        fillColor: [100, 100, 100], 
        textColor: [255, 255, 255], 
        fontSize: 8 
      },
      margin: { left: margin, right: margin },
    });

    // === FOOTER ON EACH PAGE ===
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      doc.setDrawColor(0, 100, 0);
      doc.setLineWidth(0.5);
      doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      doc.text(`مدير/ة المدرسة: ${directorName}`, pageWidth - margin, pageHeight - 7, { align: "right" });
      doc.text(`نسبة النجاح: ${stats.passRate.toFixed(1)}%`, centerCol, pageHeight - 7, { align: "center" });
      doc.text(`صفحة ${i} من ${pageCount}`, margin, pageHeight - 7);

      // Palestinian flag bar at bottom
      doc.setFillColor(0, 0, 0);
      doc.rect(0, pageHeight - 4, pageWidth, 1.3, "F");
      doc.setFillColor(255, 255, 255);
      doc.rect(0, pageHeight - 2.7, pageWidth, 1.3, "F");
      doc.setFillColor(0, 128, 0);
      doc.rect(0, pageHeight - 1.4, pageWidth, 1.4, "F");
    }

    return doc;
  };

  useEffect(() => {
    if (open && test) {
      setIsLoading(true);
      generatePDF()
        .then((doc) => {
          pdfDocRef.current = doc;
          const blob = doc.output("blob");
          const url = URL.createObjectURL(blob);
          setPdfUrl(url);
        })
        .catch((error) => {
          console.error("Error generating PDF:", error);
          toast.error("حدث خطأ في إنشاء التقرير");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }

    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [open, test]);

  const handlePrint = () => {
    if (pdfUrl) {
      const printWindow = window.open(pdfUrl, "_blank");
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    }
  };

  const handleDownload = () => {
    if (pdfDocRef.current) {
      pdfDocRef.current.save(`تقرير_${test.name}_${test.date}.pdf`);
      toast.success("تم تحميل التقرير بنجاح");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-6xl h-[95vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b bg-gradient-to-r from-[#000000] via-[#008000] to-[#CE1126]">
          <DialogTitle className="text-white flex items-center gap-2">
            <FileText className="h-5 w-5" />
            معاينة التقرير - {test?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-[#008000]" />
                <p className="text-muted-foreground">جاري إنشاء التقرير...</p>
              </div>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-full"
              title="معاينة التقرير"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">لا يمكن عرض التقرير</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t flex justify-between items-center bg-muted/30">
          <Button variant="outline" onClick={onClose}>
            <X className="ml-2 h-4 w-4" />
            إغلاق
          </Button>
          <div className="flex gap-2">
            <Button onClick={handlePrint} disabled={!pdfUrl}>
              <Printer className="ml-2 h-4 w-4" />
              طباعة
            </Button>
            <Button onClick={handleDownload} disabled={!pdfUrl} className="bg-[#008000] hover:bg-[#006000]">
              <Download className="ml-2 h-4 w-4" />
              تحميل PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportPreview;
