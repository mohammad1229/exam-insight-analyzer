import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { 
  getTestsDB, 
  getTeachersDB, 
  getSubjectsDB, 
  getClassesDB,
  getPerformanceLevelsDB,
  DBTest,
  DBPerformanceLevel
} from "@/services/databaseService";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PerformanceLevelsConfig {
  excellent: { min: number; color: string };
  good: { min: number; color: string };
  average: { min: number; color: string };
  low: { min: number; color: string };
  failed: { min: number; color: string };
}

interface ReportData {
  id: string;
  testId: string;
  testName: string;
  className: string;
  sectionName: string;
  subjectName: string;
  teacherName: string;
  date: string;
  totalStudents: number;
  passedStudents: number;
  passRate: number;
}

const StatisticsTab = () => {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<ReportData[]>([]);
  const [testsCount, setTestsCount] = useState(0);
  const [teachersCount, setTeachersCount] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);
  const [levels, setLevels] = useState<PerformanceLevelsConfig>({
    excellent: { min: 90, color: "#22c55e" },
    good: { min: 75, color: "#3b82f6" },
    average: { min: 60, color: "#f59e0b" },
    low: { min: 50, color: "#ef4444" },
    failed: { min: 0, color: "#dc2626" }
  });

  useEffect(() => {
    loadStatisticsData();
  }, []);

  const loadStatisticsData = async () => {
    setLoading(true);
    try {
      const [tests, teachers, subjects, classes, performanceLevels] = await Promise.all([
        getTestsDB(),
        getTeachersDB(),
        getSubjectsDB(),
        getClassesDB(),
        getPerformanceLevelsDB()
      ]);

      // Configure performance levels from database
      const levelsConfig = configurePerformanceLevels(performanceLevels);
      setLevels(levelsConfig);

      setTestsCount(tests.length);
      setTeachersCount(teachers.length);

      // Prepare reports from tests with results
      const reportsData: ReportData[] = tests
        .filter((test: DBTest) => test.test_results && test.test_results.length > 0)
        .map((test: DBTest) => {
          const presentStudents = test.test_results?.filter(r => !r.is_absent) || [];
          const passedCount = presentStudents.filter(r => r.percentage >= levelsConfig.low.min).length;
          const passRate = presentStudents.length > 0 
            ? Math.round((passedCount / presentStudents.length) * 100) 
            : 0;

          return {
            id: test.id,
            testId: test.id,
            testName: test.name,
            className: test.classes?.name || "غير محدد",
            sectionName: test.sections?.name || "غير محدد",
            subjectName: test.subjects?.name || "غير محدد",
            teacherName: test.teachers?.name || "غير محدد",
            date: test.test_date,
            totalStudents: test.test_results?.length || 0,
            passedStudents: passedCount,
            passRate
          };
        });

      setReports(reportsData);

      // Prepare chart data by subject
      const subjectStats: Record<string, { total: number; passed: number; count: number }> = {};
      
      reportsData.forEach(report => {
        if (!subjectStats[report.subjectName]) {
          subjectStats[report.subjectName] = { total: 0, passed: 0, count: 0 };
        }
        subjectStats[report.subjectName].total += report.totalStudents;
        subjectStats[report.subjectName].passed += report.passedStudents;
        subjectStats[report.subjectName].count++;
      });

      const subjectChartData = Object.entries(subjectStats).map(([name, stats]) => ({
        name,
        نسبة_النجاح: stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0,
        اختبارات: stats.count
      }));

      setChartData(subjectChartData);
    } catch (error) {
      console.error("Error loading statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  const configurePerformanceLevels = (dbLevels: DBPerformanceLevel[]): PerformanceLevelsConfig => {
    const defaults: PerformanceLevelsConfig = {
      excellent: { min: 90, color: "#22c55e" },
      good: { min: 75, color: "#3b82f6" },
      average: { min: 60, color: "#f59e0b" },
      low: { min: 50, color: "#ef4444" },
      failed: { min: 0, color: "#dc2626" }
    };

    if (dbLevels.length === 0) return defaults;

    // Sort by min_score descending to map levels correctly
    const sorted = [...dbLevels].sort((a, b) => b.min_score - a.min_score);
    
    const levelNames = ['excellent', 'good', 'average', 'low', 'failed'] as const;
    sorted.forEach((level, index) => {
      if (index < levelNames.length) {
        defaults[levelNames[index]] = { min: level.min_score, color: level.color };
      }
    });

    return defaults;
  };

  // Calculate average pass rate
  const avgPassRate = reports.length > 0
    ? Math.round(reports.reduce((sum, r) => sum + r.passRate, 0) / reports.length)
    : 0;

  // Calculate performance levels distribution
  const excellentCount = reports.filter(r => r.passRate >= levels.excellent.min).length;
  const goodCount = reports.filter(r => r.passRate >= levels.good.min && r.passRate < levels.excellent.min).length;
  const averageCount = reports.filter(r => r.passRate >= levels.average.min && r.passRate < levels.good.min).length;
  const lowCount = reports.filter(r => r.passRate >= levels.low.min && r.passRate < levels.average.min).length;
  const failedCount = reports.filter(r => r.passRate < levels.low.min).length;

  const performanceLevelsData = [
    { name: `ممتاز (${levels.excellent.min}%+)`, value: excellentCount, color: levels.excellent.color },
    { name: `جيد (${levels.good.min}-${levels.excellent.min - 1}%)`, value: goodCount, color: levels.good.color },
    { name: `متوسط (${levels.average.min}-${levels.good.min - 1}%)`, value: averageCount, color: levels.average.color },
    { name: `متدني (${levels.low.min}-${levels.average.min - 1}%)`, value: lowCount, color: levels.low.color },
    { name: `راسب (<${levels.low.min}%)`, value: failedCount, color: levels.failed.color },
  ];

  const barChartData = [
    { name: "ممتاز", count: excellentCount, fill: levels.excellent.color },
    { name: "جيد", count: goodCount, fill: levels.good.color },
    { name: "متوسط", count: averageCount, fill: levels.average.color },
    { name: "متدني", count: lowCount, fill: levels.low.color },
    { name: "راسب", count: failedCount, fill: levels.failed.color },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="mr-2">جاري تحميل الإحصائيات...</span>
      </div>
    );
  }

  return (
    <Card className="border-2 border-black">
      <CardHeader className="bg-gradient-to-r from-gray-100 to-white border-b border-black flex flex-row items-center justify-between">
        <CardTitle>إحصائيات المدرسة</CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={loadStatisticsData}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
          تحديث البيانات
        </Button>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border border-green-500">
            <CardHeader className="bg-green-50 pb-2">
              <CardTitle className="text-sm">عدد الاختبارات</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{testsCount}</p>
            </CardContent>
          </Card>
          
          <Card className="border border-blue-500">
            <CardHeader className="bg-blue-50 pb-2">
              <CardTitle className="text-sm">متوسط نسب النجاح</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{avgPassRate}%</p>
            </CardContent>
          </Card>
          
          <Card className="border border-purple-500">
            <CardHeader className="bg-purple-50 pb-2">
              <CardTitle className="text-sm">عدد المعلمين</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{teachersCount}</p>
            </CardContent>
          </Card>

          <Card className="border border-orange-500">
            <CardHeader className="bg-orange-50 pb-2">
              <CardTitle className="text-sm">عدد التقارير</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{reports.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Levels Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Performance Levels Table */}
          <Card className="border-2 border-gray-300">
            <CardHeader className="bg-gradient-to-r from-gray-100 to-white border-b">
              <CardTitle className="text-lg">توزيع المستويات</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2">
                {performanceLevelsData.map((level, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ backgroundColor: `${level.color}20` }}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: level.color }}
                      />
                      <span className="font-medium">{level.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-lg">{level.value}</span>
                      <span className="text-muted-foreground">
                        ({reports.length > 0 ? ((level.value / reports.length) * 100).toFixed(1) : 0}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Bar Chart */}
          <Card className="border-2 border-gray-300">
            <CardHeader className="bg-gradient-to-r from-gray-100 to-white border-b">
              <CardTitle className="text-lg">مخطط توزيع المستويات</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`${value} اختبار`, 'العدد']}
                      labelFormatter={(label) => `المستوى: ${label}`}
                    />
                    <Bar dataKey="count" name="العدد">
                      {barChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Subject Performance Chart */}
        <Card className="border-2 border-red-500">
          <CardHeader className="bg-gradient-to-r from-red-100 to-white border-b border-red-500">
            <CardTitle>رسم بياني لنسب النجاح حسب المواد</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[400px] w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 30, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      interval={0} 
                      height={70}
                    />
                    <YAxis 
                      domain={[0, 100]} 
                      label={{ 
                        value: 'نسبة النجاح (%)', 
                        angle: -90, 
                        position: 'insideLeft',
                        style: { textAnchor: 'middle' } 
                      }}
                    />
                    <Tooltip formatter={(value) => [`${value}%`, 'نسبة النجاح']} />
                    <Legend />
                    <Bar 
                      dataKey="نسبة_النجاح" 
                      name="نسبة النجاح" 
                      fill="#34D399" 
                      barSize={30}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  لا توجد بيانات كافية لعرض الإحصائيات
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};

export default StatisticsTab;
