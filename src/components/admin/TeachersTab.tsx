
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  classesData,
  subjectsData,
  getClassById,
  getSubjectById
} from "@/data/mockData";
import { Teacher } from "@/types";

// Custom teacher type with credentials
interface TeacherWithCredentials extends Teacher {
  username: string;
  password: string;
  assignedClasses: string[];
  assignedSubjects: string[];
}

interface TeachersTabProps {
  teachers: TeacherWithCredentials[];
  setTeachers: React.Dispatch<React.SetStateAction<TeacherWithCredentials[]>>;
}

const TeachersTab = ({ teachers, setTeachers }: TeachersTabProps) => {
  const { toast } = useToast();
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  
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
    localStorage.setItem("teachersWithCredentials", JSON.stringify(updatedTeachers));
    
    toast({
      title: "تمت إضافة المعلم بنجاح",
      description: `تم إنشاء حساب للمعلم ${data.name} بنجاح`,
    });
    
    teacherForm.reset();
    setShowAddTeacherModal(false);
  };

  return (
    <>
      <Card className="border-2 border-black mb-6">
        <CardHeader className="bg-gradient-to-r from-gray-100 to-white border-b border-black">
          <CardTitle className="flex justify-between items-center">
            <span>إدارة المعلمين</span>
            <Button 
              onClick={() => setShowAddTeacherModal(true)}
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
                <TableHead className="text-white"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.length > 0 ? (
                teachers.map(teacher => (
                  <TableRow key={teacher.id} className="hover:bg-green-50">
                    <TableCell className="font-medium">{teacher.name}</TableCell>
                    <TableCell>{teacher.username}</TableCell>
                    <TableCell>
                      {teacher.assignedClasses.map(classId => {
                        const cls = getClassById(classId);
                        return cls ? <span key={classId} className="mr-1">{cls.name}</span> : null;
                      })}
                    </TableCell>
                    <TableCell>
                      {teacher.assignedSubjects.map(subjectId => {
                        const subject = getSubjectById(subjectId);
                        return subject ? <span key={subjectId} className="mr-1">{subject.name}</span> : null;
                      })}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        تعديل
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mr-2 text-red-500 hover:bg-red-50"
                      >
                        حذف
                      </Button>
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
      
      {showAddTeacherModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 dir-rtl">
          <Card className="w-full max-w-2xl border-2 border-green-500">
            <CardHeader className="bg-gradient-to-r from-green-100 to-white border-b border-green-500">
              <CardTitle>إضافة معلم جديد</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <Form {...teacherForm}>
                <form onSubmit={teacherForm.handleSubmit(handleAddTeacher)} className="space-y-4">
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
                            {classesData.map(cls => (
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
                            ))}
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
                            {subjectsData.map(subject => (
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
                            ))}
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
                      onClick={() => setShowAddTeacherModal(false)}
                      className="ml-2"
                    >
                      إلغاء
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-green-600 hover:bg-green-700"
                    >
                      إضافة المعلم
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default TeachersTab;
