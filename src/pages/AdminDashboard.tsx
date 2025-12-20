import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, FileText, TrendingUp, Users, Key, LogOut, Shield } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Import custom components
import AdminLoginForm from "@/components/admin/AdminLoginForm";
import ReportsTab from "@/components/admin/ReportsTab";
import StatisticsTab from "@/components/admin/StatisticsTab";
import TeachersTab from "@/components/admin/TeachersTab";
import SettingsTab from "@/components/admin/SettingsTab";
import ClassesTab from "@/components/admin/ClassesTab";
import SubjectsTab from "@/components/admin/SubjectsTab";
import StudentsTab from "@/components/admin/StudentsTab";
import PerformanceLevelsTab from "@/components/admin/PerformanceLevelsTab";
import HeaderSettingsTab from "@/components/admin/HeaderSettingsTab";
import SummaryTab from "@/components/admin/SummaryTab";
import ReportPreview from "@/components/ReportPreview";
import FeatureToggle from "@/components/admin/FeatureToggle";
import ChangePasswordDialog from "@/components/ChangePasswordDialog";
import BackupTab from "@/components/admin/BackupTab";
import WisdomsTab from "@/components/admin/WisdomsTab";
import TestsTab from "@/components/admin/TestsTab";

// Import utility functions
import { prepareMockReports, prepareChartData, Report } from "@/utils/reportUtils";
import { getTeachers, saveTeachers, TeacherWithCredentials, getTests } from "@/services/dataService";

const AdminDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [adminId, setAdminId] = useState("");
  const [adminRole, setAdminRole] = useState("school_admin");
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  
  // Filter states
  const [selectedClass, setSelectedClass] = useState("");
  const [mockReports, setMockReports] = useState<Report[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  
  // Teachers management
  const [teachers, setTeachers] = useState<TeacherWithCredentials[]>([]);
  
  // Tests and report preview
  const [tests, setTests] = useState<any[]>([]);
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [showReportPreview, setShowReportPreview] = useState(false);
  
  // Initialize teachers from dataService
  useEffect(() => {
    setTeachers(getTeachers());
  }, []);
  
  // Initialize reports data
  useEffect(() => {
    const reports = prepareMockReports();
    setMockReports(reports);
    setTests(getTests());
  }, []);
  
  // Update chart data when filters change
  useEffect(() => {
    setChartData(prepareChartData(mockReports, selectedClass));
  }, [selectedClass, mockReports]);
  
  // Check if admin is already logged in
  useEffect(() => {
    const schoolAdminId = localStorage.getItem("schoolAdminId");
    const schoolAdminName = localStorage.getItem("schoolAdminName");
    const storedRole = localStorage.getItem("adminRole");
    if (schoolAdminId) {
      setIsLoggedIn(true);
      setAdminName(schoolAdminName || "");
      setAdminId(schoolAdminId);
      setAdminRole(storedRole || "school_admin");
    }
  }, []);
  
  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("schoolAdminId");
    localStorage.removeItem("schoolAdminName");
    localStorage.removeItem("adminRole");
    
    toast({
      title: "تم تسجيل الخروج",
      description: "تم تسجيل خروجك من النظام بنجاح",
    });
  };

  const handleViewReport = (test: any) => {
    setSelectedTest(test);
    setShowReportPreview(true);
  };

  // Get recent tests (last 5)
  const recentTests = tests.slice(-5).reverse();

  const handleLoginSuccess = () => {
    const schoolAdminId = localStorage.getItem("schoolAdminId");
    const schoolAdminName = localStorage.getItem("schoolAdminName");
    const storedRole = localStorage.getItem("adminRole");
    if (schoolAdminId) {
      setIsLoggedIn(true);
      setAdminName(schoolAdminName || "");
      setAdminId(schoolAdminId);
      setAdminRole(storedRole || "school_admin");
    }
  };

  // Login form
  if (!isLoggedIn) {
    return <AdminLoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-white to-green-50">
      <Navbar />
      <main className="flex-1 container mx-auto p-6 dir-rtl">
        <div className="flex justify-between items-center mb-8 pb-4 border-b-2 border-red-500">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-3xl font-bold text-black">لوحة تحكم مدير المدرسة</h1>
              <p className="text-muted-foreground flex items-center gap-2">
                {adminName ? `مرحباً ${adminName}` : "إدارة كاملة للمعلمين والطلاب والصفوف والمواد"}
                {adminRole && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-primary/10 text-primary">
                    <Shield className="h-3 w-3" />
                    {adminRole === 'super_admin' ? 'مدير النظام' : 'مدير المدرسة'}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Key className="ml-2 h-4 w-4" />
                  الإعدادات
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setShowPasswordChange(true)}>
                  <Key className="ml-2 h-4 w-4" />
                  تغيير كلمة المرور
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-500">
                  <LogOut className="ml-2 h-4 w-4" />
                  تسجيل الخروج
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Quick Stats and Recent Reports */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Quick Stats */}
          <Card className="border-2 border-green-500">
            <CardHeader className="bg-green-50 pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                إحصائيات سريعة
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{tests.length}</p>
                  <p className="text-sm text-muted-foreground">اختبارات</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{teachers.length}</p>
                  <p className="text-sm text-muted-foreground">معلمين</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {mockReports.length > 0 
                      ? Math.round(mockReports.reduce((sum, r) => sum + r.passRate, 0) / mockReports.length)
                      : 0}%
                  </p>
                  <p className="text-sm text-muted-foreground">نسبة النجاح</p>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">{mockReports.length}</p>
                  <p className="text-sm text-muted-foreground">تقارير</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Reports */}
          <Card className="lg:col-span-2 border-2 border-blue-500">
            <CardHeader className="bg-blue-50 pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                آخر التقارير
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {recentTests.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الاختبار</TableHead>
                      <TableHead>المادة</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>نسبة النجاح</TableHead>
                      <TableHead>عرض</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTests.map((test) => {
                      const report = mockReports.find(r => r.testId === test.id);
                      return (
                        <TableRow key={test.id} className="hover:bg-blue-50">
                          <TableCell className="font-medium">{test.name}</TableCell>
                          <TableCell>{report?.subjectName || "-"}</TableCell>
                          <TableCell>{test.date}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-sm ${
                              (report?.passRate || 0) >= 75 
                                ? "bg-green-100 text-green-700" 
                                : (report?.passRate || 0) >= 50 
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-red-100 text-red-700"
                            }`}>
                              {report?.passRate?.toFixed(1) || 0}%
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewReport(test)}
                              className="text-blue-600 hover:bg-blue-50"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>لا توجد تقارير حتى الآن</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="teachers" className="space-y-6">
          <TabsList className="grid grid-cols-7 lg:grid-cols-14 w-full mb-6">
            <TabsTrigger value="teachers">المعلمين</TabsTrigger>
            <TabsTrigger value="students">الطلاب</TabsTrigger>
            <TabsTrigger value="classes">الصفوف</TabsTrigger>
            <TabsTrigger value="subjects">المواد</TabsTrigger>
            <TabsTrigger value="tests">الاختبارات</TabsTrigger>
            <TabsTrigger value="reports">التقارير</TabsTrigger>
            <TabsTrigger value="summary">الملخص</TabsTrigger>
            <TabsTrigger value="statistics">الإحصائيات</TabsTrigger>
            <TabsTrigger value="levels">المستويات</TabsTrigger>
            <TabsTrigger value="header">الترويسة</TabsTrigger>
            <TabsTrigger value="wisdoms">الحكم</TabsTrigger>
            <TabsTrigger value="features">الميزات</TabsTrigger>
            <TabsTrigger value="backup">النسخ الاحتياطي</TabsTrigger>
            <TabsTrigger value="settings">الإعدادات</TabsTrigger>
          </TabsList>
          
          <TabsContent value="teachers">
            <TeachersTab />
          </TabsContent>

          <TabsContent value="students">
            <StudentsTab />
          </TabsContent>

          <TabsContent value="classes">
            <ClassesTab />
          </TabsContent>

          <TabsContent value="subjects">
            <SubjectsTab />
          </TabsContent>
          
          <TabsContent value="tests">
            <TestsTab />
          </TabsContent>
          
          <TabsContent value="reports">
            <ReportsTab mockReports={mockReports} />
          </TabsContent>

          <TabsContent value="summary">
            <SummaryTab />
          </TabsContent>
          
          <TabsContent value="statistics">
            <StatisticsTab 
              mockReports={mockReports}
              testsCount={tests.length}
              teachersCount={teachers.length}
              selectedClass={selectedClass}
              chartData={chartData}
            />
          </TabsContent>

          <TabsContent value="levels">
            <PerformanceLevelsTab />
          </TabsContent>

          <TabsContent value="header">
            <HeaderSettingsTab />
          </TabsContent>

          <TabsContent value="wisdoms">
            <WisdomsTab />
          </TabsContent>

          <TabsContent value="features">
            <Card className="border-2 border-purple-500">
              <CardHeader className="bg-purple-50 pb-2">
                <CardTitle className="text-lg">الميزات الاختيارية</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <FeatureToggle />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="backup">
            <BackupTab />
          </TabsContent>
          
          <TabsContent value="settings">
            <SettingsTab />
          </TabsContent>
        </Tabs>
      </main>

      {/* Report Preview Dialog */}
      {selectedTest && (
        <ReportPreview
          test={selectedTest}
          open={showReportPreview}
          onClose={() => {
            setShowReportPreview(false);
            setSelectedTest(null);
          }}
        />
      )}

      {/* Change Password Dialog */}
      {adminId && (
        <ChangePasswordDialog
          open={showPasswordChange}
          adminId={adminId}
          isForced={false}
          onSuccess={() => {
            setShowPasswordChange(false);
            toast({
              title: "تم التحديث",
              description: "تم تغيير كلمة المرور بنجاح",
            });
          }}
          onClose={() => setShowPasswordChange(false)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
