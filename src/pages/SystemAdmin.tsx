
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const SystemAdmin = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  useEffect(() => {
    // Check if system admin is logged in
    const sysAdminLoggedIn = localStorage.getItem("sysAdminLoggedIn");
    if (sysAdminLoggedIn === "true") {
      setIsLoggedIn(true);
    }
  }, []);
  
  const handleLogin = () => {
    // Default system admin credentials (these would be stored securely in a real app)
    if (username === "mohammad" && password === "12345") {
      localStorage.setItem("sysAdminLoggedIn", "true");
      setIsLoggedIn(true);
      
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: "مرحباً بك في لوحة تحكم مسؤول النظام",
      });
    } else {
      toast({
        title: "فشل تسجيل الدخول",
        description: "اسم المستخدم أو كلمة المرور غير صحيحة",
        variant: "destructive",
      });
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem("sysAdminLoggedIn");
    setIsLoggedIn(false);
    toast({
      title: "تم تسجيل الخروج",
      description: "تم تسجيل خروجك من النظام بنجاح",
    });
  };
  
  // Generate a random license key
  const generateLicenseKey = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let key = "";
    
    // Format: XXXX-XXXX-XXXX-XXXX
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      if (i < 3) key += "-";
    }
    
    // Store in localStorage with expiry (1 year)
    const licenses = JSON.parse(localStorage.getItem("licenseKeys") || "[]");
    const newLicense = {
      key,
      schoolName: document.getElementById("schoolName")?.value || "",
      directorName: document.getElementById("directorName")?.value || "",
      createdAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      used: false
    };
    
    licenses.push(newLicense);
    localStorage.setItem("licenseKeys", JSON.stringify(licenses));
    
    toast({
      title: "تم إنشاء رمز ترخيص جديد",
      description: `الرمز: ${key}`,
    });
    
    return key;
  };
  
  // Login form
  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-black via-white to-green-600 dir-rtl">
        <Card className="w-[450px] border-2 border-[#E84c3d]">
          <CardHeader className="bg-black text-white">
            <CardTitle className="text-center text-2xl">تسجيل دخول مسؤول النظام</CardTitle>
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
                  className="mt-2 bg-[#E84c3d] hover:bg-red-700 text-white"
                >
                  تسجيل الدخول
                </Button>
                <div className="text-sm text-center text-muted-foreground mt-4">
                  اسم المستخدم: mohammad | كلمة المرور: 12345
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Admin panel
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-white to-green-50">
      <header className="bg-black text-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">لوحة تحكم مسؤول النظام</h1>
          <div className="space-x-2 flex items-center gap-4">
            <Button 
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-black"
              onClick={() => navigate("/")}
            >
              الصفحة الرئيسية
            </Button>
            <Button 
              variant="destructive"
              onClick={handleLogout}
            >
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8 flex-1 dir-rtl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">إدارة التراخيص</h2>
          <p className="text-gray-600">إنشاء وإدارة تراخيص النظام للمدارس</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="col-span-1 border-2 border-green-500">
            <CardHeader className="bg-gradient-to-r from-green-100 to-white border-b border-green-500">
              <CardTitle>إنشاء ترخيص جديد</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="schoolName">اسم المدرسة</Label>
                  <Input id="schoolName" placeholder="أدخل اسم المدرسة" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="directorName">اسم المدير</Label>
                  <Input id="directorName" placeholder="أدخل اسم مدير المدرسة" />
                </div>
                <Button 
                  onClick={generateLicenseKey}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  إنشاء مفتاح ترخيص
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-1 lg:col-span-2 border-2 border-black">
            <CardHeader className="bg-gradient-to-r from-gray-100 to-white border-b border-black">
              <CardTitle>التراخيص النشطة</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <LicenseList />
            </CardContent>
          </Card>
          
          <Card className="col-span-1 lg:col-span-3 border-2 border-[#E84c3d]">
            <CardHeader className="bg-gradient-to-r from-red-100 to-white border-b border-[#E84c3d]">
              <CardTitle>إعدادات النظام</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="sysUsername">اسم مستخدم مسؤول النظام</Label>
                  <Input id="sysUsername" defaultValue="mohammad" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sysPassword">كلمة المرور</Label>
                  <Input id="sysPassword" type="password" defaultValue="12345" />
                </div>
                <Button 
                  className="bg-[#E84c3d] hover:bg-red-700"
                  onClick={() => {
                    toast({
                      title: "تم تحديث البيانات",
                      description: "تم تحديث بيانات مسؤول النظام بنجاح",
                    });
                  }}
                >
                  حفظ التغييرات
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

const LicenseList = () => {
  const [licenses, setLicenses] = useState<any[]>([]);
  
  useEffect(() => {
    const storedLicenses = JSON.parse(localStorage.getItem("licenseKeys") || "[]");
    setLicenses(storedLicenses);
  }, []);
  
  if (licenses.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        لا توجد تراخيص نشطة. قم بإنشاء ترخيص جديد.
      </div>
    );
  }
  
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-black text-white">
          <tr>
            <th className="py-2 px-4 text-right">المفتاح</th>
            <th className="py-2 px-4 text-right">اسم المدرسة</th>
            <th className="py-2 px-4 text-right">تاريخ الإنشاء</th>
            <th className="py-2 px-4 text-right">صالح حتى</th>
            <th className="py-2 px-4 text-right">الحالة</th>
          </tr>
        </thead>
        <tbody>
          {licenses.map((license, index) => (
            <tr key={index} className="border-t hover:bg-gray-50">
              <td className="py-3 px-4 font-mono">{license.key}</td>
              <td className="py-3 px-4">{license.schoolName || "غير محدد"}</td>
              <td className="py-3 px-4">{new Date(license.createdAt).toLocaleDateString('ar-SA')}</td>
              <td className="py-3 px-4">{new Date(license.validUntil).toLocaleDateString('ar-SA')}</td>
              <td className="py-3 px-4">
                <span className={`px-2 py-1 rounded text-sm ${
                  license.used ? 'bg-gray-200' : 'bg-green-100 text-green-800'
                }`}>
                  {license.used ? "مستخدم" : "متاح"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SystemAdmin;
