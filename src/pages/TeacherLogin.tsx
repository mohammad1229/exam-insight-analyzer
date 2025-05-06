
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const TeacherLogin = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    // Get teachers with credentials from localStorage
    const teachersString = localStorage.getItem("teachersWithCredentials");
    
    if (!teachersString) {
      toast({
        title: "خطأ في النظام",
        description: "لم يتم العثور على بيانات المعلمين",
        variant: "destructive",
      });
      return;
    }
    
    const teachers = JSON.parse(teachersString);
    const teacher = teachers.find(
      (t: any) => t.username === username && t.password === password
    );
    
    if (teacher) {
      // Store teacher info in localStorage for session management
      localStorage.setItem("loggedInTeacher", JSON.stringify({
        id: teacher.id,
        name: teacher.name,
        assignedClasses: teacher.assignedClasses,
        assignedSubjects: teacher.assignedSubjects
      }));
      
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: `مرحباً بك ${teacher.name}`,
      });
      
      // Redirect to dashboard
      navigate("/dashboard");
    } else {
      toast({
        title: "فشل تسجيل الدخول",
        description: "اسم المستخدم أو كلمة المرور غير صحيحة",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-black via-white to-green-600">
      <div className="absolute top-0 left-0 right-0 h-16 bg-black text-white shadow-sm flex items-center justify-center">
        <div className="container flex justify-between items-center">
          <h1 className="text-2xl font-bold">نظام إدارة اختبارات المدرسة</h1>
          <div className="space-x-2">
            <Button 
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-black"
              onClick={() => navigate("/")}
            >
              الصفحة الرئيسية
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex items-center justify-center w-full dir-rtl">
        <Card className="w-[350px] border-2 border-[#ea384c]">
          <CardHeader className="bg-black text-white">
            <CardTitle className="text-center text-2xl">تسجيل دخول المعلم</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 mt-2">
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
                  className="mt-2 bg-[#ea384c] hover:bg-red-700 text-white"
                >
                  تسجيل الدخول
                </Button>
                <div className="text-sm text-center text-muted-foreground mt-4">
                  للتسجيل كمعلم، يرجى التواصل مع مدير المدرسة
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeacherLogin;
