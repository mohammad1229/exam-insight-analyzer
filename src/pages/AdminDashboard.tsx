
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { teachersData } from "@/data/mockData";

// Import custom components
import AdminLoginForm from "@/components/admin/AdminLoginForm";
import ReportsTab from "@/components/admin/ReportsTab";
import StatisticsTab from "@/components/admin/StatisticsTab";
import TeachersTab from "@/components/admin/TeachersTab";
import SettingsTab from "@/components/admin/SettingsTab";

// Import utility functions
import { prepareMockReports, prepareChartData, Report } from "@/utils/reportUtils";
import { Teacher } from "@/types";

// Custom teacher type with credentials
interface TeacherWithCredentials extends Teacher {
  username: string;
  password: string;
  assignedClasses: string[];
  assignedSubjects: string[];
}

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
  
  // Initialize teachers from localStorage or teachersData
  useEffect(() => {
    const storedTeachers = localStorage.getItem("teachersWithCredentials");
    if (storedTeachers) {
      setTeachers(JSON.parse(storedTeachers));
    } else {
      // Initialize with mock data
      const initialTeachers = teachersData.map(teacher => ({
        ...teacher,
        username: teacher.name.split(' ')[0].toLowerCase(),
        password: "12345",
        assignedClasses: [teachersData[0]?.subjects[0] || ""],
        assignedSubjects: teacher.subjects
      }));
      setTeachers(initialTeachers);
      localStorage.setItem("teachersWithCredentials", JSON.stringify(initialTeachers));
    }
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
            <p className="text-muted-foreground">مراجعة تقارير المعلمين ونتائج الاختبارات</p>
          </div>
          <Button 
            onClick={handleLogout}
            variant="outline"
            className="border-red-500 text-red-500 hover:bg-red-50"
          >
            تسجيل الخروج
          </Button>
        </div>

        <Tabs defaultValue="reports" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-[500px] mb-6">
            <TabsTrigger value="reports">تقارير الاختبارات</TabsTrigger>
            <TabsTrigger value="statistics">إحصائيات</TabsTrigger>
            <TabsTrigger value="teachers">إدارة المعلمين</TabsTrigger>
            <TabsTrigger value="settings">الإعدادات</TabsTrigger>
          </TabsList>
          
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
          
          <TabsContent value="teachers">
            <TeachersTab 
              teachers={teachers}
              setTeachers={setTeachers}
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
