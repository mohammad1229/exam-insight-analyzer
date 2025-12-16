
import React, { useState } from "react";
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
import { Download, FileText } from "lucide-react";
import { getStudentById, getClassById, getSectionById, getSubjectById, getTeacherById } from "@/services/dataService";
import { processArabicText, containsArabic } from "@/utils/arabicPdfUtils";

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

const ReportGenerator: React.FC<ReportGeneratorProps> = ({ test }) => {
  const [reportType, setReportType] = useState<string>("all");
  
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
      teacherName: teacherInfo?.name || ""
    };
  };

  // Helper to format text for PDF (Arabic or English)
  const formatText = (text: string): string => {
    if (containsArabic(text)) {
      return processArabicText(text);
    }
    return text;
  };

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
        const studentName = result.studentName || getStudentName(result.studentId);
        const scoreItems = questions.map((q: any) => result.isAbsent ? "-" : (result.scores[q.id] || 0));
        const status = result.isAbsent ? "غائب" : (result.percentage >= 50 ? "ناجح" : "راسب");
        
        return [
          studentName,
          result.isAbsent ? "غائب" : "حاضر",
          ...scoreItems,
          result.isAbsent ? "0" : result.totalScore,
          result.isAbsent ? "0%" : `${result.percentage}%`,
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
  };
  
  const generatePDFReport = () => {
    const { schoolName, directorName, schoolLogo } = getSchoolInfo();
    const { className, sectionName, subjectName, teacherName } = getTestDetails();
    const stats = calculateStats();
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 15;
    
    // Header with Palestinian colors
    doc.setFillColor(0, 0, 0); // Black
    doc.rect(0, 0, pageWidth, 6, 'F');
    doc.setFillColor(255, 255, 255); // White
    doc.rect(0, 6, pageWidth, 6, 'F');
    doc.setFillColor(0, 128, 0); // Green
    doc.rect(0, 12, pageWidth, 6, 'F');
    doc.setFillColor(206, 17, 38); // Red triangle
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
    
    // School Name Header (Arabic formatted)
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text(formatText(schoolName), pageWidth / 2, currentY + 8, { align: 'center' });
    
    // Title
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text(formatText("تقرير نتائج الاختبار"), pageWidth / 2, currentY + 18, { align: 'center' });
    
    currentY += 35;
    
    // Test Information Box
    doc.setDrawColor(0, 128, 0);
    doc.setLineWidth(1);
    doc.rect(margin, currentY, pageWidth - 2 * margin, 40, 'S');
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    
    // Right-aligned info (Arabic style)
    const rightX = pageWidth - margin - 5;
    doc.text(formatText(`الاختبار: ${test.name}`), rightX, currentY + 8, { align: 'right' });
    doc.text(formatText(`المادة: ${subjectName}`), rightX, currentY + 16, { align: 'right' });
    doc.text(formatText(`المعلم: ${teacherName}`), rightX, currentY + 24, { align: 'right' });
    doc.text(formatText(`التاريخ: ${test.date}`), rightX, currentY + 32, { align: 'right' });
    
    // Left column
    const leftX = margin + 5;
    doc.text(formatText(`الصف: ${className}`), leftX + 60, currentY + 8);
    doc.text(formatText(`الشعبة: ${sectionName}`), leftX + 60, currentY + 16);
    doc.text(formatText(`عدد الطلاب: ${stats.totalStudents}`), leftX + 60, currentY + 24);
    doc.text(formatText(`الغائبون: ${stats.absentCount}`), leftX + 60, currentY + 32);
    
    currentY += 47;
    
    // Statistics Summary Table
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(formatText("ملخص الإحصائيات"), pageWidth / 2, currentY, { align: 'center' });
    currentY += 5;
    
    doc.autoTable({
      startY: currentY,
      head: [[
        formatText('القيمة'), formatText('البيان'), 
        formatText('القيمة'), formatText('البيان')
      ]],
      body: [
        [
          `${stats.highestScore}%`, formatText('أعلى درجة'),
          `${stats.lowestScore}%`, formatText('أدنى درجة')
        ],
        [
          `${stats.avgScore.toFixed(1)}%`, formatText('متوسط الدرجات'),
          `${stats.passRate.toFixed(1)}%`, formatText('نسبة النجاح')
        ],
        [
          stats.passedCount, formatText('عدد الناجحين'),
          stats.failedCount, formatText('عدد الراسبين')
        ],
      ],
      theme: 'grid',
      styles: { 
        halign: 'center', 
        fontSize: 9,
        cellPadding: 3
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
    doc.setFont("helvetica", "bold");
    doc.text(formatText("نسبة النجاح لكل سؤال"), pageWidth / 2, currentY, { align: 'center' });
    currentY += 5;
    
    const questionPassRates = stats.questionStats.map((q: any) => [
      q.failedCount,
      q.passedCount,
      `${q.passRate.toFixed(1)}%`,
      q.avgScore.toFixed(1),
      q.maxScore,
      q.type,
      formatText(`س${q.questionNum}`)
    ]);
    
    doc.autoTable({
      startY: currentY,
      head: [[
        formatText('راسبون'), formatText('ناجحون'), formatText('نسبة النجاح'),
        formatText('المتوسط'), formatText('الدرجة'), formatText('النوع'), formatText('السؤال')
      ]],
      body: questionPassRates,
      theme: 'grid',
      styles: { 
        halign: 'center', 
        fontSize: 8,
        cellPadding: 2
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
      doc.setFont("helvetica", "bold");
      doc.text(formatText("نتائج الطلاب"), pageWidth / 2, currentY, { align: 'center' });
      currentY += 5;
      
      const resultsTableData = test.results.map((result: any, index: number) => {
        const studentName = result.studentName || getStudentName(result.studentId);
        const status = result.isAbsent 
          ? formatText("غائب") 
          : (result.percentage >= 50 ? formatText("ناجح") : formatText("راسب"));
        return [
          status,
          result.isAbsent ? "-" : `${result.percentage}%`,
          result.isAbsent ? "-" : result.totalScore,
          result.isAbsent ? formatText("غائب") : formatText("حاضر"),
          formatText(studentName),
          index + 1
        ];
      });
      
      doc.autoTable({
        startY: currentY,
        head: [[
          formatText("الحالة"), "%", formatText("المجموع"), 
          formatText("الحضور"), formatText("اسم الطالب"), "#"
        ]],
        body: resultsTableData,
        theme: 'grid',
        styles: { 
          halign: 'center', 
          fontSize: 8,
          cellPadding: 2
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
            if (text.includes('ناجح') || text.includes('جحان')) {
              data.cell.styles.fillColor = [200, 255, 200];
              data.cell.styles.textColor = [0, 100, 0];
            } else if (text.includes('راسب') || text.includes('بسار')) {
              data.cell.styles.fillColor = [255, 200, 200];
              data.cell.styles.textColor = [150, 0, 0];
            } else if (text.includes('غائب') || text.includes('بئاغ')) {
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
      
      // Footer line
      doc.setDrawColor(0, 128, 0);
      doc.setLineWidth(0.5);
      doc.line(margin, pageHeight - 25, pageWidth - margin, pageHeight - 25);
      
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.setFont("helvetica", "normal");
      doc.text(formatText(`مدير المدرسة: ${directorName}`), pageWidth - margin, pageHeight - 18, { align: 'right' });
      doc.text(formatText("نشكر ثقتكم بخدماتنا"), pageWidth / 2, pageHeight - 18, { align: 'center' });
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
  };
  
  return (
    <Card className="border-2 border-[#E84c3d]">
      <CardContent className="pt-6 space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">تصدير التقرير</h3>
          <p className="text-sm text-muted-foreground">يمكنك تصدير التقرير بصيغة إكسل أو PDF</p>
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
            className="w-full bg-[#E84c3d] hover:bg-[#d43d2e] text-white"
          >
            <FileText className="ml-2 h-4 w-4" />
            PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportGenerator;
