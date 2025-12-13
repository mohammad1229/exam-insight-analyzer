import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

// Import custom components
import AdminLoginForm from "@/components/admin/AdminLoginForm";
import ReportsTab from "@/components/admin/ReportsTab";
import StatisticsTab from "@/components/admin/StatisticsTab";
import TeachersTab from "@/components/admin/TeachersTab";
import SettingsTab from "@/components/admin/SettingsTab";
import ClassesTab from "@/components/admin/ClassesTab";
import SubjectsTab from "@/components/admin/SubjectsTab";
import StudentsTab from "@/components/admin/StudentsTab";

// Import utility functions
import { prepareMockReports, prepareChartData, Report } from "@/utils/reportUtils";
import { getTeachers, saveTeachers, TeacherWithCredentials } from "@/services/dataService";

const AdminDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Filter states
  const [selectedClass, setSelectedClass] = useState("");
  const [mockReports, setMockReports] = useState<Report[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  
  // Teachers management
  const [teachers, setTeachers] = useState<TeacherWithCredentials[]>([]);
  
  // Initialize teachers from dataService
  useEffect(() => {
    setTeachers(getTeachers());
  }, []);
  
  // Initialize reports data
  useEffect(() => {
    const reports = prepareMockReports();
    setMockReports(reports);
  }, []);
  
  // Update chart data when filters change
  useEffect(() => {
    setChartData(prepareChartData(mockReports, selectedClass));
  }, [selectedClass, mockReports]);
  
  // Check if admin is already logged in
  useEffect(() => {
    const adminLoggedIn = localStorage.getItem("adminLoggedIn");
    if (adminLoggedIn === "true") {
      setIsLoggedIn(true);
    }
  }, []);
  
  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("adminLoggedIn");
    
    toast({
      title: "تم تسجيل الخروج",
      description: "تم تسجيل خروجك من النظام بنجاح",
    });
  };

  // Login form
  if (!isLoggedIn) {
    return <AdminLoginForm />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-white to-green-50">
      <Navbar />
      <main className="flex-1 container mx-auto p-6 dir-rtl">
        <div className="flex justify-between items-center mb-8 pb-4 border-b-2 border-red-500">
          <div>
            <h1 className="text-3xl font-bold text-black">لوحة تحكم مدير المدرسة</h1>
            <p className="text-muted-foreground">إدارة كاملة للمعلمين والطلاب والصفوف والمواد</p>
          </div>
          <Button 
            onClick={handleLogout}
            variant="outline"
            className="border-red-500 text-red-500 hover:bg-red-50"
          >
            تسجيل الخروج
          </Button>
        </div>

        <Tabs defaultValue="teachers" className="space-y-6">
          <TabsList className="grid grid-cols-7 w-full mb-6">
            <TabsTrigger value="teachers">المعلمين</TabsTrigger>
            <TabsTrigger value="students">الطلاب</TabsTrigger>
            <TabsTrigger value="classes">الصفوف</TabsTrigger>
            <TabsTrigger value="subjects">المواد</TabsTrigger>
            <TabsTrigger value="reports">التقارير</TabsTrigger>
            <TabsTrigger value="statistics">الإحصائيات</TabsTrigger>
            <TabsTrigger value="settings">الإعدادات</TabsTrigger>
          </TabsList>
          
          <TabsContent value="teachers">
            <TeachersTab 
              teachers={teachers}
              setTeachers={setTeachers}
            />
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
          
          <TabsContent value="reports">
            <ReportsTab mockReports={mockReports} />
          </TabsContent>
          
          <TabsContent value="statistics">
            <StatisticsTab 
              mockReports={mockReports}
              testsCount={mockReports.length}
              teachersCount={teachers.length}
              selectedClass={selectedClass}
              chartData={chartData}
            />
          </TabsContent>
          
          <TabsContent value="settings">
            <SettingsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
