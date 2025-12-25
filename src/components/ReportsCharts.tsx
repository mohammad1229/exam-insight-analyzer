import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from "recharts";
import { BarChart3, PieChart as PieChartIcon, TrendingUp, Award, Users } from "lucide-react";
import { DBPerformanceLevel } from "@/services/databaseService";
import { TestResult } from "@/types";

interface ReportsChartsProps {
  results: TestResult[];
  performanceLevels: DBPerformanceLevel[];
}

// Palestinian flag colors
const CHART_COLORS = {
  primary: "#E84C3D",
  secondary: "#000000",
  accent: "#34A853",
  neutral: "#6B7280",
};

const ReportsCharts: React.FC<ReportsChartsProps> = ({ results, performanceLevels }) => {
  const presentStudents = results.filter(r => !r.isAbsent);
  const absentStudents = results.filter(r => r.isAbsent);
  const passedStudents = presentStudents.filter(s => (s.percentage || 0) >= 50);
  const failedStudents = presentStudents.filter(s => (s.percentage || 0) < 50);

  // Performance level distribution based on admin settings
  const performanceLevelData = useMemo(() => {
    if (performanceLevels.length === 0) {
      // Default levels if none configured
      return [
        { name: "ممتاز", min: 90, max: 100, color: "#22C55E", count: 0 },
        { name: "جيد جداً", min: 80, max: 89, color: "#34A853", count: 0 },
        { name: "جيد", min: 70, max: 79, color: "#3B82F6", count: 0 },
        { name: "مقبول", min: 50, max: 69, color: "#F59E0B", count: 0 },
        { name: "ضعيف", min: 0, max: 49, color: "#EF4444", count: 0 },
      ].map(level => {
        const count = presentStudents.filter(
          s => (s.percentage || 0) >= level.min && (s.percentage || 0) <= level.max
        ).length;
        return { ...level, count };
      });
    }

    return performanceLevels
      .sort((a, b) => b.min_score - a.min_score)
      .map(level => {
        const count = presentStudents.filter(
          s => (s.percentage || 0) >= level.min_score && (s.percentage || 0) <= level.max_score
        ).length;
        return {
          name: level.name,
          min: level.min_score,
          max: level.max_score,
          color: level.color,
          count
        };
      });
  }, [performanceLevels, presentStudents]);

  // Pass/Fail pie data
  const passFailData = [
    { name: "ناجح", value: passedStudents.length, color: CHART_COLORS.accent },
    { name: "راسب", value: failedStudents.length, color: CHART_COLORS.primary },
  ];

  // Attendance pie data
  const attendanceData = [
    { name: "حاضر", value: presentStudents.length, color: CHART_COLORS.accent },
    { name: "غائب", value: absentStudents.length, color: CHART_COLORS.neutral },
  ];

  // Score distribution
  const scoreDistribution = useMemo(() => {
    const ranges = [
      { range: "0-20%", min: 0, max: 20, count: 0, color: CHART_COLORS.primary },
      { range: "21-40%", min: 21, max: 40, count: 0, color: "#F59E0B" },
      { range: "41-60%", min: 41, max: 60, count: 0, color: "#3B82F6" },
      { range: "61-80%", min: 61, max: 80, count: 0, color: "#34A853" },
      { range: "81-100%", min: 81, max: 100, count: 0, color: "#22C55E" }
    ];

    presentStudents.forEach(student => {
      const pct = student.percentage || 0;
      const range = ranges.find(r => pct >= r.min && pct <= r.max);
      if (range) range.count++;
    });

    return ranges;
  }, [presentStudents]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg" dir="rtl">
          <p className="font-semibold text-foreground">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color || entry.fill }} className="text-sm">
              {entry.name}: {entry.value}
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
      <ul className="flex flex-wrap justify-center gap-3 mt-4" dir="rtl">
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

  if (presentStudents.length === 0) {
    return (
      <Card className="border-2 border-amber-500 shadow-lg bg-white">
        <CardContent className="py-12 text-center">
          <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg text-muted-foreground">لا توجد نتائج لعرض المخططات البيانية</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-gradient-to-r from-primary to-accent p-3 rounded-xl">
          <BarChart3 className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground">المخططات البيانية للتقرير</h3>
          <p className="text-sm text-muted-foreground">تحليل بصري لنتائج الاختبار</p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/30">
          <CardContent className="pt-4 text-center">
            <Award className="h-8 w-8 mx-auto text-green-600 mb-2" />
            <p className="text-2xl font-bold text-green-600">{passedStudents.length}</p>
            <p className="text-sm text-muted-foreground">ناجح</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/30">
          <CardContent className="pt-4 text-center">
            <TrendingUp className="h-8 w-8 mx-auto text-red-600 mb-2" />
            <p className="text-2xl font-bold text-red-600">{failedStudents.length}</p>
            <p className="text-sm text-muted-foreground">راسب</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/30">
          <CardContent className="pt-4 text-center">
            <Users className="h-8 w-8 mx-auto text-blue-600 mb-2" />
            <p className="text-2xl font-bold text-blue-600">{presentStudents.length}</p>
            <p className="text-sm text-muted-foreground">حاضر</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-gray-500/10 to-gray-500/5 border-gray-500/30">
          <CardContent className="pt-4 text-center">
            <Users className="h-8 w-8 mx-auto text-gray-600 mb-2" />
            <p className="text-2xl font-bold text-gray-600">{absentStudents.length}</p>
            <p className="text-sm text-muted-foreground">غائب</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Levels Chart */}
        <Card className="border-2 border-primary/30 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent border-b">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-primary" />
              توزيع المستويات الأدائية
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={performanceLevelData} 
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--foreground))" />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    stroke="hsl(var(--foreground))"
                    width={80}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="count" 
                    name="عدد الطلاب"
                    radius={[0, 8, 8, 0]}
                  >
                    {performanceLevelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pass/Fail Pie Chart */}
        <Card className="border-2 border-accent/30 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-accent/10 to-transparent border-b">
            <CardTitle className="flex items-center gap-2 text-lg">
              <PieChartIcon className="h-5 w-5 text-accent" />
              نسبة النجاح والرسوب
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={passFailData}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {passFailData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend content={renderLegend} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Score Distribution */}
        <Card className="border-2 border-blue-500/30 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-500/10 to-transparent border-b">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              توزيع الدرجات
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={scoreDistribution} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="range" stroke="hsl(var(--foreground))" />
                  <YAxis stroke="hsl(var(--foreground))" />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    name="عدد الطلاب"
                    stroke="#3B82F6" 
                    fill="url(#colorCount)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Chart */}
        <Card className="border-2 border-gray-500/30 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-500/10 to-transparent border-b">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-gray-600" />
              نسبة الحضور والغياب
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={attendanceData}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {attendanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend content={renderLegend} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Levels Table */}
      {performanceLevels.length > 0 && (
        <Card className="border-2 border-secondary/30 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-secondary/10 to-transparent border-b">
            <CardTitle className="text-lg">جدول المستويات الأدائية</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {performanceLevelData.map((level, index) => (
                <div 
                  key={index}
                  className="p-4 rounded-xl text-center transition-transform hover:scale-105"
                  style={{ 
                    backgroundColor: `${level.color}15`,
                    borderWidth: 2,
                    borderColor: `${level.color}50`
                  }}
                >
                  <div 
                    className="w-4 h-4 rounded-full mx-auto mb-2"
                    style={{ backgroundColor: level.color }}
                  />
                  <p className="font-bold text-lg" style={{ color: level.color }}>{level.count}</p>
                  <p className="text-sm font-medium text-foreground">{level.name}</p>
                  <p className="text-xs text-muted-foreground">{level.min}% - {level.max}%</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReportsCharts;
