import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, RefreshCw, Copy, User, Key } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Teacher {
  id: string;
  name: string;
  username: string;
  password_hash: string;
  is_active: boolean;
}

interface Admin {
  id: string;
  full_name: string;
  username: string;
  password_hash: string;
  is_active: boolean;
}

const LoginCredentialsTab = () => {
  const { toast } = useToast();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPasswords, setShowPasswords] = useState<{[key: string]: boolean}>({});

  const fetchCredentials = async () => {
    setLoading(true);
    const schoolId = localStorage.getItem("currentSchoolId");
    
    if (!schoolId) {
      toast({
        title: "خطأ",
        description: "لم يتم العثور على معرف المدرسة",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      // Fetch teachers
      const { data: teachersResult } = await supabase.functions.invoke("school-data", {
        body: { action: "getTeachers", schoolId }
      });
      
      if (teachersResult?.success && teachersResult.data) {
        setTeachers(teachersResult.data);
      }

      // Fetch school admins
      const { data: adminsResult } = await supabase.functions.invoke("get-admin-data", {
        body: { action: "getSchoolAdmins" }
      });
      
      if (adminsResult?.success && adminsResult.data) {
        // Filter admins for current school
        const schoolAdmins = adminsResult.data.filter((admin: any) => admin.school_id === schoolId);
        setAdmins(schoolAdmins);
      }
    } catch (error) {
      console.error("Error fetching credentials:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء جلب بيانات الدخول",
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchCredentials();
  }, []);

  const togglePassword = (id: string) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "تم النسخ",
      description: `تم نسخ ${label} إلى الحافظة`,
    });
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-blue-500">
        <CardHeader className="bg-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                بيانات دخول المدراء
              </CardTitle>
              <CardDescription>
                عرض بيانات تسجيل الدخول لمدراء المدرسة
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchCredentials} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
              تحديث
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {admins.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>اسم المستخدم</TableHead>
                  <TableHead>كلمة المرور</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">{admin.full_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono">{admin.username}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(admin.username, "اسم المستخدم")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">
                          {showPasswords[admin.id] ? admin.password_hash : '••••••••'}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => togglePassword(admin.id)}
                        >
                          {showPasswords[admin.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(admin.password_hash, "كلمة المرور")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={admin.is_active ? "default" : "secondary"}>
                        {admin.is_active ? "نشط" : "غير نشط"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          copyToClipboard(`اسم المستخدم: ${admin.username}\nكلمة المرور: ${admin.password_hash}`, "بيانات الدخول");
                        }}
                      >
                        نسخ الكل
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Key className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>لا يوجد مدراء مسجلين</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-2 border-green-500">
        <CardHeader className="bg-green-50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                بيانات دخول المعلمين
              </CardTitle>
              <CardDescription>
                عرض بيانات تسجيل الدخول لجميع المعلمين
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {teachers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم المعلم</TableHead>
                  <TableHead>اسم المستخدم</TableHead>
                  <TableHead>كلمة المرور</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell className="font-medium">{teacher.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono">{teacher.username}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(teacher.username, "اسم المستخدم")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">
                          {showPasswords[teacher.id] ? teacher.password_hash : '••••••••'}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => togglePassword(teacher.id)}
                        >
                          {showPasswords[teacher.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(teacher.password_hash, "كلمة المرور")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={teacher.is_active ? "default" : "secondary"}>
                        {teacher.is_active ? "نشط" : "غير نشط"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          copyToClipboard(`اسم المستخدم: ${teacher.username}\nكلمة المرور: ${teacher.password_hash}`, "بيانات الدخول");
                        }}
                      >
                        نسخ الكل
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>لا يوجد معلمين مسجلين</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginCredentialsTab;
