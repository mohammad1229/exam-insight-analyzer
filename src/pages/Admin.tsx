
import { useState } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import { 
  schoolData, 
  teachersData, 
  classesData, 
  subjectsData, 
  studentsData 
} from "@/data/mockData";
import { Plus, Trash2, Upload, FileSpreadsheet } from "lucide-react";

const Admin = () => {
  const { toast } = useToast();
  const [schoolName, setSchoolName] = useState(schoolData.name);
  const [principalName, setPrincipalName] = useState(schoolData.principal);

  const handleSaveSchoolInfo = () => {
    toast({
      title: "تم حفظ البيانات",
      description: "تم تحديث بيانات المدرسة بنجاح",
    });
  };

  const handleFileUpload = (type: string) => {
    toast({
      title: "تم رفع الملف",
      description: `تم استيراد بيانات ${type} بنجاح`,
    });
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto p-6 dir-rtl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">لوحة التحكم</h1>
            <p className="text-muted-foreground">إدارة بيانات النظام والمستخدمين</p>
          </div>

          <Tabs defaultValue="school">
            <TabsList className="w-full flex mb-6">
              <TabsTrigger value="school" className="flex-1">معلومات المدرسة</TabsTrigger>
              <TabsTrigger value="teachers" className="flex-1">المعلمين</TabsTrigger>
              <TabsTrigger value="classes" className="flex-1">الصفوف</TabsTrigger>
              <TabsTrigger value="subjects" className="flex-1">المواد</TabsTrigger>
              <TabsTrigger value="students" className="flex-1">الطلاب</TabsTrigger>
            </TabsList>

            <TabsContent value="school">
              <Card>
                <CardHeader>
                  <CardTitle>معلومات المدرسة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="schoolName">اسم المدرسة</Label>
                        <Input 
                          id="schoolName" 
                          value={schoolName}
                          onChange={(e) => setSchoolName(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="principalName">اسم المدير</Label>
                        <Input 
                          id="principalName" 
                          value={principalName}
                          onChange={(e) => setPrincipalName(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button onClick={handleSaveSchoolInfo}>حفظ التغييرات</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="teachers">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>المعلمين</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleFileUpload('المعلمين')}>
                      <Upload className="h-4 w-4 ml-2" />
                      استيراد من Excel
                    </Button>
                    <Button>
                      <Plus className="h-4 w-4 ml-2" />
                      إضافة معلم
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">اسم المعلم</TableHead>
                        <TableHead className="text-right">المواد</TableHead>
                        <TableHead className="text-center w-24">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teachersData.map(teacher => (
                        <TableRow key={teacher.id}>
                          <TableCell className="font-medium">{teacher.name}</TableCell>
                          <TableCell>
                            {teacher.subjects.map(subId => 
                              subjectsData.find(s => s.id === subId)?.name
                            ).join(', ')}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="classes">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>الصفوف</CardTitle>
                  <Button>
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة صف
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">اسم الصف</TableHead>
                        <TableHead className="text-right">الشعب</TableHead>
                        <TableHead className="text-center w-24">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classesData.map(cls => (
                        <TableRow key={cls.id}>
                          <TableCell className="font-medium">{cls.name}</TableCell>
                          <TableCell>
                            {cls.sections.map(sec => sec.name).join(', ')}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="subjects">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>المواد الدراسية</CardTitle>
                  <Button>
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة مادة
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">اسم المادة</TableHead>
                        <TableHead className="text-center w-24">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subjectsData.map(subject => (
                        <TableRow key={subject.id}>
                          <TableCell className="font-medium">{subject.name}</TableCell>
                          <TableCell className="text-center">
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="students">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>الطلاب</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleFileUpload('الطلاب')}>
                      <Upload className="h-4 w-4 ml-2" />
                      استيراد من Excel
                    </Button>
                    <Button variant="outline">
                      <FileSpreadsheet className="h-4 w-4 ml-2" />
                      تنزيل قالب Excel
                    </Button>
                    <Button>
                      <Plus className="h-4 w-4 ml-2" />
                      إضافة طالب
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">اسم الطالب</TableHead>
                        <TableHead className="text-right">الصف</TableHead>
                        <TableHead className="text-right">الشعبة</TableHead>
                        <TableHead className="text-center w-24">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentsData.map(student => {
                        const classObj = classesData.find(c => c.id === student.classId);
                        const section = classObj?.sections.find(s => s.id === student.sectionId);
                        
                        return (
                          <TableRow key={student.id}>
                            <TableCell className="font-medium">{student.name}</TableCell>
                            <TableCell>{classObj?.name || ''}</TableCell>
                            <TableCell>{section?.name || ''}</TableCell>
                            <TableCell className="text-center">
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default Admin;
