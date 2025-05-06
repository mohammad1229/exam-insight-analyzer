
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartContainer } from "@/components/ui/chart";

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

const StatisticsTab = ({ 
  mockReports, 
  testsCount,
  teachersCount, 
  selectedClass,
  chartData 
}: StatisticsTabProps) => {
  // Calculate average pass rate
  const avgPassRate = mockReports.length > 0
    ? Math.round(mockReports.reduce((sum, r) => sum + r.passRate, 0) / mockReports.length)
    : 0;

  return (
    <Card className="border-2 border-black">
      <CardHeader className="bg-gradient-to-r from-gray-100 to-white border-b border-black">
        <CardTitle>إحصائيات المدرسة</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="border border-green-500">
            <CardHeader className="bg-green-50 pb-2">
              <CardTitle className="text-sm">عدد الاختبارات</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{testsCount}</p>
            </CardContent>
          </Card>
          
          <Card className="border border-green-500">
            <CardHeader className="bg-green-50 pb-2">
              <CardTitle className="text-sm">متوسط نسب النجاح</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{avgPassRate}%</p>
            </CardContent>
          </Card>
          
          <Card className="border border-green-500">
            <CardHeader className="bg-green-50 pb-2">
              <CardTitle className="text-sm">عدد المعلمين</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{teachersCount}</p>
            </CardContent>
          </Card>
        </div>
        
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
