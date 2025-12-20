import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Users, GraduationCap, BookOpen, FileText, TrendingUp, Calendar } from "lucide-react";
import { getStudents, getTeachers, getClasses, getTests, getSubjects, isTeacherOnly } from "@/services/dataService";
import { useLicenseContext } from "@/contexts/LicenseContext";
import LicenseBanner from "@/components/LicenseBanner";
import AnimatedBackground from "@/components/AnimatedBackground";
import PageTransition from "@/components/PageTransition";
import ThemeToggle from "@/components/ThemeToggle";
import ColorCustomizer from "@/components/ColorCustomizer";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const SchoolStatistics = () => {
  const navigate = useNavigate();
  const { schoolName } = useLicenseContext();
  
  // منع المعلمين من الوصول لهذه الصفحة
  useEffect(() => {
    if (isTeacherOnly()) {
      navigate('/dashboard');
    }
  }, [navigate]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalTests: 0,
    totalSubjects: 0,
    averagePassRate: 0
  });
  const [testsPerMonth, setTestsPerMonth] = useState<any[]>([]);
  const [studentsPerClass, setStudentsPerClass] = useState<any[]>([]);
  const [testTypeDistribution, setTestTypeDistribution] = useState<any[]>([]);

  useEffect(() => {
    const students = getStudents();
    const teachers = getTeachers();
    const classes = getClasses();
    const tests = getTests();
    const subjects = getSubjects();

    // Calculate basic stats
    // Calculate pass rate from results
    const calculatePassRate = (test: any) => {
      if (!test.results || test.results.length === 0) return 0;
      const passed = test.results.filter((r: any) => !r.isAbsent && r.percentage >= 50).length;
      const total = test.results.filter((r: any) => !r.isAbsent).length;
      return total > 0 ? Math.round((passed / total) * 100) : 0;
    };

    const avgPassRate = tests.length > 0 
      ? Math.round(tests.reduce((acc, t) => acc + calculatePassRate(t), 0) / tests.length)
      : 0;

    setStats({
      totalStudents: students.length,
      totalTeachers: teachers.length,
      totalClasses: classes.length,
      totalTests: tests.length,
      totalSubjects: subjects.length,
      averagePassRate: avgPassRate
    });

    // Calculate tests per month
    const monthlyTests: Record<string, number> = {};
    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 
                        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    
    tests.forEach(test => {
      const date = new Date(test.date);
      const monthKey = monthNames[date.getMonth()];
      monthlyTests[monthKey] = (monthlyTests[monthKey] || 0) + 1;
    });

    setTestsPerMonth(
      Object.entries(monthlyTests).map(([month, count]) => ({
        name: month,
        الاختبارات: count
      }))
    );

    // Calculate students per class
    const classStudents: Record<string, number> = {};
    students.forEach(student => {
      const cls = classes.find(c => c.id === student.classId);
      const className = cls?.name || 'غير محدد';
      classStudents[className] = (classStudents[className] || 0) + 1;
    });

    setStudentsPerClass(
      Object.entries(classStudents).map(([name, value]) => ({
        name,
        value
      }))
    );

    // Calculate test type distribution
    const typeCount: Record<string, number> = {};
    tests.forEach(test => {
      const type = test.type || 'أخرى';
      typeCount[type] = (typeCount[type] || 0) + 1;
    });

    setTestTypeDistribution(
      Object.entries(typeCount).map(([name, value]) => ({
        name: name === 'monthly' ? 'شهري' : 
              name === 'midterm' ? 'نصف الفصل' : 
              name === 'final' ? 'نهائي' : name,
        value
      }))
    );
  }, []);

  return (
    <PageTransition className="min-h-screen">
      <AnimatedBackground>
        <LicenseBanner />
        <header className="bg-secondary/90 dark:bg-gray-900/90 backdrop-blur text-secondary-foreground shadow-sm">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center dir-rtl">
            <h1 className="text-2xl font-bold">إحصائيات المدرسة</h1>
            <div className="flex items-center gap-4">
              <span className="text-accent">{schoolName}</span>
              <ThemeToggle />
              <ColorCustomizer />
              <Button 
                variant="outline" 
                className="border-white/30 text-white hover:bg-white/20"
                onClick={() => navigate("/")}
              >
                <ArrowRight className="h-4 w-4 ml-2" />
                الرئيسية
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 dir-rtl">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2 text-foreground">لوحة الإحصائيات</h2>
            <p className="text-muted-foreground">نظرة شاملة على بيانات المدرسة</p>
          </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card className="border-2 border-green-500">
            <CardContent className="p-4 flex flex-col items-center">
              <Users className="h-8 w-8 text-green-600 mb-2" />
              <span className="text-3xl font-bold">{stats.totalStudents}</span>
              <span className="text-sm text-muted-foreground">الطلاب</span>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-500">
            <CardContent className="p-4 flex flex-col items-center">
              <GraduationCap className="h-8 w-8 text-blue-600 mb-2" />
              <span className="text-3xl font-bold">{stats.totalTeachers}</span>
              <span className="text-sm text-muted-foreground">المعلمون</span>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-500">
            <CardContent className="p-4 flex flex-col items-center">
              <BookOpen className="h-8 w-8 text-purple-600 mb-2" />
              <span className="text-3xl font-bold">{stats.totalClasses}</span>
              <span className="text-sm text-muted-foreground">الصفوف</span>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-500">
            <CardContent className="p-4 flex flex-col items-center">
              <FileText className="h-8 w-8 text-orange-600 mb-2" />
              <span className="text-3xl font-bold">{stats.totalTests}</span>
              <span className="text-sm text-muted-foreground">الاختبارات</span>
            </CardContent>
          </Card>

          <Card className="border-2 border-pink-500">
            <CardContent className="p-4 flex flex-col items-center">
              <Calendar className="h-8 w-8 text-pink-600 mb-2" />
              <span className="text-3xl font-bold">{stats.totalSubjects}</span>
              <span className="text-sm text-muted-foreground">المواد</span>
            </CardContent>
          </Card>

          <Card className="border-2 border-emerald-500">
            <CardContent className="p-4 flex flex-col items-center">
              <TrendingUp className="h-8 w-8 text-emerald-600 mb-2" />
              <span className="text-3xl font-bold">{stats.averagePassRate}%</span>
              <span className="text-sm text-muted-foreground">معدل النجاح</span>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tests per Month */}
          <Card className="border-2 border-green-500">
            <CardHeader className="bg-gradient-to-r from-green-100 to-white border-b border-green-500">
              <CardTitle>الاختبارات الشهرية</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={testsPerMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="الاختبارات" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Students per Class */}
          <Card className="border-2 border-blue-500">
            <CardHeader className="bg-gradient-to-r from-blue-100 to-white border-b border-blue-500">
              <CardTitle>توزيع الطلاب على الصفوف</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={studentsPerClass}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {studentsPerClass.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Test Type Distribution */}
          <Card className="border-2 border-purple-500">
            <CardHeader className="bg-gradient-to-r from-purple-100 to-white border-b border-purple-500">
              <CardTitle>أنواع الاختبارات</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={testTypeDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {testTypeDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Pass Rate Trend */}
          <Card className="border-2 border-orange-500">
            <CardHeader className="bg-gradient-to-r from-orange-100 to-white border-b border-orange-500">
              <CardTitle>ملخص الإحصائيات</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="font-medium">إجمالي الطلاب</span>
                  <span className="text-2xl font-bold text-green-600">{stats.totalStudents}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="font-medium">إجمالي المعلمين</span>
                  <span className="text-2xl font-bold text-blue-600">{stats.totalTeachers}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <span className="font-medium">إجمالي الاختبارات</span>
                  <span className="text-2xl font-bold text-purple-600">{stats.totalTests}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
                  <span className="font-medium">متوسط معدل النجاح</span>
                  <span className="text-2xl font-bold text-emerald-600">{stats.averagePassRate}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      </AnimatedBackground>
    </PageTransition>
  );
};

export default SchoolStatistics;
