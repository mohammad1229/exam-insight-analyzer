
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  Test, 
  TestResult, 
  Student
} from "@/types";
import { 
  getClassById, 
  getSectionById, 
  getSubjectById, 
  getTeacherById,
  getStudentById,
  schoolData
} from "@/data/mockData";
import { jsPDF } from "jspdf";
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { FileText, Printer, Upload } from "lucide-react";

// Add the type declaration for jspdf-autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF & {
      previous: {
        finalY: number;
      };
    };
  }
}

interface ReportGeneratorProps {
  test: Test;
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({ test }) => {
  const { toast } = useToast();

  // Get related data
  const subject = getSubjectById(test.subjectId);
  const teacher = getTeacherById(test.teacherId);
  const classObj = getClassById(test.classId);
  const section = getSectionById(test.classId, test.sectionId);

  // Calculate stats
  const presentResults = test.results.filter(result => !result.isAbsent);
  const totalStudents = presentResults.length;
  const passedStudents = presentResults.filter(result => result.percentage >= 50).length;
  const failedStudents = totalStudents - passedStudents;
  const passRate = totalStudents > 0 ? (passedStudents / totalStudents) * 100 : 0;
  const averageScore = totalStudents > 0 
    ? presentResults.reduce((sum, result) => sum + result.percentage, 0) / totalStudents 
    : 0;

  // Calculate question stats
  const questionStats = test.questions.map((question, index) => {
    const questionId = question.id;
    let totalScore = 0;
    let maxPossibleScore = question.maxScore * totalStudents;

    presentResults.forEach(result => {
      totalScore += result.scores[questionId] || 0;
    });

    const successRate = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;

    return {
      questionNumber: index + 1,
      questionId,
      successRate: Math.round(successRate),
    };
  });

  const generateExcel = () => {
    try {
      // Create workbook
      const workbook = XLSX.utils.book_new();

      // Create sheet with test info
      const testInfoSheet = [
        ["اسم المدرسة", schoolData.name],
        ["اسم الاختبار", test.name],
        ["المادة", subject?.name || ''],
        ["المعلم", teacher?.name || ''],
        ["الصف", `${classObj?.name || ''} ${section?.name || ''}`],
        ["تاريخ الاختبار", test.date]
      ];
      
      // Add statistics
      const statsData = [
        ["إحصائيات الاختبار"],
        ["إجمالي الطلاب", totalStudents],
        ["عدد الناجحين", passedStudents],
        ["عدد الراسبين", failedStudents],
        ["نسبة النجاح", `${passRate.toFixed(1)}%`],
        ["متوسط العلامات", `${averageScore.toFixed(1)}%`]
      ];
      
      // Add test info and statistics to one sheet
      const testInfoWS = XLSX.utils.aoa_to_sheet([...testInfoSheet, [""], ...statsData]);
      XLSX.utils.book_append_sheet(workbook, testInfoWS, "معلومات الاختبار");
      
      // Create question stats sheet
      const questionHeaders = ["السؤال", "معدل النجاح"];
      const questionData = questionStats.map(stat => [
        `السؤال ${stat.questionNumber}`, 
        `${stat.successRate}%`
      ]);
      
      const questionWS = XLSX.utils.aoa_to_sheet([questionHeaders, ...questionData]);
      XLSX.utils.book_append_sheet(workbook, questionWS, "تحليل الأسئلة");
      
      // Create student results sheet
      const resultsHeaders = ["اسم الطالب", "النتيجة"];
      test.questions.forEach((_, index) => {
        resultsHeaders.push(`س${index + 1}`);
      });
      
      const resultsData = test.results.map(result => {
        const student = getStudentById(result.studentId);
        const rowData = [
          student?.name || '',
          result.isAbsent ? 'غائب' : `${result.percentage}%`,
        ];
        
        // Add scores for each question
        test.questions.forEach(question => {
          rowData.push(result.isAbsent ? '-' : `${result.scores[question.id] || 0}/${question.maxScore}`);
        });
        
        return rowData;
      });
      
      const resultsWS = XLSX.utils.aoa_to_sheet([resultsHeaders, ...resultsData]);
      XLSX.utils.book_append_sheet(workbook, resultsWS, "نتائج الطلاب");
      
      // Save the Excel file
      XLSX.writeFile(workbook, `تقرير_${test.name}_${test.date}.xlsx`);
      
      // Save a copy for admin and teacher (this would typically be sent to a server)
      saveReportCopy(workbook, 'excel');
      
      toast({
        title: "تم إنشاء ملف Excel",
        description: "تم إنشاء ملف Excel بنجاح وحفظه على جهازك",
      });
    } catch (error) {
      console.error("Error generating Excel:", error);
      toast({
        title: "حدث خطأ",
        description: "لم يتم إنشاء ملف Excel بنجاح",
        variant: "destructive",
      });
    }
  };

  const generatePDF = () => {
    try {
      // Create PDF document
      const doc = new jsPDF();
      
      // Add RTL support
      doc.setR2L(true);

      // Add header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text(schoolData.name, doc.internal.pageSize.width / 2, 15, { align: 'center' });
      
      doc.setFontSize(14);
      doc.text("تقرير نتائج اختبار", doc.internal.pageSize.width / 2, 25, { align: 'center' });
      
      // Add test info
      doc.setFontSize(12);
      doc.text(`اسم الاختبار: ${test.name}`, 195, 40, { align: 'right' });
      doc.text(`المادة: ${subject?.name || ''}`, 195, 47, { align: 'right' });
      doc.text(`المعلم: ${teacher?.name || ''}`, 195, 54, { align: 'right' });
      doc.text(`الصف: ${classObj?.name || ''} ${section?.name || ''}`, 195, 61, { align: 'right' });
      doc.text(`تاريخ الاختبار: ${test.date}`, 195, 68, { align: 'right' });
      
      // Add statistics
      doc.setFontSize(14);
      doc.text("إحصائيات الاختبار", doc.internal.pageSize.width / 2, 80, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text(`إجمالي الطلاب: ${totalStudents}`, 170, 90, { align: 'right' });
      doc.text(`عدد الناجحين: ${passedStudents}`, 120, 90, { align: 'right' });
      doc.text(`عدد الراسبين: ${failedStudents}`, 170, 97, { align: 'right' });
      doc.text(`نسبة النجاح: ${passRate.toFixed(1)}%`, 120, 97, { align: 'right' });
      doc.text(`متوسط العلامات: ${averageScore.toFixed(1)}%`, 170, 104, { align: 'right' });
      
      // Add question success rates
      doc.setFontSize(14);
      doc.text("معدل النجاح في كل سؤال", doc.internal.pageSize.width / 2, 118, { align: 'center' });
      
      const questionData = questionStats.map(stat => [
        `السؤال ${stat.questionNumber}`, 
        `${stat.successRate}%`
      ]);
      
      doc.autoTable({
        startY: 123,
        head: [['السؤال', 'معدل النجاح']],
        body: questionData,
        headStyles: { fillColor: [0, 128, 0], textColor: [255, 255, 255] },
        styles: { font: 'helvetica', halign: 'right' },
        margin: { top: 123 },
        didDrawCell: (data) => {
          // Highlight failed questions with red color
          if (data.row.index >= 0 && !data.isHeaderRow && data.column.index === 1) {
            const successRate = parseInt(questionData[data.row.index][1]);
            if (successRate < 50) {
              doc.setTextColor(255, 0, 0);
            } else {
              doc.setTextColor(0, 0, 0);
            }
          }
        },
      });
      
      // Get the Y position after the question stats table
      const questionTableEndY = (doc.autoTable as any).previous.finalY;
      
      // Add results table
      doc.setFontSize(14);
      doc.text("نتائج الطلاب", doc.internal.pageSize.width / 2, questionTableEndY + 15, { align: 'center' });
      
      // Prepare the table data for student results
      const resultsData = test.results.map(result => {
        const student = getStudentById(result.studentId);
        const rowData = [
          student?.name || '',
          result.isAbsent ? 'غائب' : `${result.percentage}%`,
        ];
        
        // Add scores for each question
        test.questions.forEach(question => {
          rowData.push(result.isAbsent ? '-' : `${result.scores[question.id] || 0}/${question.maxScore}`);
        });
        
        return rowData;
      });
      
      // Prepare the headers for the table
      const headers = ['اسم الطالب', 'النتيجة'];
      test.questions.forEach((_, index) => {
        headers.push(`س${index + 1}`);
      });
      
      doc.autoTable({
        startY: questionTableEndY + 20,
        head: [headers],
        body: resultsData,
        headStyles: { fillColor: [0, 128, 0], textColor: [255, 255, 255] },
        styles: { font: 'helvetica', halign: 'right' },
        margin: { top: questionTableEndY + 20 },
        didDrawCell: (data) => {
          // Highlight failed scores with red color
          if (data.row.index >= 0 && !data.isHeaderRow && data.column.index === 1) {
            const resultText = resultsData[data.row.index][1];
            if (resultText !== 'غائب') {
              const percentage = parseFloat(resultText);
              if (percentage < 50) {
                doc.setTextColor(255, 0, 0);
              } else {
                doc.setTextColor(0, 0, 0);
              }
            }
          } else if (data.row.index >= 0 && !data.isHeaderRow && data.column.index >= 2) {
            const scoreText = resultsData[data.row.index][data.column.index];
            if (scoreText !== '-') {
              const parts = scoreText.split('/');
              const score = parseFloat(parts[0]);
              const maxScore = parseFloat(parts[1]);
              if (score / maxScore < 0.5) {
                doc.setTextColor(255, 0, 0);
              } else {
                doc.setTextColor(0, 0, 0);
              }
            }
          }
        },
      });
      
      // Get the Y position after the results table
      const resultsTableEndY = (doc.autoTable as any).previous.finalY;
      
      // Add summary table
      doc.setFontSize(14);
      doc.text("جدول تلخيص النتائج", doc.internal.pageSize.width / 2, resultsTableEndY + 15, { align: 'center' });
      
      const summaryData = [
        ['المجموع الكلي للطلاب', `${totalStudents}`],
        ['عدد الناجحين', `${passedStudents}`],
        ['عدد الراسبين', `${failedStudents}`],
        ['نسبة النجاح الكلية', `${passRate.toFixed(1)}%`],
      ];
      
      doc.autoTable({
        startY: resultsTableEndY + 20,
        body: summaryData,
        theme: 'grid',
        styles: { font: 'helvetica', halign: 'right', fillColor: [231, 230, 230] },
        margin: { top: resultsTableEndY + 20 },
      });
      
      // Add notes if available
      if (test.notes) {
        const summaryTableEndY = (doc.autoTable as any).previous.finalY;
        doc.setFontSize(14);
        doc.text("ملاحظات", doc.internal.pageSize.width / 2, summaryTableEndY + 15, { align: 'center' });
        
        doc.setFontSize(12);
        doc.text(test.notes, 190, summaryTableEndY + 25, { align: 'right', maxWidth: 180 });
      }
      
      // Add footer
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(10);
      doc.text("محمد للبرمجة والتصميم - نظام إدارة الاختبارات والتقارير", doc.internal.pageSize.width / 2, pageHeight - 10, { align: 'center' });
      
      // Save the PDF
      doc.save(`تقرير_${test.name}_${test.date}.pdf`);
      
      // Save a copy for admin and teacher (this would typically be sent to a server)
      saveReportCopy(doc, 'pdf');
      
      toast({
        title: "تم إنشاء التقرير",
        description: "تم إنشاء ملف PDF بنجاح",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "حدث خطأ",
        description: "لم يتم إنشاء التقرير بنجاح",
        variant: "destructive",
      });
    }
  };

  const handlePrint = () => {
    try {
      // Create a printable version
      const printContent = document.createElement('div');
      printContent.style.direction = 'rtl';
      printContent.innerHTML = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="text-align: center;">${schoolData.name}</h1>
          <h2 style="text-align: center;">تقرير نتائج اختبار</h2>
          
          <div style="margin-top: 20px;">
            <p><strong>اسم الاختبار:</strong> ${test.name}</p>
            <p><strong>المادة:</strong> ${subject?.name || ''}</p>
            <p><strong>المعلم:</strong> ${teacher?.name || ''}</p>
            <p><strong>الصف:</strong> ${classObj?.name || ''} ${section?.name || ''}</p>
            <p><strong>تاريخ الاختبار:</strong> ${test.date}</p>
          </div>
          
          <h3 style="text-align: center; margin-top: 30px;">إحصائيات الاختبار</h3>
          <div style="display: flex; justify-content: space-between; margin-top: 10px;">
            <p><strong>إجمالي الطلاب:</strong> ${totalStudents}</p>
            <p><strong>عدد الناجحين:</strong> ${passedStudents}</p>
            <p><strong>عدد الراسبين:</strong> ${failedStudents}</p>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <p><strong>نسبة النجاح:</strong> ${passRate.toFixed(1)}%</p>
            <p><strong>متوسط العلامات:</strong> ${averageScore.toFixed(1)}%</p>
          </div>
          
          <h3 style="text-align: center; margin-top: 30px;">معدل النجاح في كل سؤال</h3>
          <table border="1" style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr>
                <th style="padding: 8px; background-color: #4CAF50; color: white;">السؤال</th>
                <th style="padding: 8px; background-color: #4CAF50; color: white;">معدل النجاح</th>
              </tr>
            </thead>
            <tbody>
              ${questionStats.map(stat => `
                <tr>
                  <td style="padding: 8px;">السؤال ${stat.questionNumber}</td>
                  <td style="padding: 8px; ${stat.successRate < 50 ? 'color: red;' : ''}">
                    ${stat.successRate}%
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <h3 style="text-align: center; margin-top: 30px;">نتائج الطلاب</h3>
          <table border="1" style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr>
                <th style="padding: 8px; background-color: #4CAF50; color: white;">اسم الطالب</th>
                <th style="padding: 8px; background-color: #4CAF50; color: white;">النتيجة</th>
                ${test.questions.map((_, i) => 
                  `<th style="padding: 8px; background-color: #4CAF50; color: white;">س${i + 1}</th>`
                ).join('')}
              </tr>
            </thead>
            <tbody>
              ${test.results.map(result => {
                const student = getStudentById(result.studentId);
                return `
                  <tr>
                    <td style="padding: 8px;">${student?.name || ''}</td>
                    <td style="padding: 8px; ${!result.isAbsent && result.percentage < 50 ? 'color: red;' : ''}">
                      ${result.isAbsent ? 'غائب' : `${result.percentage}%`}
                    </td>
                    ${test.questions.map(question => {
                      if (result.isAbsent) {
                        return `<td style="padding: 8px;">-</td>`;
                      }
                      const score = result.scores[question.id] || 0;
                      const maxScore = question.maxScore;
                      const isLowScore = score / maxScore < 0.5;
                      
                      return `<td style="padding: 8px; ${isLowScore ? 'color: red;' : ''}">
                        ${score}/${maxScore}
                      </td>`;
                    }).join('')}
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          
          <h3 style="text-align: center; margin-top: 30px;">جدول تلخيص النتائج</h3>
          <table border="1" style="width: 100%; border-collapse: collapse; margin-top: 10px; background-color: #f2f2f2;">
            <tbody>
              <tr>
                <td style="padding: 8px;"><strong>المجموع الكلي للطلاب</strong></td>
                <td style="padding: 8px;">${totalStudents}</td>
              </tr>
              <tr>
                <td style="padding: 8px;"><strong>عدد الناجحين</strong></td>
                <td style="padding: 8px;">${passedStudents}</td>
              </tr>
              <tr>
                <td style="padding: 8px;"><strong>عدد الراسبين</strong></td>
                <td style="padding: 8px;">${failedStudents}</td>
              </tr>
              <tr>
                <td style="padding: 8px;"><strong>نسبة النجاح الكلية</strong></td>
                <td style="padding: 8px;">${passRate.toFixed(1)}%</td>
              </tr>
            </tbody>
          </table>
          
          ${test.notes ? `
            <h3 style="text-align: center; margin-top: 30px;">ملاحظات</h3>
            <p style="margin-top: 10px;">${test.notes}</p>
          ` : ''}
          
          <div style="text-align: center; margin-top: 40px; font-size: 12px;">
            <p>محمد للبرمجة والتصميم - نظام إدارة الاختبارات والتقارير</p>
          </div>
        </div>
      `;

      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast({
          title: "تم منع النوافذ المنبثقة",
          description: "يرجى السماح بالنوافذ المنبثقة لطباعة التقرير",
          variant: "destructive",
        });
        return;
      }
      
      printWindow.document.write('<html><head><title>تقرير نتائج الاختبار</title></head><body>');
      printWindow.document.write(printContent.innerHTML);
      printWindow.document.write('</body></html>');
      
      // Save a copy for admin and teacher
      saveReportCopy(printContent.innerHTML, 'print');
      
      printWindow.document.close();
      printWindow.focus();
      
      // Print after a short delay to ensure content is rendered
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
      
      toast({
        title: "تم إعداد النسخة للطباعة",
        description: "تم فتح نافذة الطباعة بنجاح",
      });
    } catch (error) {
      console.error("Error printing:", error);
      toast({
        title: "حدث خطأ",
        description: "لم يتم إعداد النسخة للطباعة بنجاح",
        variant: "destructive",
      });
    }
  };

  // Function to save a copy of the report for admin and teacher
  const saveReportCopy = (content: any, type: 'excel' | 'pdf' | 'print') => {
    // In a real application, this would save to a database
    // For demo purposes, we'll just log it
    console.log(`Saving ${type} report copy for admin and teacher:`, {
      testId: test.id,
      testName: test.name,
      className: classObj?.name,
      sectionName: section?.name,
      subjectName: subject?.name,
      teacherName: teacher?.name,
      date: new Date().toISOString(),
      reportType: type
    });
    
    // In a real app, you would send this data to your backend
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get first sheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert to json
          const importedData = XLSX.utils.sheet_to_json(worksheet);
          
          console.log('Imported data:', importedData);
          
          toast({
            title: "تم استيراد البيانات",
            description: `تم استيراد ${importedData.length} سجل من ملف Excel بنجاح`,
          });
          
          // Reset input value so the same file can be imported again
          event.target.value = '';
        } catch (error) {
          console.error('Error parsing Excel file:', error);
          toast({
            title: "حدث خطأ",
            description: "تعذر قراءة ملف Excel. يرجى التأكد من صحة الملف",
            variant: "destructive",
          });
        }
      };
      
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error reading file:', error);
      toast({
        title: "حدث خطأ",
        description: "فشلت عملية قراءة الملف",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="p-4 flex flex-col items-center space-y-4 dir-rtl border-2 border-green-500 bg-gradient-to-r from-white via-white to-green-50">
      <h3 className="text-lg font-medium text-black">إنشاء تقرير النتائج</h3>
      <p className="text-sm text-muted-foreground">
        قم بإنشاء تقارير تحتوي على كافة بيانات النتائج والإحصائيات
      </p>
      <div className="flex flex-col gap-2 w-full">
        <Button onClick={generatePDF} className="flex-1 gap-2 bg-red-600 hover:bg-red-700">
          <FileText className="h-4 w-4" />
          تنزيل تقرير PDF
        </Button>
        <Button onClick={generateExcel} className="flex-1 gap-2 bg-green-600 hover:bg-green-700">
          <FileText className="h-4 w-4" />
          تنزيل تقرير Excel
        </Button>
        <Button onClick={handlePrint} className="flex-1 gap-2" variant="outline">
          <Printer className="h-4 w-4" />
          طباعة التقرير
        </Button>
        
        <label className="flex items-center justify-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-gray-100 transition-colors text-center mt-2 border-black">
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            className="hidden" 
            onChange={handleFileImport} 
          />
          <Upload className="h-4 w-4" />
          استيراد بيانات من ملف Excel
        </label>
      </div>
    </Card>
  );
};

export default ReportGenerator;

