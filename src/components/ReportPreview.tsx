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

  const calculateStats = () => {
    const presentStudents = test.results.filter((r: any) => !r.isAbsent);
    const passedStudents = presentStudents.filter((r: any) => r.percentage >= 50);
    const failedStudents = presentStudents.filter((r: any) => r.percentage < 50);
    const absentStudents = test.results.filter((r: any) => r.isAbsent);

    const scores = presentStudents.map((r: any) => r.percentage);
    const totalScores = presentStudents.map((r: any) => r.totalScore);
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;
    const highestTotal = totalScores.length > 0 ? Math.max(...totalScores) : 0;
    const lowestTotal = totalScores.length > 0 ? Math.min(...totalScores) : 0;
    const avgScore = scores.length > 0 ? scores.reduce((sum: number, s: number) => sum + s, 0) / scores.length : 0;
    const avgTotal = totalScores.length > 0 ? totalScores.reduce((sum: number, s: number) => sum + s, 0) / totalScores.length : 0;
    const passRate = presentStudents.length > 0 ? (passedStudents.length / presentStudents.length) * 100 : 0;

    // Calculate stats for each question
    const questionStats = test.questions.map((question: any, idx: number) => {
      const questionScores: number[] = [];
      
      presentStudents.forEach((result: any) => {
        const score = result.scores[question.id] || 0;
        questionScores.push(score);
      });

      const maxScore = question.maxScore;
      const highLevel = questionScores.filter(s => s >= maxScore * 0.75).length;
      const mediumLevel = questionScores.filter(s => s >= maxScore * 0.5 && s < maxScore * 0.75).length;
      const lowLevel = questionScores.filter(s => s < maxScore * 0.5).length;
      const questionTotal = questionScores.reduce((a, b) => a + b, 0);
      const questionAvg = questionScores.length > 0 ? questionTotal / questionScores.length : 0;
      const questionHighest = questionScores.length > 0 ? Math.max(...questionScores) : 0;
      const questionLowest = questionScores.length > 0 ? Math.min(...questionScores) : 0;
      const questionPassRate = questionScores.length > 0 
        ? (questionScores.filter(s => s >= maxScore * 0.5).length / questionScores.length) * 100 
        : 0;

      return {
        questionNum: idx + 1,
        type: question.type,
        maxScore: question.maxScore,
        highLevel,
        mediumLevel,
        lowLevel,
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
      passedCount: passedStudents.length,
      failedCount: failedStudents.length,
      highestScore,
      lowestScore,
      highestTotal,
      lowestTotal,
      avgScore,
      avgTotal,
      passRate,
      questionStats,
    };
  };

  const generatePDF = async (): Promise<jsPDF> => {
    const { schoolName, directorName, ministryName, directorateName } = getSchoolInfo();
    const { className, sectionName, subjectName, teacherName } = getTestDetails();
    const stats = calculateStats();
    const totalMaxScore = test.questions.reduce((sum: number, q: any) => sum + q.maxScore, 0);

    // Use landscape for many questions
    const isLandscape = test.questions.length > 4;
    const doc = new jsPDF({ 
      orientation: isLandscape ? "landscape" : "portrait", 
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
    const margin = 10;

    // === HEADER SECTION ===
    let currentY = 8;

    // Palestinian colors bar at top
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, pageWidth, 2, "F");
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 2, pageWidth, 2, "F");
    doc.setFillColor(0, 128, 0);
    doc.rect(0, 4, pageWidth, 2, "F");

    currentY = 12;

    // Government header
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text("دولة فلسطين", pageWidth / 2, currentY, { align: "center" });
    currentY += 5;
    doc.text("State of Palestine", pageWidth / 2, currentY, { align: "center" });
    currentY += 5;
    doc.setFontSize(10);
    doc.text(ministryName, pageWidth / 2, currentY, { align: "center" });
    currentY += 4;
    doc.text("Ministry of Education", pageWidth / 2, currentY, { align: "center" });
    currentY += 5;
    doc.text(directorateName, pageWidth / 2, currentY, { align: "center" });
    currentY += 5;
    doc.setFontSize(12);
    doc.text(schoolName, pageWidth / 2, currentY, { align: "center" });

    currentY += 8;

    // Report Title
    doc.setFontSize(14);
    doc.setTextColor(0, 100, 0);
    doc.text(`تحليل امتحان ${test.name}`, pageWidth / 2, currentY, { align: "center" });
    
    currentY += 8;

    // === TEST INFO ROW ===
    doc.autoTable({
      startY: currentY,
      head: [["معلم المادة", "التاريخ", "الصف / الشعبة", "المبحث"]],
      body: [[teacherName, test.date, `${className} / ${sectionName}`, subjectName]],
      theme: "grid",
      styles: { 
        halign: "center", 
        fontSize: 9, 
        cellPadding: 2, 
        font: ARABIC_FONT_NAME 
      },
      headStyles: { 
        fillColor: [0, 100, 0], 
        textColor: [255, 255, 255], 
        fontSize: 9 
      },
      margin: { left: margin, right: margin },
    });

    currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 5 : currentY + 20;

    // === MAIN RESULTS TABLE ===
    // Build dynamic headers: الرقم، اسم الطالب، [أسئلة]، المجموع، النسبة، ملاحظات
    const questionHeaders = test.questions.map((q: any) => q.type);
    const mainHeaders = ["ملاحظات", "النسبة", "المجموع", ...questionHeaders.reverse(), "اسم الطالب", "م"];

    // Build data rows
    const mainTableData = test.results.map((result: any, index: number) => {
      const studentName = result.studentName || getStudentName(result.studentId);
      
      if (result.isAbsent) {
        const emptyScores = test.questions.map(() => "-");
        return [
          "غائب",
          "-",
          "-",
          ...emptyScores.reverse(),
          studentName,
          index + 1
        ];
      }

      const questionScores = test.questions.map((q: any) => result.scores[q.id] || 0);
      const status = result.percentage >= 50 ? "" : "راسب";
      
      return [
        status,
        `${result.percentage}%`,
        result.totalScore,
        ...questionScores.reverse(),
        studentName,
        index + 1
      ];
    });

    doc.autoTable({
      startY: currentY,
      head: [mainHeaders],
      body: mainTableData,
      theme: "grid",
      styles: { 
        halign: "center", 
        fontSize: 8, 
        cellPadding: 1.5, 
        font: ARABIC_FONT_NAME,
        lineWidth: 0.1,
      },
      headStyles: { 
        fillColor: [0, 100, 0], 
        textColor: [255, 255, 255], 
        fontSize: 8,
        cellPadding: 2,
      },
      columnStyles: {
        0: { cellWidth: 18 }, // ملاحظات
        1: { cellWidth: 14 }, // النسبة
        2: { cellWidth: 14 }, // المجموع
      },
      margin: { left: margin, right: margin },
      didParseCell: (data: any) => {
        // Color code failing students
        if (data.section === "body" && data.column.index === 0) {
          const text = data.cell.raw;
          if (text === "راسب") {
            data.cell.styles.fillColor = [255, 200, 200];
            data.cell.styles.textColor = [150, 0, 0];
          } else if (text === "غائب") {
            data.cell.styles.fillColor = [240, 240, 240];
            data.cell.styles.textColor = [100, 100, 100];
          }
        }
      },
    });

    currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 5 : currentY + 50;

    // === STATISTICS TABLE ===
    // Check if we need a new page
    if (currentY > pageHeight - 80) {
      doc.addPage();
      currentY = 15;
    }

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text("الإحصائيات التفصيلية", pageWidth / 2, currentY, { align: "center" });
    currentY += 5;

    // Build stats headers matching questions
    const statsHeaders = ["المجموع", ...test.questions.map((q: any) => q.type).reverse(), "البيان"];
    
    // Calculate totals for statistics
    const totalHighLevel = stats.questionStats.reduce((sum: number, q: any) => sum + q.highLevel, 0);
    const totalMediumLevel = stats.questionStats.reduce((sum: number, q: any) => sum + q.mediumLevel, 0);
    const totalLowLevel = stats.questionStats.reduce((sum: number, q: any) => sum + q.lowLevel, 0);

    const statsData = [
      // Max scores row
      [totalMaxScore, ...test.questions.map((q: any) => q.maxScore).reverse(), "الدرجة العظمى"],
      // High level
      [totalHighLevel, ...stats.questionStats.map((q: any) => q.highLevel).reverse(), "مستوى عالي (75%+)"],
      // Medium level
      [totalMediumLevel, ...stats.questionStats.map((q: any) => q.mediumLevel).reverse(), "مستوى متوسط (50-74%)"],
      // Low level
      [totalLowLevel, ...stats.questionStats.map((q: any) => q.lowLevel).reverse(), "مستوى متدني (<50%)"],
      // Average
      [stats.avgTotal.toFixed(1), ...stats.questionStats.map((q: any) => q.avgScore.toFixed(1)).reverse(), "المتوسط"],
      // Highest
      [stats.highestTotal, ...stats.questionStats.map((q: any) => q.highestScore).reverse(), "أعلى علامة"],
      // Lowest
      [stats.lowestTotal, ...stats.questionStats.map((q: any) => q.lowestScore).reverse(), "أدنى علامة"],
      // Pass rate
      [`${stats.passRate.toFixed(1)}%`, ...stats.questionStats.map((q: any) => `${q.passRate.toFixed(0)}%`).reverse(), "نسبة النجاح"],
    ];

    doc.autoTable({
      startY: currentY,
      head: [statsHeaders],
      body: statsData,
      theme: "grid",
      styles: { 
        halign: "center", 
        fontSize: 8, 
        cellPadding: 1.5, 
        font: ARABIC_FONT_NAME 
      },
      headStyles: { 
        fillColor: [0, 0, 0], 
        textColor: [255, 255, 255], 
        fontSize: 8 
      },
      margin: { left: margin, right: margin },
      didParseCell: (data: any) => {
        // Color code levels
        if (data.section === "body") {
          const rowIndex = data.row.index;
          if (rowIndex === 1) { // High level - green
            data.cell.styles.fillColor = [200, 255, 200];
          } else if (rowIndex === 2) { // Medium level - yellow
            data.cell.styles.fillColor = [255, 255, 200];
          } else if (rowIndex === 3) { // Low level - red
            data.cell.styles.fillColor = [255, 200, 200];
          }
        }
      },
    });

    currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 5 : currentY + 40;

    // === SUMMARY BOX ===
    if (currentY > pageHeight - 40) {
      doc.addPage();
      currentY = 15;
    }

    doc.autoTable({
      startY: currentY,
      head: [["نسبة النجاح العامة", "عدد الراسبين", "عدد الناجحين", "عدد الغائبين", "عدد الحاضرين", "عدد الطلاب"]],
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
        fontSize: 9, 
        cellPadding: 2, 
        font: ARABIC_FONT_NAME 
      },
      headStyles: { 
        fillColor: [100, 100, 100], 
        textColor: [255, 255, 255], 
        fontSize: 9 
      },
      margin: { left: margin, right: margin },
    });

    // === FOOTER ON EACH PAGE ===
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Footer line
      doc.setDrawColor(0, 100, 0);
      doc.setLineWidth(0.5);
      doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);

      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text(`مدير/ة المدرسة: ${directorName}`, pageWidth - margin, pageHeight - 12, { align: "right" });
      doc.text(`نسبة النجاح العامة: ${stats.passRate.toFixed(1)}%`, pageWidth / 2, pageHeight - 12, { align: "center" });
      doc.text(`صفحة ${i} من ${pageCount}`, margin, pageHeight - 12);

      // Palestinian flag bar at bottom
      doc.setFillColor(0, 0, 0);
      doc.rect(0, pageHeight - 6, pageWidth, 2, "F");
      doc.setFillColor(255, 255, 255);
      doc.rect(0, pageHeight - 4, pageWidth, 2, "F");
      doc.setFillColor(0, 128, 0);
      doc.rect(0, pageHeight - 2, pageWidth, 2, "F");
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
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 gap-0">
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
            <iframe src={pdfUrl} className="w-full h-full border-0" title="PDF Preview" />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">لا يوجد معاينة متاحة</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-muted/30 flex justify-between items-center gap-4">
          <Button variant="outline" onClick={onClose} className="gap-2">
            <X className="h-4 w-4" />
            إغلاق
          </Button>

          <div className="flex gap-2">
            <Button onClick={handlePrint} disabled={isLoading || !pdfUrl} className="gap-2 bg-[#008000] hover:bg-[#006600]">
              <Printer className="h-4 w-4" />
              طباعة
            </Button>
            <Button onClick={handleDownload} disabled={isLoading || !pdfUrl} className="gap-2 bg-[#CE1126] hover:bg-[#a80d1e]">
              <Download className="h-4 w-4" />
              تحميل PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportPreview;
