import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { getPerformanceLevels } from "./PerformanceLevelsTab";

interface StatisticsTabProps {
  mockReports: {
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
  }[];
  testsCount: number;
  teachersCount: number;
  selectedClass: string;
  chartData: {
    name: string;
    نسبة_النجاح: number;
    اختبارات: number;
  }[];
}

// Get performance levels from settings
const getLevelColors = () => {
  const levels = getPerformanceLevels();
  return {
    excellent: levels.excellent.color,
    good: levels.good.color,
    average: levels.average.color,
    low: levels.low.color,
    failed: levels.failed.color
  };
};

const StatisticsTab = ({ 
  mockReports, 
  testsCount,
  teachersCount, 
  selectedClass,
  chartData 
}: StatisticsTabProps) => {
  // Get current performance levels from settings
  const levels = getPerformanceLevels();
  const LEVEL_COLORS = getLevelColors();

  // Calculate average pass rate
  const avgPassRate = mockReports.length > 0
    ? Math.round(mockReports.reduce((sum, r) => sum + r.passRate, 0) / mockReports.length)
    : 0;

  // Calculate performance levels distribution using dynamic settings
  const excellentCount = mockReports.filter(r => r.passRate >= levels.excellent.min).length;
  const goodCount = mockReports.filter(r => r.passRate >= levels.good.min && r.passRate < levels.excellent.min).length;
  const averageCount = mockReports.filter(r => r.passRate >= levels.average.min && r.passRate < levels.good.min).length;
  const lowCount = mockReports.filter(r => r.passRate >= levels.low.min && r.passRate < levels.average.min).length;
  const failedCount = mockReports.filter(r => r.passRate < levels.low.min).length;

  const performanceLevelsData = [
    { name: `ممتاز (${levels.excellent.min}%+)`, value: excellentCount, color: LEVEL_COLORS.excellent },
    { name: `جيد (${levels.good.min}-${levels.excellent.min - 1}%)`, value: goodCount, color: LEVEL_COLORS.good },
    { name: `متوسط (${levels.average.min}-${levels.good.min - 1}%)`, value: averageCount, color: LEVEL_COLORS.average },
    { name: `متدني (${levels.low.min}-${levels.average.min - 1}%)`, value: lowCount, color: LEVEL_COLORS.low },
    { name: `راسب (<${levels.low.min}%)`, value: failedCount, color: LEVEL_COLORS.failed },
  ];

  const barChartData = [
    { name: "ممتاز", count: excellentCount, fill: LEVEL_COLORS.excellent },
    { name: "جيد", count: goodCount, fill: LEVEL_COLORS.good },
    { name: "متوسط", count: averageCount, fill: LEVEL_COLORS.average },
    { name: "متدني", count: lowCount, fill: LEVEL_COLORS.low },
    { name: "راسب", count: failedCount, fill: LEVEL_COLORS.failed },
  ];

  return (
    <Card className="border-2 border-black">
      <CardHeader className="bg-gradient-to-r from-gray-100 to-white border-b border-black">
        <CardTitle>إحصائيات المدرسة</CardTitle>
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
              <p className="text-3xl font-bold">{mockReports.length}</p>
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
                        ({mockReports.length > 0 ? ((level.value / mockReports.length) * 100).toFixed(1) : 0}%)
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
            <CardTitle>
              رسم بياني لنسب النجاح حسب المواد
              {selectedClass && ` - ${selectedClass}`}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[400px] w-full">
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
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};

export default StatisticsTab;
