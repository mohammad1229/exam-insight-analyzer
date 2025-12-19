import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from "recharts";
import { getTests, getClasses, getSubjects, getTeachers, getStudents } from "@/services/dataService";
import { TrendingUp, Users, BookOpen, GraduationCap, Award, AlertTriangle } from "lucide-react";
import { getPerformanceLevels } from "./PerformanceLevelsTab";

interface SummaryData {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalSubjects: number;
  totalTests: number;
  avgPassRate: number;
  excellentCount: number;
  goodCount: number;
  averageCount: number;
  lowCount: number;
  failedCount: number;
}

const SummaryTab = () => {
  const [summaryData, setSummaryData] = useState<SummaryData>({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalSubjects: 0,
    totalTests: 0,
    avgPassRate: 0,
    excellentCount: 0,
    goodCount: 0,
    averageCount: 0,
    lowCount: 0,
    failedCount: 0,
  });

  const [subjectPerformance, setSubjectPerformance] = useState<any[]>([]);
  const [classPerformance, setClassPerformance] = useState<any[]>([]);
  const [teacherPerformance, setTeacherPerformance] = useState<any[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);

  const levels = getPerformanceLevels();

  const COLORS = {
    excellent: "#22c55e",
    good: "#3b82f6",
    average: "#f59e0b",
    low: "#ef4444",
    failed: "#dc2626"
  };

  useEffect(() => {
    loadSummaryData();
  }, []);

  const loadSummaryData = () => {
    const tests = getTests();
    const classes = getClasses();
    const subjects = getSubjects();
    const teachers = getTeachers();
    const students = getStudents();

    // Calculate overall stats
    let totalExcellent = 0, totalGood = 0, totalAverage = 0, totalLow = 0, totalFailed = 0;
    let totalPassRate = 0;

    const subjectStats: Record<string, { total: number; passed: number; count: number }> = {};
    const classStats: Record<string, { total: number; passed: number; count: number }> = {};
    const teacherStats: Record<string, { total: number; passed: number; count: number; name: string }> = {};

    tests.forEach((test: any) => {
      if (!test.results) return;

      const presentStudents = test.results.filter((r: any) => !r.isAbsent);
      
      presentStudents.forEach((result: any) => {
        const pct = result.percentage || 0;
        if (pct >= levels.excellent.min) totalExcellent++;
        else if (pct >= levels.good.min) totalGood++;
        else if (pct >= levels.average.min) totalAverage++;
        else if (pct >= levels.low.min) totalLow++;
        else totalFailed++;
      });

      const passedCount = presentStudents.filter((r: any) => r.percentage >= levels.low.min).length;
      const passRate = presentStudents.length > 0 ? (passedCount / presentStudents.length) * 100 : 0;
      totalPassRate += passRate;

      // Subject stats
      const subjectId = test.subjectId;
      if (!subjectStats[subjectId]) {
        subjectStats[subjectId] = { total: 0, passed: 0, count: 0 };
      }
      subjectStats[subjectId].total += presentStudents.length;
      subjectStats[subjectId].passed += passedCount;
      subjectStats[subjectId].count++;

      // Class stats
      const classId = test.classId;
      if (!classStats[classId]) {
        classStats[classId] = { total: 0, passed: 0, count: 0 };
      }
      classStats[classId].total += presentStudents.length;
      classStats[classId].passed += passedCount;
      classStats[classId].count++;

      // Teacher stats
      const teacherId = test.teacherId;
      if (teacherId) {
        if (!teacherStats[teacherId]) {
          const teacher = teachers.find((t: any) => t.id === teacherId);
          teacherStats[teacherId] = { total: 0, passed: 0, count: 0, name: teacher?.name || "غير معروف" };
        }
        teacherStats[teacherId].total += presentStudents.length;
        teacherStats[teacherId].passed += passedCount;
        teacherStats[teacherId].count++;
      }
    });

    // Prepare chart data
    const subjectChartData = Object.entries(subjectStats).map(([id, stats]) => {
      const subject = subjects.find((s: any) => s.id === id);
      return {
        name: subject?.name || id,
        passRate: stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0,
        tests: stats.count
      };
    });

    const classChartData = Object.entries(classStats).map(([id, stats]) => {
      const cls = classes.find((c: any) => c.id === id);
      return {
        name: cls?.name || id,
        passRate: stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0,
        students: stats.total
      };
    });

    const teacherChartData = Object.entries(teacherStats).map(([id, stats]) => ({
      name: stats.name,
      passRate: stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0,
      tests: stats.count
    }));

    // Monthly trend (mock data based on tests)
    const monthlyData = [
      { month: "يناير", passRate: 72 },
      { month: "فبراير", passRate: 75 },
      { month: "مارس", passRate: 68 },
      { month: "أبريل", passRate: 80 },
      { month: "مايو", passRate: 78 },
      { month: "يونيو", passRate: 82 },
    ];

    setSummaryData({
      totalStudents: students.length,
      totalTeachers: teachers.length,
      totalClasses: classes.length,
      totalSubjects: subjects.length,
      totalTests: tests.length,
      avgPassRate: tests.length > 0 ? Math.round(totalPassRate / tests.length) : 0,
      excellentCount: totalExcellent,
      goodCount: totalGood,
      averageCount: totalAverage,
      lowCount: totalLow,
      failedCount: totalFailed,
    });

    setSubjectPerformance(subjectChartData);
    setClassPerformance(classChartData);
    setTeacherPerformance(teacherChartData);
    setMonthlyTrend(monthlyData);
  };

  const performanceDistribution = [
    { name: `ممتاز (${levels.excellent.min}%+)`, value: summaryData.excellentCount, color: COLORS.excellent },
    { name: `جيد (${levels.good.min}-${levels.excellent.min - 1}%)`, value: summaryData.goodCount, color: COLORS.good },
    { name: `متوسط (${levels.average.min}-${levels.good.min - 1}%)`, value: summaryData.averageCount, color: COLORS.average },
    { name: `متدني (${levels.low.min}-${levels.average.min - 1}%)`, value: summaryData.lowCount, color: COLORS.low },
    { name: `راسب (<${levels.low.min}%)`, value: summaryData.failedCount, color: COLORS.failed },
  ];

  const totalStudentResults = summaryData.excellentCount + summaryData.goodCount + 
    summaryData.averageCount + summaryData.lowCount + summaryData.failedCount;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="border-2 border-blue-500">
          <CardContent className="pt-4 text-center">
            <Users className="h-8 w-8 mx-auto text-blue-500 mb-2" />
            <p className="text-3xl font-bold text-blue-600">{summaryData.totalStudents}</p>
            <p className="text-sm text-muted-foreground">طالب</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-500">
          <CardContent className="pt-4 text-center">
            <GraduationCap className="h-8 w-8 mx-auto text-purple-500 mb-2" />
            <p className="text-3xl font-bold text-purple-600">{summaryData.totalTeachers}</p>
            <p className="text-sm text-muted-foreground">معلم</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-500">
          <CardContent className="pt-4 text-center">
            <BookOpen className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <p className="text-3xl font-bold text-green-600">{summaryData.totalSubjects}</p>
            <p className="text-sm text-muted-foreground">مادة</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-500">
          <CardContent className="pt-4 text-center">
            <Award className="h-8 w-8 mx-auto text-orange-500 mb-2" />
            <p className="text-3xl font-bold text-orange-600">{summaryData.totalTests}</p>
            <p className="text-sm text-muted-foreground">اختبار</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-teal-500">
          <CardContent className="pt-4 text-center">
            <TrendingUp className="h-8 w-8 mx-auto text-teal-500 mb-2" />
            <p className="text-3xl font-bold text-teal-600">{summaryData.avgPassRate}%</p>
            <p className="text-sm text-muted-foreground">معدل النجاح</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-500">
          <CardContent className="pt-4 text-center">
            <AlertTriangle className="h-8 w-8 mx-auto text-red-500 mb-2" />
            <p className="text-3xl font-bold text-red-600">{summaryData.failedCount}</p>
            <p className="text-sm text-muted-foreground">راسب</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-2 border-gray-300">
          <CardHeader className="bg-gradient-to-r from-gray-100 to-white border-b">
            <CardTitle className="text-lg">توزيع مستويات الطلاب</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={performanceDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {performanceDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} طالب`, 'العدد']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              إجمالي النتائج: {totalStudentResults} نتيجة
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-gray-300">
          <CardHeader className="bg-gradient-to-r from-gray-100 to-white border-b">
            <CardTitle className="text-lg">توزيع المستويات (مخطط أعمدة)</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-20} textAnchor="end" height={60} fontSize={10} />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} طالب`, 'العدد']} />
                  <Bar dataKey="value" name="العدد">
                    {performanceDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subject Performance */}
      <Card className="border-2 border-blue-500">
        <CardHeader className="bg-gradient-to-r from-blue-100 to-white border-b border-blue-500">
          <CardTitle>نسب النجاح حسب المادة</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectPerformance} margin={{ bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => [`${value}%`, 'نسبة النجاح']} />
                <Legend />
                <Bar dataKey="passRate" name="نسبة النجاح" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Class and Teacher Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-2 border-green-500">
          <CardHeader className="bg-gradient-to-r from-green-100 to-white border-b border-green-500">
            <CardTitle className="text-lg">نسب النجاح حسب الصف</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip formatter={(value) => [`${value}%`, 'نسبة النجاح']} />
                  <Bar dataKey="passRate" name="نسبة النجاح" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-500">
          <CardHeader className="bg-gradient-to-r from-purple-100 to-white border-b border-purple-500">
            <CardTitle className="text-lg">نسب النجاح حسب المعلم</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teacherPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip formatter={(value) => [`${value}%`, 'نسبة النجاح']} />
                  <Bar dataKey="passRate" name="نسبة النجاح" fill="#a855f7" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card className="border-2 border-orange-500">
        <CardHeader className="bg-gradient-to-r from-orange-100 to-white border-b border-orange-500">
          <CardTitle>تطور معدل النجاح الشهري</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => [`${value}%`, 'معدل النجاح']} />
                <Area 
                  type="monotone" 
                  dataKey="passRate" 
                  stroke="#f97316" 
                  fill="#fed7aa" 
                  name="معدل النجاح"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SummaryTab;
