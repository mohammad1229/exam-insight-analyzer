
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  testsData, 
  classesData, 
  subjectsData,
  teachersData,
  getClassById,
  getSectionById,
  getSubjectById,
  getTeacherById
} from "@/data/mockData";

// Mock reports data (in a real app, this would come from a database)
const mockReports = testsData.map(test => {
  const classObj = getClassById(test.classId);
  const section = getSectionById(test.classId, test.sectionId);
  const subject = getSubjectById(test.subjectId);
  const teacher = getTeacherById(test.teacherId);
  
  return {
    id: `report_${test.id}`,
    testId: test.id,
    testName: test.name,
    className: classObj?.name || '',
    sectionName: section?.name || '',
    subjectName: subject?.name || '',
    teacherName: teacher?.name || '',
    date: test.date,
    totalStudents: test.results.filter(r => !r.isAbsent).length,
    passedStudents: test.results.filter(r => !r.isAbsent && r.percentage >= 50).length,
    passRate: (() => {
      const present = test.results.filter(r => !r.isAbsent).length;
      const passed = test.results.filter(r => !r.isAbsent && r.percentage >= 50).length;
      return present > 0 ? Math.round((passed / present) * 100) : 0;
    })()
  };
});

const AdminDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  // Filter states
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  
  // Check if admin is already logged in
  useEffect(() => {
    const adminLoggedIn = localStorage.getItem("adminLoggedIn");
    if (adminLoggedIn === "true") {
      setIsLoggedIn(true);
    }
  }, []);
  
  const handleLogin = () => {
    // Simple authentication - in a real app use proper authentication
    if (username === "admin" && password === "12345") {
      setIsLoggedIn(true);
      localStorage.setItem("adminLoggedIn", "true");
      
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: "مرحباً بك في لوحة تحكم مدير المدرسة",
      });
    } else {
      toast({
        title: "فشل تسجيل الدخول",
        description: "اسم المستخدم أو كلمة المرور غير صحيحة",
        variant: "destructive",
      });
    }
  };
  
  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("adminLoggedIn");
    
    toast({
      title: "تم تسجيل الخروج",
      description: "تم تسجيل خروجك من النظام بنجاح",
    });
  };
  
  // Filter reports based on selections
  const filteredReports = mockReports.filter(report => {
    let matches = true;
    
    if (selectedClass && report.className !== selectedClass) {
      matches = false;
    }
    
    if (selectedTeacher && report.teacherName !== selectedTeacher) {
      matches = false;
    }
    
    if (selectedSubject && report.subjectName !== selectedSubject) {
      matches = false;
    }
    
    return matches;
  });
  
  // Handle report view
  const handleViewReport = (testId: string) => {
    navigate(`/reports/${testId}`);
  };
  
  // Login form
  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white to-green-50 dir-rtl">
        <Card className="w-[350px] border-2 border-green-500">
          <CardHeader>
            <CardTitle className="text-center text-2xl">تسجيل دخول مدير المدرسة</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="username">اسم المستخدم</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">كلمة المرور</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="mt-2 bg-green-600 hover:bg-green-700"
                >
                  تسجيل الدخول
                </Button>
                <div className="text-sm text-center text-muted-foreground mt-4">
                  اسم المستخدم: admin | كلمة المرور: 12345
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
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
          <TabsList className="grid grid-cols-3 w-[400px] mb-6">
            <TabsTrigger value="reports">تقارير الاختبارات</TabsTrigger>
            <TabsTrigger value="statistics">إحصائيات</TabsTrigger>
            <TabsTrigger value="settings">الإعدادات</TabsTrigger>
          </TabsList>
          
          <TabsContent value="reports" className="space-y-6">
            <Card className="border-2 border-green-500">
              <CardHeader className="bg-gradient-to-r from-green-100 to-white border-b border-green-500">
                <CardTitle>تصفية التقارير</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>الصف</Label>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="اختر الصف" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">جميع الصفوف</SelectItem>
                        {classesData.map(cls => (
                          <SelectItem key={cls.id} value={cls.name}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>المعلم</Label>
                    <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="اختر المعلم" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">جميع المعلمين</SelectItem>
                        {teachersData.map(teacher => (
                          <SelectItem key={teacher.id} value={teacher.name}>
                            {teacher.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>المادة</Label>
                    <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="اختر المادة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">جميع المواد</SelectItem>
                        {subjectsData.map(subject => (
                          <SelectItem key={subject.id} value={subject.name}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-red-500">
              <CardHeader className="bg-gradient-to-r from-red-100 to-white border-b border-red-500">
                <CardTitle>قائمة التقارير</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader className="bg-black">
                    <TableRow>
                      <TableHead className="text-white">اسم الاختبار</TableHead>
                      <TableHead className="text-white">الصف</TableHead>
                      <TableHead className="text-white">المادة</TableHead>
                      <TableHead className="text-white">المعلم</TableHead>
                      <TableHead className="text-white">التاريخ</TableHead>
                      <TableHead className="text-center text-white">نسبة النجاح</TableHead>
                      <TableHead className="text-white"></TableHead>
                    </TableRow>
                  </TableHeader>
                  
                  <TableBody>
                    {filteredReports.length > 0 ? (
                      filteredReports.map(report => (
                        <TableRow key={report.id} className="hover:bg-green-50">
                          <TableCell className="font-medium">{report.testName}</TableCell>
                          <TableCell>{report.className} {report.sectionName}</TableCell>
                          <TableCell>{report.subjectName}</TableCell>
                          <TableCell>{report.teacherName}</TableCell>
                          <TableCell>{report.date}</TableCell>
                          <TableCell className="text-center">
                            <span className={`px-2 py-1 rounded-full text-white ${
                              report.passRate >= 70 ? 'bg-green-500' : 
                              report.passRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}>
                              {report.passRate}%
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewReport(report.testId)}
                            >
                              عرض التقرير
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-6">
                          لا توجد تقارير تطابق معايير التصفية المحددة
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="statistics">
            <Card className="border-2 border-black">
              <CardHeader className="bg-gradient-to-r from-gray-100 to-white border-b border-black">
                <CardTitle>إحصائيات المدرسة</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card className="border border-green-500">
                    <CardHeader className="bg-green-50 pb-2">
                      <CardTitle className="text-sm">عدد الاختبارات</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">{testsData.length}</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border border-green-500">
                    <CardHeader className="bg-green-50 pb-2">
                      <CardTitle className="text-sm">متوسط نسب النجاح</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">
                        {filteredReports.length > 0 
                          ? Math.round(filteredReports.reduce((sum, r) => sum + r.passRate, 0) / filteredReports.length)
                          : 0}%
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border border-green-500">
                    <CardHeader className="bg-green-50 pb-2">
                      <CardTitle className="text-sm">عدد المعلمين</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">{teachersData.length}</p>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="mt-8 p-4 border border-dashed border-gray-300 rounded-lg text-center">
                  <p className="text-muted-foreground">هنا يمكن إضافة رسومات بيانية وإحصائيات أكثر تفصيلاً</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings">
            <Card className="border-2 border-black">
              <CardHeader className="bg-gradient-to-r from-gray-100 to-white border-b border-black">
                <CardTitle>إعدادات النظام</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label>اسم المدرسة</Label>
                      <Input defaultValue="مدرسة النجاح الثانوية" className="mt-1" />
                    </div>
                    
                    <div>
                      <Label>العام الدراسي</Label>
                      <Input defaultValue="2023-2024" className="mt-1" />
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-medium mb-4">استيراد بيانات</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <Label>استيراد بيانات المعلمين</Label>
                        <Input type="file" accept=".xlsx, .xls" className="mt-1" />
                      </div>
                      
                      <div>
                        <Label>استيراد بيانات الطلاب</Label>
                        <Input type="file" accept=".xlsx, .xls" className="mt-1" />
                      </div>
                      
                      <div>
                        <Label>استيراد بيانات المواد الدراسية</Label>
                        <Input type="file" accept=".xlsx, .xls" className="mt-1" />
                      </div>
                    </div>
                    
                    <Button className="mt-4 bg-green-600 hover:bg-green-700">
                      حفظ الإعدادات
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;

