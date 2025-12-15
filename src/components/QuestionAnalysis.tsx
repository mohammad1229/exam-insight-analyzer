
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, Area, AreaChart
} from "recharts";
import { TestResult, Question } from "@/types";
import { Users, TrendingUp, Award, Target, BarChart3, PieChartIcon, Activity } from "lucide-react";

interface QuestionAnalysisProps {
  results: TestResult[];
  questions: Question[];
}

// Palestinian flag colors for charts
const CHART_COLORS = {
  primary: "#E84C3D",    // Red
  secondary: "#000000",  // Black  
  accent: "#34A853",     // Green
  neutral: "#6B7280",    // Gray
  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444"
};

const PIE_COLORS = ["#34A853", "#E84C3D", "#6B7280"];

const QuestionAnalysis: React.FC<QuestionAnalysisProps> = ({ results, questions }) => {
  const [chartType, setChartType] = useState("bar");
  
  const presentStudents = results.filter(result => !result.isAbsent);
  const absentStudents = results.filter(result => result.isAbsent);
  const totalStudents = presentStudents.length;
  const passedStudents = presentStudents.filter(student => student.percentage >= 50);
  const failedStudents = presentStudents.filter(student => student.percentage < 50);

  const questionStats = useMemo(() => {
    return questions.map((question, index) => {
      const questionId = question.id;
      let totalScore = 0;
      let maxPossibleScore = question.maxScore * totalStudents;

      presentStudents.forEach(student => {
        totalScore += student.scores[questionId] || 0;
      });

      const successRate = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
      
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
        avgScore: totalStudents > 0 ? totalScore / totalStudents : 0,
        successRate: Math.round(successRate),
        passed,
        failed: totalStudents - passed,
        passRate: totalStudents > 0 ? Math.round((passed / totalStudents) * 100) : 0
      };
    });
  }, [questions, presentStudents, totalStudents]);

  // Overall statistics
  const overallStats = useMemo(() => {
    const avgSuccessRate = questionStats.length > 0 
      ? Math.round(questionStats.reduce((sum, stat) => sum + stat.successRate, 0) / questionStats.length)
      : 0;
    
    const avgPercentage = presentStudents.length > 0
      ? Math.round(presentStudents.reduce((sum, s) => sum + s.percentage, 0) / presentStudents.length)
      : 0;

    const highestScore = presentStudents.length > 0
      ? Math.max(...presentStudents.map(s => s.percentage))
      : 0;

    const lowestScore = presentStudents.length > 0
      ? Math.min(...presentStudents.map(s => s.percentage))
      : 0;

    return { avgSuccessRate, avgPercentage, highestScore, lowestScore };
  }, [questionStats, presentStudents]);

  // Chart data
  const barChartData = questionStats.map(stat => ({
    name: `س${stat.questionNumber}`,
    "نسبة النجاح": stat.successRate,
    "المتوسط": Math.round((stat.avgScore / stat.maxScore) * 100),
  }));

  const pieChartData = [
    { name: "ناجح", value: passedStudents.length, color: CHART_COLORS.accent },
    { name: "راسب", value: failedStudents.length, color: CHART_COLORS.primary },
    { name: "غائب", value: absentStudents.length, color: CHART_COLORS.neutral }
  ];

  const attendancePieData = [
    { name: "حاضر", value: presentStudents.length, color: CHART_COLORS.accent },
    { name: "غائب", value: absentStudents.length, color: CHART_COLORS.neutral }
  ];

  // Score distribution data
  const scoreDistribution = useMemo(() => {
    const ranges = [
      { range: "0-20%", min: 0, max: 20, count: 0 },
      { range: "21-40%", min: 21, max: 40, count: 0 },
      { range: "41-60%", min: 41, max: 60, count: 0 },
      { range: "61-80%", min: 61, max: 80, count: 0 },
      { range: "81-100%", min: 81, max: 100, count: 0 }
    ];

    presentStudents.forEach(student => {
      const range = ranges.find(r => student.percentage >= r.min && student.percentage <= r.max);
      if (range) range.count++;
    });

    return ranges.map(r => ({
      name: r.range,
      "عدد الطلاب": r.count,
      fill: r.min >= 50 ? CHART_COLORS.accent : CHART_COLORS.primary
    }));
  }, [presentStudents]);

  // Custom tooltip for Arabic support
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg" dir="rtl">
          <p className="font-semibold text-foreground">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <ul className="flex justify-center gap-4 mt-4" dir="rtl">
        {payload.map((entry: any, index: number) => (
          <li key={index} className="flex items-center gap-2">
            <span 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-foreground">{entry.value}</span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="space-y-6 dir-rtl">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          تحليل الأسئلة والنتائج
        </h3>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              الحاضرون
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-accent">{totalStudents}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-muted/50 to-muted/25 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              الغائبون
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-muted-foreground">{absentStudents.length}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Award className="h-4 w-4" />
              الناجحون
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-accent">{passedStudents.length}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              الراسبون
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{failedStudents.length}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              نسبة النجاح
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-accent">
              {totalStudents > 0 ? Math.round((passedStudents.length / totalStudents) * 100) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4" />
              المتوسط
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{overallStats.avgPercentage}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="questions" className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="questions" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            الأسئلة
          </TabsTrigger>
          <TabsTrigger value="distribution" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            التوزيع
          </TabsTrigger>
          <TabsTrigger value="status" className="flex items-center gap-2">
            <PieChartIcon className="h-4 w-4" />
            الحالة
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            المقارنة
          </TabsTrigger>
        </TabsList>

        {/* Questions Analysis Chart */}
        <TabsContent value="questions">
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>تحليل الأسئلة - نسبة النجاح لكل سؤال</CardTitle>
              <div className="flex gap-2">
                <button
                  onClick={() => setChartType("bar")}
                  className={`p-2 rounded-md transition-colors ${chartType === "bar" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                >
                  <BarChart3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setChartType("area")}
                  className={`p-2 rounded-md transition-colors ${chartType === "area" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                >
                  <Activity className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === "bar" ? (
                    <BarChart data={barChartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                      <YAxis domain={[0, 100]} unit="%" stroke="hsl(var(--foreground))" />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend content={renderLegend} />
                      <Bar dataKey="نسبة النجاح" fill={CHART_COLORS.accent} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="المتوسط" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  ) : (
                    <AreaChart data={barChartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                      <YAxis domain={[0, 100]} unit="%" stroke="hsl(var(--foreground))" />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend content={renderLegend} />
                      <Area type="monotone" dataKey="نسبة النجاح" stroke={CHART_COLORS.accent} fill={CHART_COLORS.accent} fillOpacity={0.3} />
                      <Area type="monotone" dataKey="المتوسط" stroke={CHART_COLORS.primary} fill={CHART_COLORS.primary} fillOpacity={0.3} />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Score Distribution Chart */}
        <TabsContent value="distribution">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>توزيع الدرجات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scoreDistribution} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                    <YAxis stroke="hsl(var(--foreground))" />
                    <Tooltip 
                      formatter={(value) => [value, "عدد الطلاب"]}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        direction: 'rtl'
                      }}
                    />
                    <Bar dataKey="عدد الطلاب" radius={[4, 4, 0, 0]}>
                      {scoreDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Status Pie Charts */}
        <TabsContent value="status">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>نسبة النجاح والرسوب</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [value, "عدد الطلاب"]}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          direction: 'rtl'
                        }}
                      />
                      <Legend content={renderLegend} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>نسبة الحضور</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={attendancePieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {attendancePieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [value, "عدد الطلاب"]}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          direction: 'rtl'
                        }}
                      />
                      <Legend content={renderLegend} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Comparison Line Chart */}
        <TabsContent value="comparison">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>مقارنة الناجحين والراسبين لكل سؤال</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={questionStats.map(stat => ({
                      name: `س${stat.questionNumber}`,
                      "ناجح": stat.passed,
                      "راسب": stat.failed
                    }))} 
                    margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                    <YAxis stroke="hsl(var(--foreground))" />
                    <Tooltip 
                      formatter={(value) => [value, "عدد الطلاب"]}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        direction: 'rtl'
                      }}
                    />
                    <Legend content={renderLegend} />
                    <Line 
                      type="monotone" 
                      dataKey="ناجح" 
                      stroke={CHART_COLORS.accent} 
                      strokeWidth={3}
                      dot={{ fill: CHART_COLORS.accent, strokeWidth: 2, r: 5 }}
                      activeDot={{ r: 8 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="راسب" 
                      stroke={CHART_COLORS.primary}
                      strokeWidth={3}
                      dot={{ fill: CHART_COLORS.primary, strokeWidth: 2, r: 5 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Questions Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>تفاصيل الأسئلة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-border p-3 text-right font-semibold">السؤال</th>
                  <th className="border border-border p-3 text-right font-semibold">النوع</th>
                  <th className="border border-border p-3 text-right font-semibold">العلامة القصوى</th>
                  <th className="border border-border p-3 text-right font-semibold">متوسط العلامة</th>
                  <th className="border border-border p-3 text-right font-semibold">نسبة النجاح</th>
                  <th className="border border-border p-3 text-right font-semibold">ناجح</th>
                  <th className="border border-border p-3 text-right font-semibold">راسب</th>
                </tr>
              </thead>
              <tbody>
                {questionStats.map((stat) => (
                  <tr 
                    key={stat.questionId}
                    className={stat.successRate < 50 ? "bg-destructive/10" : "hover:bg-muted/50"}
                  >
                    <td className="border border-border p-3 font-medium">السؤال {stat.questionNumber}</td>
                    <td className="border border-border p-3">{stat.type}</td>
                    <td className="border border-border p-3">{stat.maxScore}</td>
                    <td className="border border-border p-3">{stat.avgScore.toFixed(1)}</td>
                    <td className="border border-border p-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${
                        stat.successRate >= 50 
                          ? "bg-accent/20 text-accent" 
                          : "bg-destructive/20 text-destructive"
                      }`}>
                        {stat.successRate}%
                      </span>
                    </td>
                    <td className="border border-border p-3">
                      <span className="text-accent font-medium">{stat.passed}</span>
                    </td>
                    <td className="border border-border p-3">
                      <span className="text-destructive font-medium">{stat.failed}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Additional Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>إحصائيات إضافية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="text-muted-foreground">أعلى درجة</span>
              <span className="text-2xl font-bold text-accent">{overallStats.highestScore}%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="text-muted-foreground">أدنى درجة</span>
              <span className="text-2xl font-bold text-destructive">{overallStats.lowestScore}%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="text-muted-foreground">متوسط الدرجات</span>
              <span className="text-2xl font-bold">{overallStats.avgPercentage}%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="text-muted-foreground">متوسط نسبة النجاح للأسئلة</span>
              <span className="text-2xl font-bold">{overallStats.avgSuccessRate}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الأسئلة الأصعب</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...questionStats]
                .sort((a, b) => a.successRate - b.successRate)
                .slice(0, 3)
                .map((stat, index) => (
                  <div 
                    key={stat.questionId} 
                    className={`flex justify-between items-center p-3 rounded-lg ${
                      stat.successRate < 50 ? "bg-destructive/10" : "bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? "bg-destructive text-destructive-foreground" : "bg-muted text-muted-foreground"
                      }`}>
                        {index + 1}
                      </span>
                      <span>السؤال {stat.questionNumber}</span>
                    </div>
                    <span className={`font-bold ${stat.successRate < 50 ? "text-destructive" : ""}`}>
                      {stat.successRate}%
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QuestionAnalysis;
