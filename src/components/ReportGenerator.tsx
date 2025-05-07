
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

// Add the required typings for jsPDF with autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable?: {
      finalY: number;
    };
    internal: {
      events: any;
      scaleFactor: number;
      pageSize: { 
        width: number; 
        getWidth: () => number; 
        height: number; 
        getHeight: () => number; 
      };
      pages: number[];
      getNumberOfPages: () => number;
      getEncryptor(objectId: number): (data: string) => string;
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
    const isActivated = localStorage.getItem("systemActivated") === "true";
    
    return {
      schoolName,
      directorName,
      isActivated
    };
  };
  
  const generateExcelReport = () => {
    // Test info
    const { name, type, date, questions, results } = test;
    const { schoolName, directorName } = getSchoolInfo();
    
    // Create a workbook and add worksheets
    const wb = XLSX.utils.book_new();
    
    // Test info sheet
    const testInfoData = [
      ["اسم المدرسة", schoolName],
      ["اسم الاختبار", name],
      ["نوع الاختبار", type],
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
      "النسبة المئوية"
    ];
    
    const resultsData = [
      resultsHeaders,
      ...results.map((result: any) => {
        const student = result.studentId;
        const scoreItems = questions.map((q: any) => result.isAbsent ? "غائب" : (result.scores[q.id] || 0));
        
        return [
          student,
          result.isAbsent ? "غائب" : "حاضر",
          ...scoreItems,
          result.isAbsent ? "0" : result.totalScore,
          result.isAbsent ? "0%" : `${result.percentage}%`
        ];
      })
    ];
    
    const resultsWs = XLSX.utils.aoa_to_sheet(resultsData);
    XLSX.utils.book_append_sheet(wb, resultsWs, "نتائج الطلاب");
    
    // Questions analysis sheet
    const questionsData = [
      ["رقم السؤال", "نوع السؤال", "العلامة القصوى", "متوسط العلامة", "نسبة الإجابة الصحيحة"],
      ...questions.map((question: any, idx: number) => {
        // Calculate average score for this question
        let totalScore = 0;
        let answeredCount = 0;
        
        results.forEach((result: any) => {
          if (!result.isAbsent) {
            totalScore += result.scores[question.id] || 0;
            answeredCount++;
          }
        });
        
        const avgScore = answeredCount > 0 ? totalScore / answeredCount : 0;
        const correctPercentage = (avgScore / question.maxScore) * 100;
        
        return [
          `السؤال ${idx + 1}`,
          question.type,
          question.maxScore,
          avgScore.toFixed(2),
          `${correctPercentage.toFixed(1)}%`
        ];
      })
    ];
    
    const questionsWs = XLSX.utils.aoa_to_sheet(questionsData);
    XLSX.utils.book_append_sheet(wb, questionsWs, "تحليل الأسئلة");
    
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
    // Initialize PDF document
    const doc = new jsPDF();
    const { schoolName, directorName } = getSchoolInfo();
    
    // Add Arabic font
    doc.addFont("https://cdn.jsdelivr.net/npm/noto-naskh-arabic-ui@0.4.0/noto-naskh-arabic-ui-regular.js", "NotoNaskhArabic", "normal");
    doc.setFont("NotoNaskhArabic");
    
    // RTL support
    doc.setR2L(true);
    
    // Title
    doc.setFontSize(24);
    doc.text("تقرير نتائج الاختبار", doc.internal.pageSize.width / 2, 20, { align: "center" });
    
    // School info
    doc.setFontSize(14);
    doc.text(`اسم المدرسة: ${schoolName}`, 20, 30);
    
    // Test info
    doc.setFontSize(12);
    doc.text(`اسم الاختبار: ${test.name}`, 20, 40);
    doc.text(`نوع الاختبار: ${test.type}`, 20, 50);
    doc.text(`التاريخ: ${test.date}`, 20, 60);
    doc.text(`عدد الأسئلة: ${test.questions.length}`, 20, 70);
    doc.text(`عدد الطلاب: ${test.results.length}`, 20, 80);
    
    // Results table
    if (reportType === "all" || reportType === "results") {
      doc.setFontSize(16);
      doc.text("نتائج الطلاب", doc.internal.pageSize.width / 2, 100, { align: "center" });
      
      const resultsTableData = test.results.map((result: any) => {
        const student = result.studentId;
        return [
          student,
          result.isAbsent ? "غائب" : "حاضر",
          result.isAbsent ? "0" : result.totalScore,
          result.isAbsent ? "0%" : `${result.percentage}%`
        ];
      });
      
      doc.autoTable({
        startY: 110,
        head: [["اسم الطالب", "الحضور", "المجموع", "النسبة المئوية"]],
        body: resultsTableData,
        theme: 'grid',
        styles: { font: "NotoNaskhArabic", halign: 'right', fontSize: 10 },
        headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] }
      });
    }
    
    // Questions analysis
    if (reportType === "all" || reportType === "analysis") {
      // Add new page if needed
      let startY = 110;
      
      if (doc.lastAutoTable && doc.lastAutoTable.finalY > 220) {
        doc.addPage();
        startY = 20;
      } else if (reportType === "all" && doc.lastAutoTable) {
        doc.text("تحليل الأسئلة", doc.internal.pageSize.width / 2, doc.lastAutoTable.finalY + 20, { align: "center" });
        startY = doc.lastAutoTable.finalY + 30;
      } else if (reportType === "all") {
        doc.text("تحليل الأسئلة", doc.internal.pageSize.width / 2, 150, { align: "center" });
        startY = 160;
      } else {
        doc.text("تحليل الأسئلة", doc.internal.pageSize.width / 2, 100, { align: "center" });
      }
      
      const questionsData = test.questions.map((question: any, idx: number) => {
        // Calculate average score for this question
        let totalScore = 0;
        let answeredCount = 0;
        
        test.results.forEach((result: any) => {
          if (!result.isAbsent) {
            totalScore += result.scores[question.id] || 0;
            answeredCount++;
          }
        });
        
        const avgScore = answeredCount > 0 ? totalScore / answeredCount : 0;
        const correctPercentage = (avgScore / question.maxScore) * 100;
        
        return [
          `السؤال ${idx + 1}`,
          question.type,
          question.maxScore,
          avgScore.toFixed(2),
          `${correctPercentage.toFixed(1)}%`
        ];
      });
      
      doc.autoTable({
        startY: startY,
        head: [["رقم السؤال", "نوع السؤال", "العلامة القصوى", "متوسط العلامة", "نسبة الإجابة الصحيحة"]],
        body: questionsData,
        theme: 'grid',
        styles: { font: "NotoNaskhArabic", halign: 'right', fontSize: 10 },
        headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] }
      });
    }
    
    // Footer with signature
    const pageCount = doc.internal.getNumberOfPages();
    doc.setPage(pageCount);
    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : 200;
    
    if (finalY > doc.internal.pageSize.height - 40) {
      doc.addPage();
    }
    
    doc.setFontSize(12);
    doc.text(`مدير المدرسة: ${directorName}`, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 30, { align: "right" });
    doc.text("نشكر ثقتكم بخدماتنا", doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 20, { align: "center" });
    
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
