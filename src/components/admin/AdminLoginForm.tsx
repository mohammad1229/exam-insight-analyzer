
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const AdminLoginForm = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    // Simple authentication - in a real app use proper authentication
    if (username === "admin" && password === "12345") {
      localStorage.setItem("adminLoggedIn", "true");
      
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: "مرحباً بك في لوحة تحكم مدير المدرسة",
      });
      
      // Force page reload to trigger the isLoggedIn check
      window.location.reload();
    } else {
      toast({
        title: "فشل تسجيل الدخول",
        description: "اسم المستخدم أو كلمة المرور غير صحيحة",
        variant: "destructive",
      });
    }
  };

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
};

export default AdminLoginForm;
