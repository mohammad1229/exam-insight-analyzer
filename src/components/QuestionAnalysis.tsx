
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TestResult, Question } from "@/types";

interface QuestionAnalysisProps {
  results: TestResult[];
  questions: Question[];
}

const QuestionAnalysis: React.FC<QuestionAnalysisProps> = ({ results, questions }) => {
  const presentStudents = results.filter(result => !result.isAbsent);
  const totalStudents = presentStudents.length;

  const questionStats = useMemo(() => {
    return questions.map((question, index) => {
      const questionId = question.id;
      let totalScore = 0;
      let maxPossibleScore = question.maxScore * totalStudents;

      // Calculate total score for this question
      presentStudents.forEach(student => {
        totalScore += student.scores[questionId] || 0;
      });

      // Calculate success rate
      const successRate = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
      
      // Calculate number of students that passed (got more than 50%)
      const passed = presentStudents.filter(student => {
        const score = student.scores[questionId] || 0;
        return (score / question.maxScore) * 100 >= 50;
      }).length;

      return {
        questionNumber: index + 1,
        questionId,
        type: question.type,
        maxScore: question.maxScore,
        totalScore,
        successRate: Math.round(successRate),
        passed,
        passRate: Math.round((passed / totalStudents) * 100)
      };
    });
  }, [questions, presentStudents, totalStudents]);

  const chartData = questionStats.map(stat => ({
    name: `س${stat.questionNumber}`,
    "معدل النجاح": stat.successRate,
  }));

  return (
    <div className="space-y-6 dir-rtl">
      <h3 className="text-xl font-semibold">تحليل الأسئلة</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي الطلاب</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalStudents}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">متوسط النجاح</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {questionStats.length > 0 ? 
                `${Math.round(questionStats.reduce((sum, stat) => sum + stat.successRate, 0) / questionStats.length)}%` : 
                '0%'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">عدد الناجحين</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {presentStudents.filter(student => student.percentage >= 50).length}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">نسبة النجاح</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {totalStudents > 0 ? 
                `${Math.round((presentStudents.filter(student => student.percentage >= 50).length / totalStudents) * 100)}%` : 
                '0%'}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>معدل النجاح لكل سؤال</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} unit="%" />
                <Tooltip formatter={(value) => [`${value}%`, `معدل النجاح`]} />
                <Bar dataKey="معدل النجاح" fill="#4361ee" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted">
              <th className="border p-2 text-right">السؤال</th>
              <th className="border p-2 text-right">النوع</th>
              <th className="border p-2 text-right">العلامة القصوى</th>
              <th className="border p-2 text-right">متوسط العلامة</th>
              <th className="border p-2 text-right">معدل النجاح</th>
              <th className="border p-2 text-right">عدد الناجحين</th>
            </tr>
          </thead>
          <tbody>
            {questionStats.map((stat) => (
              <tr key={stat.questionId}>
                <td className="border p-2">السؤال {stat.questionNumber}</td>
                <td className="border p-2">{stat.type}</td>
                <td className="border p-2">{stat.maxScore}</td>
                <td className="border p-2">
                  {totalStudents > 0 ? (stat.totalScore / totalStudents).toFixed(1) : 0}
                </td>
                <td className="border p-2">{stat.successRate}%</td>
                <td className="border p-2">{stat.passed} ({stat.passRate}%)</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QuestionAnalysis;
