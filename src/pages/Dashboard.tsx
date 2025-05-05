
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
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { 
  testsData, 
  classesData, 
  subjectsData,
  getClassById,
  getSectionById,
  getTeacherById,
  getSubjectById
} from "@/data/mockData";

const Dashboard = () => {
  const navigate = useNavigate();
  const [selectedClassId, setSelectedClassId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTests = testsData.filter(test => {
    const matchesClass = !selectedClassId || test.classId === selectedClassId;
    const matchesSearch = !searchTerm || 
      test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getSubjectById(test.subjectId)?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getTeacherById(test.teacherId)?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesClass && matchesSearch;
  });

  return (
    <div className="flex min-h-screen">
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
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">مجموع الاختبارات</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{testsData.length}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">اختبارات هذا الشهر</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {testsData.filter(test => {
                    const testDate = new Date(test.date);
                    const now = new Date();
                    return testDate.getMonth() === now.getMonth() && 
                           testDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">متوسط النجاح</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {testsData.length > 0 ?
                    testsData.reduce((acc, test) => {
                      const presentResults = test.results.filter(result => !result.isAbsent);
                      const passedCount = presentResults.filter(result => result.percentage >= 50).length;
                      const passRate = presentResults.length > 0 ? (passedCount / presentResults.length) * 100 : 0;
                      return acc + passRate;
                    }, 0) / testsData.length : 0}%
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">مسودات الاختبارات</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {testsData.filter(test => test.draft).length}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold">الاختبارات الأخيرة</h2>
                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="جميع الصفوف" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">جميع الصفوف</SelectItem>
                    {classesData.map(cls => (
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

            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">اسم الاختبار</TableHead>
                    <TableHead className="text-right">المادة</TableHead>
                    <TableHead className="text-right">الصف</TableHead>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">نسبة النجاح</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
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
                        <TableRow key={test.id}>
                          <TableCell className="font-medium">{test.name}</TableCell>
                          <TableCell>{subject?.name || ''}</TableCell>
                          <TableCell>
                            {classObj?.name || ''} {section?.name || ''}
                          </TableCell>
                          <TableCell>{test.date}</TableCell>
                          <TableCell>
                            {passRate.toFixed(1)}%
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
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
                      <TableCell colSpan={6} className="text-center py-6">
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
