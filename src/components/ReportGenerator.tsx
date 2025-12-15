
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

// Arabic font Base64 - Simplified approach using standard encoding
// Note: For full Arabic support, you would need to embed an Arabic font
const setupArabicSupport = (doc: jsPDF) => {
  // Use Helvetica which has basic character support
  doc.setFont("helvetica");
};

// Helper to format Arabic text for PDF display
const formatArabicForPDF = (text: string): string => {
  // Return text as-is - we'll use proper table rendering
  return text;
};

const ReportGenerator: React.FC<ReportGeneratorProps> = ({ test }) => {
  const [reportType, setReportType] = useState<string>("all");
  
  const getSchoolInfo = () => {
    const schoolName = localStorage.getItem("schoolName") || "المدرسة";
    const directorName = localStorage.getItem("directorName") || "المدير";
    const isActivated = localStorage.getItem("systemActivated") === "true";
    
    return {
      schoolName,
      directorName,
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
  
  const generateExcelReport = () => {
    // Test info
    const { name, type, date, questions, results } = test;
    const { schoolName, directorName } = getSchoolInfo();
    const { className, sectionName, subjectName, teacherName } = getTestDetails();
    
    // Create a workbook and add worksheets
    const wb = XLSX.utils.book_new();
    
    // Test info sheet
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
    
    // Results sheet
    const resultsHeaders = [
      "اسم الطالب", 
      "الحضور", 
      ...questions.map((_: any, idx: number) => `السؤال ${idx + 1}`),
      "المجموع",
      "النسبة المئوية",
      "الحالة"
    ];
    
    const resultsData = [
      resultsHeaders,
      ...results.map((result: any) => {
        const studentName = result.studentName || getStudentName(result.studentId);
        const scoreItems = questions.map((q: any) => result.isAbsent ? "غائب" : (result.scores[q.id] || 0));
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
    
    // Questions analysis sheet
    const questionsData = [
      ["رقم السؤال", "نوع السؤال", "العلامة القصوى", "متوسط العلامة", "نسبة الإجابة الصحيحة", "عدد الناجحين", "عدد الراسبين"],
      ...questions.map((question: any, idx: number) => {
        // Calculate average score for this question
        let totalScore = 0;
        let answeredCount = 0;
        let passedCount = 0;
        let failedCount = 0;
        
        results.forEach((result: any) => {
          if (!result.isAbsent) {
            const score = result.scores[question.id] || 0;
            totalScore += score;
            answeredCount++;
            
            // Consider passing if score >= 50% of max
            if (score >= question.maxScore * 0.5) {
              passedCount++;
            } else {
              failedCount++;
            }
          }
        });
        
        const avgScore = answeredCount > 0 ? totalScore / answeredCount : 0;
        const correctPercentage = (avgScore / question.maxScore) * 100;
        
        return [
          `السؤال ${idx + 1}`,
          question.type,
          question.maxScore,
          avgScore.toFixed(2),
          `${correctPercentage.toFixed(1)}%`,
          passedCount,
          failedCount
        ];
      })
    ];
    
    const questionsWs = XLSX.utils.aoa_to_sheet(questionsData);
    XLSX.utils.book_append_sheet(wb, questionsWs, "تحليل الأسئلة");

    // Statistics summary sheet
    const presentStudents = results.filter((r: any) => !r.isAbsent);
    const passedStudents = presentStudents.filter((r: any) => r.percentage >= 50);
    const failedStudents = presentStudents.filter((r: any) => r.percentage < 50);
    const absentStudents = results.filter((r: any) => r.isAbsent);
    const avgPercentage = presentStudents.length > 0 
      ? presentStudents.reduce((sum: number, r: any) => sum + r.percentage, 0) / presentStudents.length 
      : 0;
    const highestScore = presentStudents.length > 0 
      ? Math.max(...presentStudents.map((r: any) => r.percentage))
      : 0;
    const lowestScore = presentStudents.length > 0 
      ? Math.min(...presentStudents.map((r: any) => r.percentage))
      : 0;

    const statsData = [
      ["الإحصائيات العامة", ""],
      ["إجمالي الطلاب", results.length],
      ["الطلاب الحاضرين", presentStudents.length],
      ["الطلاب الغائبين", absentStudents.length],
      ["عدد الناجحين", passedStudents.length],
      ["عدد الراسبين", failedStudents.length],
      ["نسبة النجاح", `${presentStudents.length > 0 ? ((passedStudents.length / presentStudents.length) * 100).toFixed(1) : 0}%`],
      ["متوسط الدرجات", `${avgPercentage.toFixed(1)}%`],
      ["أعلى درجة", `${highestScore}%`],
      ["أدنى درجة", `${lowestScore}%`]
    ];
    
    const statsWs = XLSX.utils.aoa_to_sheet(statsData);
    XLSX.utils.book_append_sheet(wb, statsWs, "الإحصائيات");
    
    // Note at the end
    const footerWs = XLSX.utils.aoa_to_sheet([
      ["تم إنشاء هذا التقرير بواسطة نظام تحليل نتائج الاختبارات المدرسية"],
      ["مدير المدرسة: " + directorName],
      ["نشكر ثقتكم بخدماتنا"]
    ]);
    XLSX.utils.book_append_sheet(wb, footerWs, "معلومات إضافية");
    
    // Save Excel file
    XLSX.writeFile(wb, `تقرير_${name}_${date}.xlsx`);
  };
  
  const generatePDFReport = () => {
    const { schoolName, directorName } = getSchoolInfo();
    const { className, sectionName, subjectName, teacherName } = getTestDetails();
    
    // Initialize PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Setup Arabic support
    setupArabicSupport(doc);
    
    // Set page margins
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 15;
    
    // Helper function to add centered text
    const addCenteredText = (text: string, y: number, fontSize: number = 12) => {
      doc.setFontSize(fontSize);
      const textWidth = doc.getTextWidth(text);
      doc.text(text, (pageWidth - textWidth) / 2, y);
    };

    // Helper function to add right-aligned text  
    const addRightText = (text: string, y: number, fontSize: number = 12) => {
      doc.setFontSize(fontSize);
      doc.text(text, pageWidth - margin, y, { align: 'right' });
    };

    // Header with Palestinian colors
    doc.setFillColor(0, 0, 0); // Black
    doc.rect(0, 0, pageWidth, 8, 'F');
    doc.setFillColor(255, 255, 255); // White
    doc.rect(0, 8, pageWidth, 8, 'F');
    doc.setFillColor(0, 128, 0); // Green
    doc.rect(0, 16, pageWidth, 8, 'F');
    doc.setFillColor(232, 76, 61); // Red
    doc.rect(0, 24, pageWidth / 3, 8, 'F');
    
    // Title - Use symbols that work universally
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(22);
    addCenteredText("Test Results Report / تقرير نتائج الاختبار", 45);
    
    // School info box
    doc.setDrawColor(0, 128, 0);
    doc.setLineWidth(1);
    doc.rect(margin, 55, pageWidth - 2 * margin, 50, 'S');
    
    doc.setFontSize(12);
    // Use English labels with Arabic values in tables
    doc.text(`School: ${schoolName}`, pageWidth - margin, 65, { align: 'right' });
    doc.text(`Test: ${test.name}`, pageWidth - margin, 75, { align: 'right' });
    doc.text(`Subject: ${subjectName} | Teacher: ${teacherName}`, pageWidth - margin, 85, { align: 'right' });
    doc.text(`Class: ${className} - Section: ${sectionName} | Date: ${test.date}`, pageWidth - margin, 95, { align: 'right' });
    
    // Statistics summary
    const presentStudents = test.results.filter((r: any) => !r.isAbsent);
    const passedStudents = presentStudents.filter((r: any) => r.percentage >= 50);
    const failedStudents = presentStudents.filter((r: any) => r.percentage < 50 && !r.isAbsent);
    const absentStudents = test.results.filter((r: any) => r.isAbsent);
    const passRate = presentStudents.length > 0 
      ? ((passedStudents.length / presentStudents.length) * 100).toFixed(1)
      : 0;
    
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, 110, pageWidth - 2 * margin, 25, 'F');
    
    doc.setFontSize(11);
    doc.text(`Total: ${test.results.length} | Present: ${presentStudents.length} | Absent: ${absentStudents.length}`, pageWidth / 2, 120, { align: 'center' });
    doc.text(`Passed: ${passedStudents.length} | Failed: ${failedStudents.length} | Pass Rate: ${passRate}%`, pageWidth / 2, 128, { align: 'center' });
    
    // Results table
    if (reportType === "all" || reportType === "results") {
      doc.setFontSize(14);
      doc.text("Student Results", pageWidth / 2, 145, { align: 'center' });
      
      const resultsTableData = test.results.map((result: any, index: number) => {
        const studentName = result.studentName || getStudentName(result.studentId);
        const status = result.isAbsent ? "Absent" : (result.percentage >= 50 ? "Pass" : "Fail");
        return [
          status,
          result.isAbsent ? "0%" : `${result.percentage}%`,
          result.isAbsent ? "0" : result.totalScore,
          result.isAbsent ? "Absent" : "Present",
          studentName,
          index + 1
        ];
      });
      
      doc.autoTable({
        startY: 150,
        head: [["Status", "%", "Total", "Attendance", "Student Name", "#"]],
        body: resultsTableData,
        theme: 'grid',
        styles: { 
          halign: 'center', 
          fontSize: 9,
          cellPadding: 2
        },
        headStyles: { 
          fillColor: [0, 0, 0], 
          textColor: [255, 255, 255],
          halign: 'center',
          fontSize: 9
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
          // Color code the status column
          if (data.section === 'body' && data.column.index === 0) {
            if (data.cell.raw === "Pass") {
              data.cell.styles.fillColor = [200, 250, 200];
              data.cell.styles.textColor = [0, 100, 0];
            } else if (data.cell.raw === "Fail") {
              data.cell.styles.fillColor = [250, 200, 200];
              data.cell.styles.textColor = [150, 0, 0];
            } else if (data.cell.raw === "Absent") {
              data.cell.styles.fillColor = [240, 240, 240];
              data.cell.styles.textColor = [100, 100, 100];
            }
          }
        }
      });
    }
    
    // Questions analysis
    if (reportType === "all" || reportType === "analysis") {
      let startY = 150;
      
      if (doc.lastAutoTable && doc.lastAutoTable.finalY > 200) {
        doc.addPage();
        
        // Add header to new page
        doc.setFillColor(0, 0, 0);
        doc.rect(0, 0, pageWidth, 5, 'F');
        doc.setFillColor(0, 128, 0);
        doc.rect(0, 5, pageWidth, 5, 'F');
        
        startY = 20;
      } else if (reportType === "all" && doc.lastAutoTable) {
        startY = doc.lastAutoTable.finalY + 15;
      }
      
      doc.setFontSize(14);
      doc.text("Questions Analysis", pageWidth / 2, startY, { align: 'center' });
      
      const questionsData = test.questions.map((question: any, idx: number) => {
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
        
        const avgScore = answeredCount > 0 ? totalScore / answeredCount : 0;
        const correctPercentage = (avgScore / question.maxScore) * 100;
        const failedCount = answeredCount - passedCount;
        
        return [
          failedCount,
          passedCount,
          `${correctPercentage.toFixed(1)}%`,
          avgScore.toFixed(2),
          question.maxScore,
          question.type,
          `Q${idx + 1}`
        ];
      });
      
      doc.autoTable({
        startY: startY + 5,
        head: [["Fail", "Pass", "Pass %", "Avg", "Max", "Type", "Q#"]],
        body: questionsData,
        theme: 'grid',
        styles: { 
          halign: 'center', 
          fontSize: 9,
          cellPadding: 2
        },
        headStyles: { 
          fillColor: [0, 128, 0], 
          textColor: [255, 255, 255],
          halign: 'center',
          fontSize: 9
        },
        didParseCell: (data: any) => {
          // Highlight questions with low pass rate
          if (data.section === 'body' && data.column.index === 2) {
            const percentage = parseFloat(data.cell.raw);
            if (percentage < 50) {
              data.cell.styles.fillColor = [250, 200, 200];
              data.cell.styles.textColor = [150, 0, 0];
            }
          }
        }
      });
    }
    
    // Footer
    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : 200;
    
    if (finalY > pageHeight - 40) {
      doc.addPage();
    }
    
    // Footer line
    doc.setDrawColor(0, 128, 0);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 35, pageWidth - margin, pageHeight - 35);
    
    doc.setFontSize(11);
    doc.text(`Director: ${directorName}`, pageWidth - margin, pageHeight - 25, { align: 'right' });
    doc.text("Thank you for trusting our services", pageWidth / 2, pageHeight - 15, { align: 'center' });
    
    // Page numbers
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(128, 128, 128);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
    }
    
    // Save PDF
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
        
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="outline" 
            className="w-full border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
            onClick={generateExcelReport}
          >
            <FileText className="mr-2 h-4 w-4" />
            تنزيل Excel
          </Button>
          
          <Button 
            className="w-full bg-[#E84c3d] hover:bg-red-700 text-white"
            onClick={generatePDFReport}
          >
            <Download className="mr-2 h-4 w-4" />
            تنزيل PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportGenerator;
