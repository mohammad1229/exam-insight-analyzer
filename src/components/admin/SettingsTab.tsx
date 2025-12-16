
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Upload, Edit, Trash2, Plus, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { isElectron } from "@/services/electronService";
import electronService from "@/services/electronService";

const SettingsTab = () => {
  const { toast } = useToast();
  const [schoolName, setSchoolName] = useState("مدرسة النجاح الثانوية");
  const [academicYear, setAcademicYear] = useState("2023-2024");
  const [directorName, setDirectorName] = useState("");
  const [schoolLogo, setSchoolLogo] = useState<string>("");
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const logoInputRef = useRef<HTMLInputElement>(null);
  
  // New state for edit mode
  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Teacher form states
  const [teacherName, setTeacherName] = useState("");
  const [teacherUsername, setTeacherUsername] = useState("");
  const [teacherPassword, setTeacherPassword] = useState("");
  const [teacherSubjects, setTeacherSubjects] = useState("");
  const [teacherClasses, setTeacherClasses] = useState("");

  // Load data on component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Load school settings
      const settingsStr = localStorage.getItem("schoolSettings");
      if (settingsStr) {
        const settings = JSON.parse(settingsStr);
        setSchoolName(settings.name || "مدرسة النجاح الثانوية");
        setAcademicYear(settings.academicYear || "2023-2024");
        setDirectorName(settings.directorName || "");
        setSchoolLogo(settings.logo || "");
      }
      
      // Also load from legacy keys
      const legacySchoolName = localStorage.getItem("schoolName");
      const legacyDirectorName = localStorage.getItem("directorName");
      if (legacySchoolName) setSchoolName(legacySchoolName);
      if (legacyDirectorName) setDirectorName(legacyDirectorName);
      
      // Load logo
      const savedLogo = localStorage.getItem("schoolLogo");
      if (savedLogo) setSchoolLogo(savedLogo);
      
      // Load teachers
      if (isElectron()) {
        const loadedTeachers = await electronService.db.getAll("teachers");
        setTeachers(loadedTeachers || []);
      } else {
        const teachersStr = localStorage.getItem("teachersWithCredentials");
        if (teachersStr) {
          setTeachers(JSON.parse(teachersStr) || []);
        }
      }
      
      // Load students (similar approach)
      const studentsStr = localStorage.getItem("students");
      if (studentsStr) {
        setStudents(JSON.parse(studentsStr) || []);
      }
      
      // Load subjects (similar approach)
      const subjectsStr = localStorage.getItem("subjects");
      if (subjectsStr) {
        setSubjects(JSON.parse(subjectsStr) || []);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "خطأ في تحميل البيانات",
        description: "حدث خطأ أثناء محاولة تحميل البيانات",
        variant: "destructive",
      });
    }
  };
  
  // Handle logo upload
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (file.size > 500000) { // 500KB limit
      toast({
        title: "الملف كبير جداً",
        description: "يجب أن يكون حجم الشعار أقل من 500 كيلوبايت",
        variant: "destructive",
      });
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setSchoolLogo(base64);
      localStorage.setItem("schoolLogo", base64);
      toast({
        title: "تم رفع الشعار",
        description: "تم رفع شعار المدرسة بنجاح",
      });
    };
    reader.readAsDataURL(file);
  };
  
  const handleRemoveLogo = () => {
    setSchoolLogo("");
    localStorage.removeItem("schoolLogo");
    toast({
      title: "تم حذف الشعار",
      description: "تم حذف شعار المدرسة",
    });
  };

  // Function to handle file uploads for teachers
  const handleTeacherImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Process teacher data
        const teachersData = jsonData.map((row: any, index) => ({
          id: `teacher_${Date.now()}_${index}`,
          name: row.name || `معلم ${index + 1}`,
          subjects: row.subjects ? row.subjects.split(',').map((s: string) => s.trim()) : [],
          username: row.username || row.name?.split(' ')?.[0]?.toLowerCase() || `teacher${index + 1}`,
          password: row.password || "12345",
          assignedClasses: row.classes ? row.classes.split(',').map((c: string) => c.trim()) : [],
          assignedSubjects: row.subjects ? row.subjects.split(',').map((s: string) => s.trim()) : [],
        }));
        
        // Save teacher data
        if (isElectron()) {
          for (const teacher of teachersData) {
            await electronService.db.insert("teachers", teacher);
          }
        } else {
          // Save to localStorage
          localStorage.setItem("teachersWithCredentials", JSON.stringify(teachersData));
        }
        
        // Update state
        setTeachers(teachersData);
        
        toast({
          title: "تم استيراد بيانات المعلمين",
          description: `تم استيراد ${teachersData.length} معلم بنجاح`,
        });
      } catch (error) {
        toast({
          title: "خطأ في استيراد البيانات",
          description: "يرجى التأكد من تنسيق الملف",
          variant: "destructive",
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Function to handle file uploads for students
  const handleStudentImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Process and save student data
        const studentsData = jsonData.map((row: any, index) => ({
          id: `student_${Date.now()}_${index}`,
          name: row.name || `طالب ${index + 1}`,
          classId: row.classId || "",
          sectionId: row.sectionId || "",
        }));
        
        // Save student data
        if (isElectron()) {
          for (const student of studentsData) {
            await electronService.db.insert("students", student);
          }
        } else {
          localStorage.setItem("students", JSON.stringify(studentsData));
        }
        
        // Update state
        setStudents(studentsData);
        
        toast({
          title: "تم استيراد بيانات الطلاب",
          description: `تم استيراد ${studentsData.length} طالب بنجاح`,
        });
      } catch (error) {
        toast({
          title: "خطأ في استيراد البيانات",
          description: "يرجى التأكد من تنسيق الملف",
          variant: "destructive",
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Function to handle file uploads for subjects
  const handleSubjectImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Process subject data
        const subjectsData = jsonData.map((row: any, index) => ({
          id: `subject_${Date.now()}_${index}`,
          name: row.name || `مادة ${index + 1}`,
        }));
        
        // Save subject data
        if (isElectron()) {
          for (const subject of subjectsData) {
            await electronService.db.insert("subjects", subject);
          }
        } else {
          localStorage.setItem("subjects", JSON.stringify(subjectsData));
        }
        
        // Update state
        setSubjects(subjectsData);
        
        toast({
          title: "تم استيراد بيانات المواد الدراسية",
          description: `تم استيراد ${subjectsData.length} مادة دراسية بنجاح`,
        });
      } catch (error) {
        toast({
          title: "خطأ في استيراد البيانات",
          description: "يرجى التأكد من تنسيق الملف",
          variant: "destructive",
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Function to download template for teachers
  const downloadTeacherTemplate = () => {
    const template = [
      { name: "أحمد محمد", subjects: "رياضيات,علوم", classes: "الصف التاسع,الصف العاشر", username: "ahmed", password: "12345" },
      { name: "سارة خالد", subjects: "لغة عربية,تربية إسلامية", classes: "الصف السابع,الصف الثامن", username: "sara", password: "12345" }
    ];
    
    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Teachers");
    XLSX.writeFile(workbook, "teachers_template.xlsx");
    
    toast({
      title: "تم تنزيل القالب",
      description: "تم تنزيل قالب بيانات المعلمين بنجاح",
    });
  };

  // Function to handle settings save
  const handleSaveSettings = async () => {
    try {
      const settings = {
        name: schoolName,
        academicYear: academicYear,
        directorName: directorName,
        logo: schoolLogo
      };
      
      // Save to both keys for compatibility
      localStorage.setItem("schoolName", schoolName);
      localStorage.setItem("directorName", directorName);
      
      if (isElectron()) {
        await electronService.updateSystemSettings({
          schoolName: schoolName,
          academicYear: academicYear,
          directorName: directorName
        });
      } else {
        localStorage.setItem("schoolSettings", JSON.stringify(settings));
      }
      
      toast({
        title: "تم حفظ الإعدادات",
        description: "تم تحديث إعدادات النظام بنجاح",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "خطأ في حفظ الإعدادات",
        description: "حدث خطأ أثناء محاولة حفظ الإعدادات",
        variant: "destructive",
      });
    }
  };
  
  // Function to open edit dialog for teacher
  const handleEditTeacher = (teacher: any) => {
    setEditingTeacher(teacher);
    setTeacherName(teacher.name);
    setTeacherUsername(teacher.username);
    setTeacherPassword(teacher.password);
    setTeacherSubjects(teacher.assignedSubjects?.join(',') || '');
    setTeacherClasses(teacher.assignedClasses?.join(',') || '');
    setIsEditDialogOpen(true);
  };
  
  // Function to add new teacher
  const handleAddTeacher = () => {
    setEditingTeacher(null);
    setTeacherName('');
    setTeacherUsername('');
    setTeacherPassword('12345');
    setTeacherSubjects('');
    setTeacherClasses('');
    setIsEditDialogOpen(true);
  };
  
  // Function to save teacher (add or update)
  const handleSaveTeacher = async () => {
    try {
      // Validate inputs
      if (!teacherName || !teacherUsername || !teacherPassword) {
        toast({
          title: "بيانات غير مكتملة",
          description: "يرجى إدخال جميع البيانات المطلوبة",
          variant: "destructive",
        });
        return;
      }
      
      // Prepare teacher data
      const teacherData = {
        id: editingTeacher ? editingTeacher.id : `teacher_${Date.now()}`,
        name: teacherName,
        username: teacherUsername,
        password: teacherPassword,
        subjects: teacherSubjects.split(',').map(s => s.trim()),
        assignedSubjects: teacherSubjects.split(',').map(s => s.trim()),
        assignedClasses: teacherClasses.split(',').map(c => c.trim())
      };
      
      // Save teacher data
      if (isElectron()) {
        if (editingTeacher) {
          await electronService.db.update("teachers", teacherData.id, teacherData);
        } else {
          await electronService.db.insert("teachers", teacherData);
        }
        
        // Reload teachers
        const updatedTeachers = await electronService.db.getAll("teachers");
        setTeachers(updatedTeachers);
      } else {
        // Update in localStorage
        let updatedTeachers;
        if (editingTeacher) {
          updatedTeachers = teachers.map(t => 
            t.id === editingTeacher.id ? teacherData : t
          );
        } else {
          updatedTeachers = [...teachers, teacherData];
        }
        
        localStorage.setItem("teachersWithCredentials", JSON.stringify(updatedTeachers));
        setTeachers(updatedTeachers);
      }
      
      // Success message
      toast({
        title: editingTeacher ? "تم تحديث المعلم" : "تم إضافة المعلم",
        description: editingTeacher 
          ? `تم تحديث بيانات المعلم ${teacherName} بنجاح` 
          : `تم إضافة المعلم ${teacherName} بنجاح`,
      });
      
      // Close dialog
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Error saving teacher:", error);
      toast({
        title: "خطأ في حفظ البيانات",
        description: "حدث خطأ أثناء محاولة حفظ بيانات المعلم",
        variant: "destructive",
      });
    }
  };
  
  // Function to delete teacher
  const handleDeleteTeacher = async (teacher: any) => {
    if (!window.confirm(`هل أنت متأكد من حذف المعلم ${teacher.name}؟`)) {
      return;
    }
    
    try {
      if (isElectron()) {
        await electronService.db.delete("teachers", teacher.id);
        
        // Reload teachers
        const updatedTeachers = await electronService.db.getAll("teachers");
        setTeachers(updatedTeachers);
      } else {
        // Update in localStorage
        const updatedTeachers = teachers.filter(t => t.id !== teacher.id);
        localStorage.setItem("teachersWithCredentials", JSON.stringify(updatedTeachers));
        setTeachers(updatedTeachers);
      }
      
      toast({
        title: "تم حذف المعلم",
        description: `تم حذف المعلم ${teacher.name} بنجاح`,
      });
    } catch (error) {
      console.error("Error deleting teacher:", error);
      toast({
        title: "خطأ في حذف المعلم",
        description: "حدث خطأ أثناء محاولة حذف المعلم",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="palestine-border">
      <CardHeader className="palestine-header">
        <CardTitle>إعدادات النظام</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>اسم المدرسة</Label>
              <Input 
                value={schoolName} 
                onChange={(e) => setSchoolName(e.target.value)} 
                className="mt-1" 
              />
            </div>
            
            <div>
              <Label>اسم المدير</Label>
              <Input 
                value={directorName} 
                onChange={(e) => setDirectorName(e.target.value)}
                className="mt-1" 
              />
            </div>
            
            <div>
              <Label>العام الدراسي</Label>
              <Input 
                value={academicYear} 
                onChange={(e) => setAcademicYear(e.target.value)}
                className="mt-1" 
              />
            </div>
            
            <div>
              <Label>شعار المدرسة</Label>
              <div className="mt-1 flex items-center gap-4">
                {schoolLogo ? (
                  <div className="relative">
                    <img src={schoolLogo} alt="School Logo" className="h-16 w-16 object-contain border rounded" />
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="absolute -top-2 -right-2 h-6 w-6 p-0"
                      onClick={handleRemoveLogo}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="h-16 w-16 border-2 border-dashed rounded flex items-center justify-center text-muted-foreground">
                    <Image className="h-6 w-6" />
                  </div>
                )}
                <input
                  type="file"
                  ref={logoInputRef}
                  onChange={handleLogoUpload}
                  accept="image/*"
                  className="hidden"
                />
                <Button 
                  variant="outline" 
                  onClick={() => logoInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 ml-2" />
                  رفع شعار
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">الحد الأقصى 500 كيلوبايت - يظهر في جميع التقارير</p>
            </div>
          </div>
          
          {/* Teachers Management Section */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">إدارة المعلمين</h3>
              <Button onClick={handleAddTeacher} className="palestine-button-primary">
                <Plus className="h-4 w-4 ml-2" />
                إضافة معلم
              </Button>
            </div>
            
            {/* Teachers Table */}
            {teachers.length > 0 ? (
              <div className="rounded-md border overflow-hidden mb-4">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2 text-right">الاسم</th>
                      <th className="p-2 text-right">اسم المستخدم</th>
                      <th className="p-2 text-right">المواد</th>
                      <th className="p-2 text-right">الفصول</th>
                      <th className="p-2 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teachers.map((teacher) => (
                      <tr key={teacher.id} className="border-t border-gray-200">
                        <td className="p-2">{teacher.name}</td>
                        <td className="p-2">{teacher.username}</td>
                        <td className="p-2">{teacher.assignedSubjects?.join(', ') || ''}</td>
                        <td className="p-2">{teacher.assignedClasses?.join(', ') || ''}</td>
                        <td className="p-2 text-center">
                          <div className="flex justify-center space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditTeacher(teacher)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => handleDeleteTeacher(teacher)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-gray-500 mb-4">لا يوجد معلمين مسجلين.</p>
            )}
            
            {/* Import Teachers */}
            <div className="bg-gray-50 p-4 rounded-md">
              <Label className="block mb-2">استيراد بيانات المعلمين</Label>
              <div className="flex items-center gap-2">
                <Input 
                  type="file" 
                  accept=".xlsx, .xls" 
                  className="flex-1"
                  onChange={handleTeacherImport}
                />
                <Button 
                  className="palestine-button-secondary"
                  onClick={downloadTeacherTemplate}
                >
                  <Download className="h-4 w-4 ml-2" />
                  تنزيل القالب
                </Button>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium mb-4">استيراد/تصدير البيانات</h3>
            
            <div className="space-y-4">
              <div>
                <Label>استيراد بيانات الطلاب</Label>
                <Input 
                  type="file" 
                  accept=".xlsx, .xls" 
                  className="mt-1"
                  onChange={handleStudentImport}
                />
              </div>
              
              <div>
                <Label>استيراد بيانات المواد الدراسية</Label>
                <Input 
                  type="file" 
                  accept=".xlsx, .xls" 
                  className="mt-1"
                  onChange={handleSubjectImport}
                />
              </div>
            </div>
            
            <Button 
              className="palestine-button-primary mt-4"
              onClick={handleSaveSettings}
            >
              حفظ الإعدادات
            </Button>
          </div>
        </div>
      </CardContent>
      
      {/* Teacher Edit/Add Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingTeacher ? "تحرير بيانات المعلم" : "إضافة معلم جديد"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="teacherName" className="text-right">
                اسم المعلم
              </Label>
              <Input
                id="teacherName"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                اسم المستخدم
              </Label>
              <Input
                id="username"
                value={teacherUsername}
                onChange={(e) => setTeacherUsername(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                كلمة المرور
              </Label>
              <Input
                id="password"
                type="text"
                value={teacherPassword}
                onChange={(e) => setTeacherPassword(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subjects" className="text-right">
                المواد
              </Label>
              <Input
                id="subjects"
                value={teacherSubjects}
                onChange={(e) => setTeacherSubjects(e.target.value)}
                className="col-span-3"
                placeholder="رياضيات,علوم,لغة عربية"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="classes" className="text-right">
                الفصول
              </Label>
              <Input
                id="classes"
                value={teacherClasses}
                onChange={(e) => setTeacherClasses(e.target.value)}
                className="col-span-3"
                placeholder="الصف الأول,الصف الثاني"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              إلغاء
            </Button>
            <Button className="palestine-button-primary" onClick={handleSaveTeacher}>
              {editingTeacher ? "تحديث" : "إضافة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default SettingsTab;
