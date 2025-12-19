import { useState, useRef } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2, Edit, Plus, Upload, Download, FileSpreadsheet } from "lucide-react";
import { 
  getClasses,
  getSubjects,
  getClassById,
  getSubjectById,
  saveTeachers,
  TeacherWithCredentials
} from "@/services/dataService";
import { useEffect } from "react";
import * as XLSX from "xlsx";

interface TeachersTabProps {
  teachers: TeacherWithCredentials[];
  setTeachers: React.Dispatch<React.SetStateAction<TeacherWithCredentials[]>>;
}

const TeachersTab = ({ teachers, setTeachers }: TeachersTabProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherWithCredentials | null>(null);
  const [classes, setClasses] = useState(getClasses());
  const [subjects, setSubjects] = useState(getSubjects());
  
  useEffect(() => {
    setClasses(getClasses());
    setSubjects(getSubjects());
  }, [showAddTeacherModal, showEditModal]);
  
  const teacherFormSchema = z.object({
    name: z.string().min(3, { message: "يجب أن يحتوي الاسم على 3 أحرف على الأقل" }),
    username: z.string().min(3, { message: "يجب أن يحتوي اسم المستخدم على 3 أحرف على الأقل" }),
    password: z.string().min(5, { message: "يجب أن تحتوي كلمة المرور على 5 أحرف على الأقل" }),
    classes: z.array(z.string()).min(1, { message: "يجب اختيار صف واحد على الأقل" }),
    subjects: z.array(z.string()).min(1, { message: "يجب اختيار مادة واحدة على الأقل" })
  });
  
  const teacherForm = useForm<z.infer<typeof teacherFormSchema>>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: {
      name: "",
      username: "",
      password: "",
      classes: [],
      subjects: []
    }
  });

  // Add new teacher
  const handleAddTeacher = (data: z.infer<typeof teacherFormSchema>) => {
    const newTeacher: TeacherWithCredentials = {
      id: `teacher_${Date.now()}`,
      name: data.name,
      username: data.username,
      password: data.password,
      subjects: data.subjects,
      assignedSubjects: data.subjects,
      assignedClasses: data.classes
    };
    
    const updatedTeachers = [...teachers, newTeacher];
    setTeachers(updatedTeachers);
    saveTeachers(updatedTeachers);
    
    toast({
      title: "تمت إضافة المعلم بنجاح",
      description: `تم إنشاء حساب للمعلم ${data.name} بنجاح`,
    });
    
    teacherForm.reset();
    setShowAddTeacherModal(false);
  };

  const handleEditTeacher = (data: z.infer<typeof teacherFormSchema>) => {
    if (!editingTeacher) return;
    
    const updatedTeachers = teachers.map(t => 
      t.id === editingTeacher.id 
        ? {
            ...t,
            name: data.name,
            username: data.username,
            password: data.password,
            subjects: data.subjects,
            assignedSubjects: data.subjects,
            assignedClasses: data.classes
          }
        : t
    );
    
    setTeachers(updatedTeachers);
    saveTeachers(updatedTeachers);
    
    toast({
      title: "تم تحديث المعلم بنجاح",
      description: `تم تحديث بيانات المعلم ${data.name}`,
    });
    
    teacherForm.reset();
    setEditingTeacher(null);
    setShowEditModal(false);
  };

  const handleDeleteTeacher = (teacherId: string) => {
    const teacherToDelete = teachers.find(t => t.id === teacherId);
    const updatedTeachers = teachers.filter(t => t.id !== teacherId);
    setTeachers(updatedTeachers);
    saveTeachers(updatedTeachers);
    
    toast({
      title: "تم حذف المعلم",
      description: `تم حذف المعلم ${teacherToDelete?.name || ""} بنجاح`,
    });
  };

  const openEditModal = (teacher: TeacherWithCredentials) => {
    setEditingTeacher(teacher);
    teacherForm.reset({
      name: teacher.name,
      username: teacher.username,
      password: teacher.password,
      classes: teacher.assignedClasses,
      subjects: teacher.assignedSubjects
    });
    setShowEditModal(true);
  };

  // Excel upload handler
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      if (jsonData.length === 0) {
        toast({
          title: "خطأ",
          description: "الملف فارغ أو غير صالح",
          variant: "destructive",
        });
        return;
      }

      let addedCount = 0;
      const newTeachers = [...teachers];

      jsonData.forEach((row, index) => {
        const name = row["اسم المعلم"] || row["الاسم"] || row["name"];
        const username = row["اسم المستخدم"] || row["username"];
        const password = row["كلمة المرور"] || row["password"] || "12345";

        if (!name || !username) return;

        // Check if teacher already exists
        const exists = newTeachers.some(t => t.username === username);
        if (exists) return;

        newTeachers.push({
          id: `teacher_${Date.now()}_${index}`,
          name: name.trim(),
          username: username.trim(),
          password: password,
          subjects: [],
          assignedSubjects: [],
          assignedClasses: []
        });
        addedCount++;
      });

      if (addedCount > 0) {
        setTeachers(newTeachers);
        saveTeachers(newTeachers);
        toast({
          title: "تم الاستيراد",
          description: `تم إضافة ${addedCount} معلم بنجاح (يرجى تعيين الصفوف والمواد لكل معلم)`,
        });
      } else {
        toast({
          title: "تنبيه",
          description: "لم يتم العثور على بيانات جديدة للاستيراد",
        });
      }

      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Error importing file:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء قراءة الملف",
        variant: "destructive",
      });
    }
  };

  // Download template
  const downloadTemplate = () => {
    const templateData = [
      { "اسم المعلم": "أحمد محمد", "اسم المستخدم": "ahmed", "كلمة المرور": "12345" },
      { "اسم المعلم": "سارة علي", "اسم المستخدم": "sara", "كلمة المرور": "12345" },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "المعلمين");
    XLSX.writeFile(wb, "قالب_المعلمين.xlsx");

    toast({
      title: "تم التحميل",
      description: "تم تحميل قالب ملف المعلمين",
    });
  };

  // Export teachers
  const exportTeachers = () => {
    const exportData = teachers.map(teacher => ({
      "اسم المعلم": teacher.name,
      "اسم المستخدم": teacher.username,
      "الصفوف": teacher.assignedClasses.map(id => getClassById(id)?.name || "").filter(Boolean).join("، "),
      "المواد": teacher.assignedSubjects.map(id => getSubjectById(id)?.name || "").filter(Boolean).join("، "),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "المعلمين");
    XLSX.writeFile(wb, `المعلمين_${new Date().toLocaleDateString("ar")}.xlsx`);

    toast({
      title: "تم التصدير",
      description: `تم تصدير ${teachers.length} معلم`,
    });
  };

  const renderTeacherForm = (onSubmit: (data: z.infer<typeof teacherFormSchema>) => void, isEdit: boolean = false) => (
    <Form {...teacherForm}>
      <form onSubmit={teacherForm.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={teacherForm.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>اسم المعلم</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="أدخل اسم المعلم الكامل" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={teacherForm.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>اسم المستخدم</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="أدخل اسم المستخدم للدخول" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={teacherForm.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>كلمة المرور</FormLabel>
              <FormControl>
                <Input 
                  type="password"
                  placeholder="أدخل كلمة المرور" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="space-y-4">
          <FormField
            control={teacherForm.control}
            name="classes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الصفوف المخصصة للمعلم</FormLabel>
                <div className="flex flex-wrap gap-2 border rounded p-2">
                  {classes.length > 0 ? classes.map(cls => (
                    <div key={cls.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`class-${cls.id}`}
                        value={cls.id}
                        checked={field.value.includes(cls.id)}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (e.target.checked) {
                            field.onChange([...field.value, value]);
                          } else {
                            field.onChange(field.value.filter(v => v !== value));
                          }
                        }}
                        className="ml-1"
                      />
                      <label htmlFor={`class-${cls.id}`} className="ml-3">{cls.name}</label>
                    </div>
                  )) : (
                    <span className="text-muted-foreground text-sm">لا توجد صفوف مضافة. أضف صفوف من تبويب الصفوف.</span>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={teacherForm.control}
            name="subjects"
            render={({ field }) => (
              <FormItem>
                <FormLabel>المواد المخصصة للمعلم</FormLabel>
                <div className="flex flex-wrap gap-2 border rounded p-2">
                  {subjects.length > 0 ? subjects.map(subject => (
                    <div key={subject.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`subject-${subject.id}`}
                        value={subject.id}
                        checked={field.value.includes(subject.id)}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (e.target.checked) {
                            field.onChange([...field.value, value]);
                          } else {
                            field.onChange(field.value.filter(v => v !== value));
                          }
                        }}
                        className="ml-1"
                      />
                      <label htmlFor={`subject-${subject.id}`} className="ml-3">{subject.name}</label>
                    </div>
                  )) : (
                    <span className="text-muted-foreground text-sm">لا توجد مواد مضافة. أضف مواد من تبويب المواد.</span>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => {
              teacherForm.reset();
              isEdit ? setShowEditModal(false) : setShowAddTeacherModal(false);
            }}
            className="ml-2"
          >
            إلغاء
          </Button>
          <Button 
            type="submit" 
            className="bg-green-600 hover:bg-green-700"
          >
            {isEdit ? "حفظ التغييرات" : "إضافة المعلم"}
          </Button>
        </div>
      </form>
    </Form>
  );

  return (
    <>
      <Card className="border-2 border-black mb-6">
        <CardHeader className="bg-gradient-to-r from-gray-100 to-white border-b border-black">
          <CardTitle className="flex justify-between items-center flex-wrap gap-2">
            <span>إدارة المعلمين</span>
            <div className="flex gap-2 flex-wrap">
              <input
                type="file"
                ref={fileInputRef}
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={downloadTemplate}
                className="border-blue-500 text-blue-600 hover:bg-blue-50"
              >
                <Download className="ml-2 h-4 w-4" /> تحميل القالب
              </Button>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="border-purple-500 text-purple-600 hover:bg-purple-50"
              >
                <Upload className="ml-2 h-4 w-4" /> رفع من Excel
              </Button>
              <Button
                variant="outline"
                onClick={exportTeachers}
                className="border-orange-500 text-orange-600 hover:bg-orange-50"
              >
                <FileSpreadsheet className="ml-2 h-4 w-4" /> تصدير
              </Button>
              <Button 
                onClick={() => {
                  teacherForm.reset();
                  setShowAddTeacherModal(true);
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="ml-2 h-4 w-4" /> إضافة معلم
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Table>
            <TableHeader className="bg-black">
              <TableRow>
                <TableHead className="text-white">اسم المعلم</TableHead>
                <TableHead className="text-white">اسم المستخدم</TableHead>
                <TableHead className="text-white">الصفوف</TableHead>
                <TableHead className="text-white">المواد</TableHead>
                <TableHead className="text-white">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.length > 0 ? (
                teachers.map(teacher => (
                  <TableRow key={teacher.id} className="hover:bg-green-50">
                    <TableCell className="font-medium">{teacher.name}</TableCell>
                    <TableCell>{teacher.username}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {teacher.assignedClasses.map(classId => {
                          const cls = getClassById(classId);
                          return cls ? (
                            <span key={classId} className="bg-green-100 px-2 py-0.5 rounded text-sm">
                              {cls.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {teacher.assignedSubjects.map(subjectId => {
                          const subject = getSubjectById(subjectId);
                          return subject ? (
                            <span key={subjectId} className="bg-red-100 px-2 py-0.5 rounded text-sm">
                              {subject.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openEditModal(teacher)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-500 hover:bg-red-50"
                          onClick={() => handleDeleteTeacher(teacher.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">
                    لا يوجد معلمين حالياً
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Add Teacher Modal */}
      <Dialog open={showAddTeacherModal} onOpenChange={setShowAddTeacherModal}>
        <DialogContent className="dir-rtl max-w-2xl">
          <DialogHeader>
            <DialogTitle>إضافة معلم جديد</DialogTitle>
          </DialogHeader>
          {renderTeacherForm(handleAddTeacher)}
        </DialogContent>
      </Dialog>

      {/* Edit Teacher Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="dir-rtl max-w-2xl">
          <DialogHeader>
            <DialogTitle>تعديل بيانات المعلم</DialogTitle>
          </DialogHeader>
          {renderTeacherForm(handleEditTeacher, true)}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TeachersTab;