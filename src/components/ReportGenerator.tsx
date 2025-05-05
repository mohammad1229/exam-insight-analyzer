
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

// Add the type declaration for jspdf-autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
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
      successRate: Math.round(successRate),
    };
  });

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
      doc.text(`نسبة النجاح: ${passRate.toFixed(1)}%`, 170, 97, { align: 'right' });
      doc.text(`متوسط العلامات: ${averageScore.toFixed(1)}%`, 120, 97, { align: 'right' });
      
      // Add question success rates
      doc.setFontSize(14);
      doc.text("معدل النجاح في كل سؤال", doc.internal.pageSize.width / 2, 110, { align: 'center' });
      
      const questionData = questionStats.map(stat => [
        `السؤال ${stat.questionNumber}`, 
        `${stat.successRate}%`
      ]);
      
      doc.autoTable({
        startY: 115,
        head: [['السؤال', 'معدل النجاح']],
        body: questionData,
        headStyles: { fillColor: [67, 97, 238], textColor: [255, 255, 255] },
        styles: { font: 'helvetica', halign: 'right' },
        margin: { top: 115 },
      });
      
      // Add results table
      const resultsStartY = doc.lastAutoTable.finalY + 15;
      doc.setFontSize(14);
      doc.text("نتائج الطلاب", doc.internal.pageSize.width / 2, resultsStartY, { align: 'center' });
      
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
        startY: resultsStartY + 5,
        head: [headers],
        body: resultsData,
        headStyles: { fillColor: [67, 97, 238], textColor: [255, 255, 255] },
        styles: { font: 'helvetica', halign: 'right' },
        margin: { top: resultsStartY + 10 },
      });
      
      // Add notes if available
      if (test.notes) {
        const notesStartY = doc.lastAutoTable.finalY + 15;
        doc.setFontSize(14);
        doc.text("ملاحظات", doc.internal.pageSize.width / 2, notesStartY, { align: 'center' });
        
        doc.setFontSize(12);
        doc.text(test.notes, 190, notesStartY + 10, { align: 'right', maxWidth: 180 });
      }
      
      // Add footer
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(10);
      doc.text("محمد الشوامرة للبرمجة والتصميم - 0566000140", doc.internal.pageSize.width / 2, pageHeight - 10, { align: 'center' });
      
      // Save the PDF
      doc.save(`تقرير_${test.name}_${test.date}.pdf`);
      
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

  return (
    <Card className="p-4 flex flex-col items-center space-y-4 dir-rtl">
      <h3 className="text-lg font-medium">إنشاء تقرير النتائج</h3>
      <p className="text-sm text-muted-foreground">
        قم بإنشاء تقرير PDF يحتوي على كافة بيانات النتائج والإحصائيات
      </p>
      <Button onClick={generatePDF} className="mt-2">
        تنزيل تقرير PDF
      </Button>
    </Card>
  );
};

export default ReportGenerator;
