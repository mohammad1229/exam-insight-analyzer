import { useState } from "react";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Trash2, Edit } from "lucide-react";
import { 
  getClasses,
  getSubjects,
  getClassById,
  getSubjectById,
  getTeachers,
  saveTeachers,
  TeacherWithCredentials
} from "@/services/dataService";
import { useEffect } from "react";

interface TeachersTabProps {
  teachers: TeacherWithCredentials[];
  setTeachers: React.Dispatch<React.SetStateAction<TeacherWithCredentials[]>>;
}

const TeachersTab = ({ teachers, setTeachers }: TeachersTabProps) => {
  const { toast } = useToast();
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
          <CardTitle className="flex justify-between items-center">
            <span>إدارة المعلمين</span>
            <Button 
              onClick={() => {
                teacherForm.reset();
                setShowAddTeacherModal(true);
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              إضافة معلم جديد
            </Button>
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
