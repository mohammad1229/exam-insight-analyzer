import React, { useState, useEffect, useRef } from "react";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
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
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;
    const avgScore = scores.length > 0 ? scores.reduce((sum: number, s: number) => sum + s, 0) / scores.length : 0;
    const passRate = presentStudents.length > 0 ? (passedStudents.length / presentStudents.length) * 100 : 0;

    const questionStats = test.questions.map((question: any, idx: number) => {
      let totalScore = 0;
      let answeredCount = 0;
      let passedCount = 0;

      test.results.forEach((result: any) => {
        if (!result.isAbsent) {
          const score = result.scores[question.id] || 0;
          totalScore += score;
          answeredCount++;
          if (score >= question.maxScore * 0.5) passedCount++;
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
        failedCount: answeredCount - passedCount,
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
      questionStats,
    };
  };

  const generatePDF = async (): Promise<jsPDF> => {
    const { schoolName, directorName, schoolLogo } = getSchoolInfo();
    const { className, sectionName, subjectName, teacherName } = getTestDetails();
    const stats = calculateStats();

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    // Load and embed Arabic font
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
    const margin = 15;

    // Palestinian flag header
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, pageWidth, 6, "F");
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 6, pageWidth, 6, "F");
    doc.setFillColor(0, 128, 0);
    doc.rect(0, 12, pageWidth, 6, "F");
    doc.setFillColor(206, 17, 38);
    doc.triangle(0, 0, 0, 18, 30, 9, "F");

    let currentY = 25;

    // Logo
    if (schoolLogo) {
      try {
        doc.addImage(schoolLogo, "PNG", pageWidth - margin - 25, currentY, 25, 25);
      } catch (e) {
        console.error("Error adding logo:", e);
      }
    }

    // School Name
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text(schoolName, pageWidth / 2, currentY + 8, { align: "center" });

    // Title
    doc.setFontSize(14);
    doc.text("تقرير نتائج الاختبار", pageWidth / 2, currentY + 18, { align: "center" });

    currentY += 35;

    // Test Info Box
    doc.setDrawColor(0, 128, 0);
    doc.setLineWidth(1);
    doc.rect(margin, currentY, pageWidth - 2 * margin, 40, "S");

    doc.setFontSize(10);
    const rightX = pageWidth - margin - 5;

    doc.text(`الاختبار: ${test.name}`, rightX, currentY + 8, { align: "right" });
    doc.text(`المادة: ${subjectName}`, rightX, currentY + 16, { align: "right" });
    doc.text(`المعلم: ${teacherName}`, rightX, currentY + 24, { align: "right" });
    doc.text(`التاريخ: ${test.date}`, rightX, currentY + 32, { align: "right" });

    doc.text(`الصف: ${className}`, margin + 65, currentY + 8);
    doc.text(`الشعبة: ${sectionName}`, margin + 65, currentY + 16);
    doc.text(`عدد الطلاب: ${stats.totalStudents}`, margin + 65, currentY + 24);
    doc.text(`الغائبون: ${stats.absentCount}`, margin + 65, currentY + 32);

    currentY += 47;

    // Statistics Summary
    doc.setFontSize(12);
    doc.text("ملخص الإحصائيات", pageWidth / 2, currentY, { align: "center" });
    currentY += 5;

    doc.autoTable({
      startY: currentY,
      head: [["القيمة", "البيان", "القيمة", "البيان"]],
      body: [
        [`${stats.highestScore}%`, "أعلى درجة", `${stats.lowestScore}%`, "أدنى درجة"],
        [`${stats.avgScore.toFixed(1)}%`, "متوسط الدرجات", `${stats.passRate.toFixed(1)}%`, "نسبة النجاح"],
        [stats.passedCount, "عدد الناجحين", stats.failedCount, "عدد الراسبين"],
      ],
      theme: "grid",
      styles: { halign: "center", fontSize: 9, cellPadding: 3, font: ARABIC_FONT_NAME },
      headStyles: { fillColor: [0, 128, 0], textColor: [255, 255, 255], fontSize: 9 },
      columnStyles: { 1: { fontStyle: "bold", fillColor: [240, 240, 240] }, 3: { fontStyle: "bold", fillColor: [240, 240, 240] } },
    });

    currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : currentY + 30;

    // Question Analysis
    doc.setFontSize(12);
    doc.text("نسبة النجاح لكل سؤال", pageWidth / 2, currentY, { align: "center" });
    currentY += 5;

    const questionPassRates = stats.questionStats.map((q: any) => [
      q.failedCount,
      q.passedCount,
      `${q.passRate.toFixed(1)}%`,
      q.avgScore.toFixed(1),
      q.maxScore,
      q.type,
      `س${q.questionNum}`,
    ]);

    doc.autoTable({
      startY: currentY,
      head: [["راسبون", "ناجحون", "نسبة النجاح", "المتوسط", "الدرجة", "النوع", "السؤال"]],
      body: questionPassRates,
      theme: "grid",
      styles: { halign: "center", fontSize: 8, cellPadding: 2, font: ARABIC_FONT_NAME },
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontSize: 8 },
      didParseCell: (data: any) => {
        if (data.section === "body" && data.column.index === 2) {
          const percentage = parseFloat(data.cell.raw);
          if (percentage < 50) {
            data.cell.styles.fillColor = [255, 200, 200];
            data.cell.styles.textColor = [150, 0, 0];
          } else {
            data.cell.styles.fillColor = [200, 255, 200];
            data.cell.styles.textColor = [0, 100, 0];
          }
        }
      },
    });

    currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : currentY + 30;

    // Student Results
    if (currentY > pageHeight - 80) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(12);
    doc.text("نتائج الطلاب", pageWidth / 2, currentY, { align: "center" });
    currentY += 5;

    const resultsTableData = test.results.map((result: any, index: number) => {
      const studentName = result.studentName || getStudentName(result.studentId);
      const status = result.isAbsent ? "غائب" : result.percentage >= 50 ? "ناجح" : "راسب";
      return [
        status,
        result.isAbsent ? "-" : `${result.percentage}%`,
        result.isAbsent ? "-" : result.totalScore,
        result.isAbsent ? "غائب" : "حاضر",
        studentName,
        index + 1,
      ];
    });

    doc.autoTable({
      startY: currentY,
      head: [["الحالة", "%", "المجموع", "الحضور", "اسم الطالب", "#"]],
      body: resultsTableData,
      theme: "grid",
      styles: { halign: "center", fontSize: 8, cellPadding: 2, font: ARABIC_FONT_NAME },
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontSize: 8 },
      columnStyles: { 0: { cellWidth: 22 }, 1: { cellWidth: 18 }, 2: { cellWidth: 18 }, 3: { cellWidth: 22 }, 4: { cellWidth: "auto" }, 5: { cellWidth: 12 } },
      didParseCell: (data: any) => {
        if (data.section === "body" && data.column.index === 0) {
          const text = data.cell.raw;
          if (text === "ناجح") {
            data.cell.styles.fillColor = [200, 255, 200];
            data.cell.styles.textColor = [0, 100, 0];
          } else if (text === "راسب") {
            data.cell.styles.fillColor = [255, 200, 200];
            data.cell.styles.textColor = [150, 0, 0];
          } else if (text === "غائب") {
            data.cell.styles.fillColor = [240, 240, 240];
            data.cell.styles.textColor = [100, 100, 100];
          }
        }
      },
    });

    // Footer on each page
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(0, 128, 0);
      doc.setLineWidth(0.5);
      doc.line(margin, pageHeight - 25, pageWidth - margin, pageHeight - 25);

      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text(`مدير المدرسة: ${directorName}`, pageWidth - margin, pageHeight - 18, { align: "right" });
      doc.text("نشكر ثقتكم بخدماتنا", pageWidth / 2, pageHeight - 18, { align: "center" });
      doc.text(`${i} / ${pageCount}`, margin, pageHeight - 18);

      // Small Palestinian flag
      doc.setFillColor(0, 0, 0);
      doc.rect(margin, pageHeight - 12, 15, 2, "F");
      doc.setFillColor(255, 255, 255);
      doc.rect(margin, pageHeight - 10, 15, 2, "F");
      doc.setFillColor(0, 128, 0);
      doc.rect(margin, pageHeight - 8, 15, 2, "F");
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
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
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
