
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { Test } from "@/types";
import { 
  getTests, 
  getClasses, 
  getClassById, 
  getSectionById, 
  getSubjectById, 
  getTeacherById,
  getCurrentTeacher,
  getTeacherClasses
} from "@/services/dataService";

const Dashboard = () => {
  const navigate = useNavigate();
  const [selectedClassId, setSelectedClassId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [tests, setTests] = useState<Test[]>([]);
  const [availableClasses, setAvailableClasses] = useState<{ id: string; name: string }[]>([]);
  const currentTeacher = getCurrentTeacher();

  useEffect(() => {
    // Load tests from dataService
    const allTests = getTests();
    
    // Filter tests by current teacher if logged in
    if (currentTeacher) {
      const teacherTests = allTests.filter(t => t.teacherId === currentTeacher.id);
      setTests(teacherTests);
      setAvailableClasses(getTeacherClasses(currentTeacher.id));
    } else {
      setTests(allTests);
      setAvailableClasses(getClasses());
    }
  }, []);

  const filteredTests = tests.filter(test => {
    const matchesClass = !selectedClassId || selectedClassId === "all" || test.classId === selectedClassId;
    const subject = getSubjectById(test.subjectId);
    const teacher = getTeacherById(test.teacherId);
    const matchesSearch = !searchTerm || 
      test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesClass && matchesSearch;
  });

  return (
    <div className="flex min-h-screen bg-background dark:bg-gray-950">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto p-6 dir-rtl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">لوحة المعلومات</h1>
              <p className="text-muted-foreground">إدارة الاختبارات والنتائج</p>
            </div>
            <Button 
              className="mt-4 md:mt-0" 
              onClick={() => navigate("/test-results")}
            >
              إضافة اختبار جديد
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-2 border-black">
              <CardHeader className="pb-2 bg-black text-white">
                <CardTitle className="text-sm font-medium">مجموع الاختبارات</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-2xl font-bold text-green-600">{tests.length}</p>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-secondary dark:border-gray-700 dark:bg-gray-900">
              <CardHeader className="pb-2 bg-secondary dark:bg-gray-800 text-secondary-foreground">
                <CardTitle className="text-sm font-medium">اختبارات هذا الشهر</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-2xl font-bold text-accent">
                  {tests.filter(test => {
                    const testDate = new Date(test.date);
                    const now = new Date();
                    return testDate.getMonth() === now.getMonth() && 
                           testDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-secondary dark:border-gray-700 dark:bg-gray-900">
              <CardHeader className="pb-2 bg-secondary dark:bg-gray-800 text-secondary-foreground">
                <CardTitle className="text-sm font-medium">متوسط النجاح</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-2xl font-bold text-accent">
                  {tests.length > 0 ?
                    (tests.reduce((acc, test) => {
                      const presentResults = test.results.filter(result => !result.isAbsent);
                      const passedCount = presentResults.filter(result => result.percentage >= 50).length;
                      const passRate = presentResults.length > 0 ? (passedCount / presentResults.length) * 100 : 0;
                      return acc + passRate;
                    }, 0) / tests.length).toFixed(1) : 0}%
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-secondary dark:border-gray-700 dark:bg-gray-900">
              <CardHeader className="pb-2 bg-secondary dark:bg-gray-800 text-secondary-foreground">
                <CardTitle className="text-sm font-medium">مسودات الاختبارات</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-2xl font-bold text-primary">
                  {tests.filter(test => test.draft).length}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold text-foreground">الاختبارات الأخيرة</h2>
                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                  <SelectTrigger className="w-48 border-accent dark:border-gray-600 dark:bg-gray-800">
                    <SelectValue placeholder="جميع الصفوف" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الصفوف</SelectItem>
                    {availableClasses.map(cls => (
                      <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-full md:w-64">
                <Input 
                  placeholder="بحث..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="border-2 border-secondary dark:border-gray-700 rounded-md overflow-hidden">
              <Table>
                <TableHeader className="bg-secondary dark:bg-gray-800">
                  <TableRow>
                    <TableHead className="text-right text-secondary-foreground">اسم الاختبار</TableHead>
                    <TableHead className="text-right text-secondary-foreground">المادة</TableHead>
                    <TableHead className="text-right text-secondary-foreground">الصف</TableHead>
                    <TableHead className="text-right text-secondary-foreground">التاريخ</TableHead>
                    <TableHead className="text-right text-secondary-foreground">نسبة النجاح</TableHead>
                    <TableHead className="text-right text-secondary-foreground">الحالة</TableHead>
                    <TableHead className="text-right text-secondary-foreground">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTests.length > 0 ? (
                    filteredTests.map((test) => {
                      const classObj = getClassById(test.classId);
                      const section = getSectionById(test.classId, test.sectionId);
                      const subject = getSubjectById(test.subjectId);
                      
                      const presentResults = test.results.filter(result => !result.isAbsent);
                      const passedCount = presentResults.filter(result => result.percentage >= 50).length;
                      const passRate = presentResults.length > 0 ? (passedCount / presentResults.length) * 100 : 0;
                      
                        return (
                        <TableRow key={test.id} className="hover:bg-accent/10 dark:hover:bg-gray-800">
                          <TableCell className="font-medium">{test.name}</TableCell>
                          <TableCell>{subject?.name || ''}</TableCell>
                          <TableCell>
                            {classObj?.name || ''} {section?.name || ''}
                          </TableCell>
                          <TableCell>{test.date}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-sm ${
                              passRate >= 70 ? 'bg-green-500 text-white' : 
                              passRate >= 50 ? 'bg-yellow-500 text-black' : 
                              'bg-red-500 text-white'
                            }`}>
                              {passRate.toFixed(1)}%
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-sm ${
                              test.draft ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                            }`}>
                              {test.draft ? 'مسودة' : 'مكتمل'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                              onClick={() => navigate(`/reports/${test.id}`)}
                            >
                              عرض التقرير
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6">
                        لا توجد اختبارات لعرضها
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
