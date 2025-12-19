
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { isElectron } from "@/services/electronService";
import electronService from "@/services/electronService";
import { Database, FileKey, Lock, Settings, User, Users, RefreshCw, BarChart3, Cloud, Download, Copy, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getLicenses, renewLicense, getSchools, generateLicense, deleteLicense, createSchool } from "@/services/licenseService";
import { downloadBackup, getBackups, createAutomaticBackup } from "@/services/backupService";
import UpdatesManagement from "@/components/admin/UpdatesManagement";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const SystemAdmin = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState("licenses");
  
  // System admin credentials state
  const [sysUsername, setSysUsername] = useState("mohammad");
  const [sysPassword, setSysPassword] = useState("12345");
  
  // Users management
  const [users, setUsers] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  
  // License state
  const [licenses, setLicenses] = useState<any[]>([]);
  const [schoolName, setSchoolName] = useState("");
  const [directorName, setDirectorName] = useState("");
  const [validityMonths, setValidityMonths] = useState("12");
  const [maxDevices, setMaxDevices] = useState("1");
  const [schools, setSchools] = useState<any[]>([]);
  const [backups, setBackups] = useState<any[]>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  
  // Renewal state
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewingLicense, setRenewingLicense] = useState<any>(null);
  const [renewMonths, setRenewMonths] = useState("12");
  
  // Delete license state
  const [showDeleteLicenseModal, setShowDeleteLicenseModal] = useState(false);
  const [deletingLicense, setDeletingLicense] = useState<any>(null);
  
  // Modals state
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Results and tests state
  const [tests, setTests] = useState<any[]>([]);
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  
  useEffect(() => {
    // Check if system admin is logged in
    const sysAdminLoggedIn = localStorage.getItem("sysAdminLoggedIn");
    if (sysAdminLoggedIn === "true") {
      setIsLoggedIn(true);
      loadData();
    }
    
    // For Electron: Get system settings
    if (isElectron()) {
      electronService.getSystemSettings().then((settings) => {
        if (settings.adminUsername) {
          setSysUsername(settings.adminUsername);
        }
      });
    }
  }, []);
  
  const loadData = async () => {
    if (isElectron()) {
      try {
        // Load users
        const usersData = await electronService.db.getAll("users");
        setUsers(usersData);
        
        // Load teachers
        const teachersData = await electronService.db.getAll("teachers");
        setTeachers(teachersData);
        
        // Load licenses
        const licensesData = await electronService.db.getAll("licenses");
        setLicenses(licensesData);
        
        // Load tests
        const testsData = await electronService.db.getAll("tests");
        setTests(testsData);
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: "خطأ في تحميل البيانات",
          description: "حدث خطأ أثناء تحميل بيانات النظام",
          variant: "destructive",
        });
      }
    } else {
      // Load from localStorage in web environment
      const storedUsers = JSON.parse(localStorage.getItem("users") || "[]");
      const storedTeachers = JSON.parse(localStorage.getItem("teachersWithCredentials") || "[]");
      const storedLicenses = JSON.parse(localStorage.getItem("licenseKeys") || "[]");
      const storedTests = JSON.parse(localStorage.getItem("tests") || "[]");
      
      setUsers(storedUsers);
      setTeachers(storedTeachers);
      setLicenses(storedLicenses);
      setTests(storedTests);
      
      // Load from Supabase as well
      try {
        const licensesFromDb = await getLicenses();
        if (licensesFromDb && licensesFromDb.length > 0) {
          setLicenses(licensesFromDb);
        }
        
        const schoolsFromDb = await getSchools();
        setSchools(schoolsFromDb || []);
        
        const backupsFromDb = await getBackups();
        setBackups(backupsFromDb || []);
      } catch (error) {
        console.error("Error loading from database:", error);
      }
    }
  };
  
  const handleRenewLicense = async () => {
    if (!renewingLicense) return;
    
    // Check if this is a database license (has UUID id) or localStorage license
    const licenseId = renewingLicense.id;
    
    if (!licenseId || licenseId === 'undefined') {
      // This is a localStorage license, update locally
      try {
        const storedLicenses = JSON.parse(localStorage.getItem("licenseKeys") || "[]");
        const index = storedLicenses.findIndex((l: any) => l.key === renewingLicense.key);
        
        if (index !== -1) {
          const currentExpiry = storedLicenses[index].validUntil 
            ? new Date(storedLicenses[index].validUntil) 
            : new Date();
          const newExpiry = new Date(currentExpiry);
          newExpiry.setMonth(newExpiry.getMonth() + parseInt(renewMonths));
          
          storedLicenses[index].validUntil = newExpiry.toISOString();
          localStorage.setItem("licenseKeys", JSON.stringify(storedLicenses));
          
          toast({
            title: "تم تجديد الترخيص",
            description: `تم تجديد الترخيص حتى ${newExpiry.toLocaleDateString('ar-SA')}`,
          });
          
          setShowRenewModal(false);
          setRenewingLicense(null);
          loadData();
        }
        return;
      } catch (error: any) {
        toast({
          title: "خطأ",
          description: error.message || "حدث خطأ غير متوقع",
          variant: "destructive",
        });
        return;
      }
    }
    
    try {
      const result = await renewLicense(licenseId, parseInt(renewMonths));
      
      if (result.success) {
        toast({
          title: "تم تجديد الترخيص",
          description: `تم تجديد الترخيص حتى ${new Date(result.newExpiry!).toLocaleDateString('ar-SA')}`,
        });
        
        setShowRenewModal(false);
        setRenewingLicense(null);
        loadData();
      } else {
        toast({
          title: "خطأ في التجديد",
          description: result.error || "حدث خطأ أثناء تجديد الترخيص",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    }
  };

  const handleDeleteLicense = async () => {
    if (!deletingLicense) return;
    
    // Check if this is a database license (has UUID id) or localStorage license
    const licenseId = deletingLicense.id;
    
    if (!licenseId || licenseId === 'undefined') {
      // This is a localStorage license, delete locally
      try {
        const storedLicenses = JSON.parse(localStorage.getItem("licenseKeys") || "[]");
        const filteredLicenses = storedLicenses.filter((l: any) => l.key !== deletingLicense.key);
        localStorage.setItem("licenseKeys", JSON.stringify(filteredLicenses));
        
        toast({
          title: "تم حذف الترخيص",
          description: "تم حذف الترخيص بنجاح",
        });
        
        setShowDeleteLicenseModal(false);
        setDeletingLicense(null);
        loadData();
        return;
      } catch (error: any) {
        toast({
          title: "خطأ",
          description: error.message || "حدث خطأ غير متوقع",
          variant: "destructive",
        });
        return;
      }
    }
    
    try {
      const result = await deleteLicense(licenseId);
      
      if (result.success) {
        toast({
          title: "تم إلغاء الترخيص",
          description: "تم إلغاء تفعيل الترخيص بنجاح",
        });
        
        setShowDeleteLicenseModal(false);
        setDeletingLicense(null);
        loadData();
      } else {
        toast({
          title: "خطأ في الحذف",
          description: result.error || "حدث خطأ أثناء إلغاء الترخيص",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "تم النسخ",
      description: "تم نسخ مفتاح الترخيص إلى الحافظة",
    });
  };
  
  const handleManualBackup = async () => {
    try {
      const result = downloadBackup();
      toast({
        title: "تم إنشاء النسخة الاحتياطية",
        description: `تم تنزيل الملف: ${result.filename}`,
      });
    } catch (error: any) {
      toast({
        title: "خطأ في النسخ الاحتياطي",
        description: error.message || "حدث خطأ أثناء إنشاء النسخة الاحتياطية",
        variant: "destructive",
      });
    }
  };
  
  const handleCloudBackup = async () => {
    try {
      setIsLoadingBackups(true);
      await createAutomaticBackup();
      toast({
        title: "تم النسخ الاحتياطي",
        description: "تم حفظ النسخة الاحتياطية في السحابة",
      });
      loadData();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء النسخ الاحتياطي",
        variant: "destructive",
      });
    } finally {
      setIsLoadingBackups(false);
    }
  };
  
  const handleLogin = () => {
    // Default system admin credentials (these would be stored securely in a real app)
    if (username === sysUsername && password === sysPassword) {
      localStorage.setItem("sysAdminLoggedIn", "true");
      setIsLoggedIn(true);
      
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: "مرحباً بك في لوحة تحكم مسؤول النظام",
      });
      
      loadData();
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
  
  // Generate a license key
  const generateLicenseKey = async () => {
    if (!schoolName) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم المدرسة",
        variant: "destructive",
      });
      return;
    }

    try {
      let newLicense: any;

      if (isElectron()) {
        // Use the Electron service to generate a license
        newLicense = await electronService.generateLicense(schoolName, directorName);

        // Update UI
        setLicenses((prev) => [...prev, newLicense]);
        setSchoolName("");
        setDirectorName("");

        toast({
          title: "تم إنشاء رمز ترخيص جديد",
          description: `الرمز: ${newLicense.key}`,
        });

        return newLicense.key;
      }

      // Web (Lovable Cloud): create school + license in database
      const createdSchool = await createSchool({
        name: schoolName,
        director_name: directorName || undefined,
      });

      const result = await generateLicense(
        createdSchool.id,
        parseInt(validityMonths || "12"),
        parseInt(maxDevices || "1")
      );

      if (!result.success) {
        toast({
          title: "خطأ في إنشاء الترخيص",
          description: result.error || "حدث خطأ أثناء إنشاء رمز الترخيص",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "تم إنشاء رمز ترخيص جديد",
        description: `الرمز: ${result.licenseKey}`,
      });

      setSchoolName("");
      setDirectorName("");

      // Reload to show latest DB licenses
      loadData();

      return result.licenseKey;
    } catch (error: any) {
      console.error("Error generating license:", error);
      toast({
        title: "خطأ في إنشاء الترخيص",
        description: error.message || "حدث خطأ أثناء إنشاء رمز الترخيص",
        variant: "destructive",
      });
    }
  };
  
  const handleUpdateSystemAdmin = async () => {
    try {
      if (isElectron()) {
        await electronService.db.query(
          "INSERT OR REPLACE INTO systemSettings (key, value) VALUES (?, ?), (?, ?)",
          ["adminUsername", sysUsername, "adminPassword", sysPassword]
        );
      }
      
      // Update in localStorage for both web and Electron environments
      localStorage.setItem("sysAdminCredentials", JSON.stringify({ username: sysUsername, password: sysPassword }));
      
      toast({
        title: "تم تحديث البيانات",
        description: "تم تحديث بيانات مسؤول النظام بنجاح",
      });
    } catch (error) {
      console.error("Error updating system admin:", error);
      toast({
        title: "خطأ في تحديث البيانات",
        description: "حدث خطأ أثناء تحديث بيانات مسؤول النظام",
        variant: "destructive",
      });
    }
  };
  
  const handleAddUser = async () => {
    setCurrentUser({ id: "", username: "", password: "", name: "", role: "teacher" });
    setShowEditUserModal(true);
  };
  
  const handleEditUser = (user: any) => {
    setCurrentUser({ ...user });
    setShowEditUserModal(true);
  };
  
  const handleSaveUser = async () => {
    try {
      if (!currentUser.username || !currentUser.password || !currentUser.name) {
        toast({
          title: "خطأ",
          description: "يرجى إكمال جميع البيانات المطلوبة",
          variant: "destructive",
        });
        return;
      }
      
      if (isElectron()) {
        if (currentUser.id) {
          // Update existing user
          await electronService.db.update("users", currentUser.id, currentUser);
        } else {
          // Add new user with generated ID
          const newUser = {
            ...currentUser,
            id: `user_${Date.now()}`
          };
          await electronService.db.insert("users", newUser);
        }
        
        // Reload users
        const updatedUsers = await electronService.db.getAll("users");
        setUsers(updatedUsers);
      } else {
        // Web environment using localStorage
        const storedUsers = JSON.parse(localStorage.getItem("users") || "[]");
        
        if (currentUser.id) {
          // Update existing user
          const index = storedUsers.findIndex((u: any) => u.id === currentUser.id);
          if (index !== -1) {
            storedUsers[index] = currentUser;
          }
        } else {
          // Add new user
          storedUsers.push({
            ...currentUser,
            id: `user_${Date.now()}`
          });
        }
        
        localStorage.setItem("users", JSON.stringify(storedUsers));
        setUsers(storedUsers);
      }
      
      setShowEditUserModal(false);
      
      toast({
        title: "تم بنجاح",
        description: currentUser.id ? "تم تحديث بيانات المستخدم بنجاح" : "تم إضافة مستخدم جديد بنجاح",
      });
    } catch (error) {
      console.error("Error saving user:", error);
      toast({
        title: "خطأ في حفظ البيانات",
        description: "حدث خطأ أثناء حفظ بيانات المستخدم",
        variant: "destructive",
      });
    }
  };
  
  const confirmDeleteUser = (user: any) => {
    setCurrentUser(user);
    setShowConfirmDeleteModal(true);
  };
  
  const handleDeleteUser = async () => {
    try {
      if (isElectron()) {
        await electronService.db.delete("users", currentUser.id);
        // Reload users
        const updatedUsers = await electronService.db.getAll("users");
        setUsers(updatedUsers);
      } else {
        // Web environment using localStorage
        const storedUsers = JSON.parse(localStorage.getItem("users") || "[]");
        const filteredUsers = storedUsers.filter((u: any) => u.id !== currentUser.id);
        localStorage.setItem("users", JSON.stringify(filteredUsers));
        setUsers(filteredUsers);
      }
      
      setShowConfirmDeleteModal(false);
      
      toast({
        title: "تم بنجاح",
        description: "تم حذف المستخدم بنجاح",
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "خطأ في حذف المستخدم",
        description: "حدث خطأ أثناء حذف المستخدم",
        variant: "destructive",
      });
    }
  };
  
  const handleViewTestResults = async (test: any) => {
    setSelectedTest(test);
    
    try {
      if (isElectron()) {
        const resultsData = await electronService.db.query(
          "SELECT * FROM results WHERE testId = ?", 
          [test.id]
        );
        setResults(resultsData);
      } else {
        // Web environment
        const storedResults = JSON.parse(localStorage.getItem("testResults") || "[]")
          .filter((r: any) => r.testId === test.id);
        setResults(storedResults);
      }
    } catch (error) {
      console.error("Error loading test results:", error);
      toast({
        title: "خطأ في تحميل النتائج",
        description: "حدث خطأ أثناء تحميل نتائج الاختبار",
        variant: "destructive",
      });
    }
  };
  
  const handleBackupDatabase = async () => {
    try {
      if (isElectron()) {
        const backupPath = await electronService.backupDatabase();
        toast({
          title: "تم إنشاء نسخة احتياطية بنجاح",
          description: `تم حفظ النسخة الاحتياطية في: ${backupPath}`,
        });
      } else {
        // Web environment already implemented in electronService.backupDatabase
        await electronService.backupDatabase();
        toast({
          title: "تم إنشاء نسخة احتياطية بنجاح",
          description: "تم تنزيل ملف النسخة الاحتياطية",
        });
      }
    } catch (error) {
      console.error("Error creating backup:", error);
      toast({
        title: "خطأ في إنشاء النسخة الاحتياطية",
        description: "حدث خطأ أثناء إنشاء النسخة الاحتياطية",
        variant: "destructive",
      });
    }
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
          <h2 className="text-3xl font-bold mb-2">إدارة النظام</h2>
          <p className="text-gray-600">التحكم الكامل في النظام وإدارة المستخدمين والتراخيص</p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full max-w-3xl mx-auto mb-6">
            <TabsTrigger value="licenses" className="flex items-center gap-2">
              <FileKey className="h-4 w-4" />
              التراخيص
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              المستخدمون
            </TabsTrigger>
            <TabsTrigger value="updates" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              التحديثات
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              النتائج
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              الإعدادات
            </TabsTrigger>
          </TabsList>
          
          {/* Licenses Tab */}
          <TabsContent value="licenses">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="col-span-1 border-2 border-green-500">
                <CardHeader className="bg-gradient-to-r from-green-100 to-white border-b border-green-500">
                  <CardTitle>إنشاء ترخيص جديد</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="schoolName">اسم المدرسة</Label>
                      <Input 
                        id="schoolName" 
                        placeholder="أدخل اسم المدرسة" 
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="directorName">اسم المدير</Label>
                      <Input 
                        id="directorName" 
                        placeholder="أدخل اسم مدير المدرسة" 
                        value={directorName}
                        onChange={(e) => setDirectorName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="validityMonths">مدة الصلاحية (بالأشهر)</Label>
                      <Select defaultValue="12">
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المدة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">شهر واحد</SelectItem>
                          <SelectItem value="3">3 أشهر</SelectItem>
                          <SelectItem value="6">6 أشهر</SelectItem>
                          <SelectItem value="12">سنة كاملة</SelectItem>
                          <SelectItem value="24">سنتان</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxDevices">عدد الأجهزة المسموحة</Label>
                      <Select defaultValue="1">
                        <SelectTrigger>
                          <SelectValue placeholder="اختر العدد" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">جهاز واحد</SelectItem>
                          <SelectItem value="2">جهازين</SelectItem>
                          <SelectItem value="3">3 أجهزة</SelectItem>
                          <SelectItem value="5">5 أجهزة</SelectItem>
                          <SelectItem value="10">10 أجهزة</SelectItem>
                          <SelectItem value="999">غير محدود</SelectItem>
                        </SelectContent>
                      </Select>
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
                  {licenses.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      لا توجد تراخيص نشطة. قم بإنشاء ترخيص جديد.
                    </div>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader className="bg-black text-white">
                          <TableRow>
                            <TableHead className="text-right text-white">المفتاح</TableHead>
                            <TableHead className="text-right text-white">المدرسة</TableHead>
                            <TableHead className="text-right text-white">النوع</TableHead>
                            <TableHead className="text-right text-white">الأجهزة</TableHead>
                            <TableHead className="text-right text-white">انتهاء الصلاحية</TableHead>
                            <TableHead className="text-right text-white">الحالة</TableHead>
                            <TableHead className="text-right text-white">الإجراءات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {licenses.map((license, index) => {
                            const isExpired = license.validUntil && new Date(license.validUntil) < new Date();
                            const isTrial = license.isTrial || license.is_trial;
                            const remainingDays = license.validUntil 
                              ? Math.ceil((new Date(license.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                              : 0;
                            
                            return (
                              <TableRow key={index} className="border-t hover:bg-gray-50">
                                <TableCell className="font-mono text-sm">{license.key || license.license_key}</TableCell>
                                <TableCell>{license.schoolName || license.schools?.name || "غير محدد"}</TableCell>
                                <TableCell>
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    isTrial ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {isTrial ? `تجريبي (${remainingDays} يوم)` : "مرخص"}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  {license.devicesUsed || license.device_activations?.length || 0} / {license.maxDevices || license.max_devices || 1}
                                </TableCell>
                                <TableCell>
                                  {license.validUntil || license.expiry_date 
                                    ? new Date(license.validUntil || license.expiry_date).toLocaleDateString('ar-SA')
                                    : "-"
                                  }
                                </TableCell>
                                <TableCell>
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    isExpired ? 'bg-red-100 text-red-800' : 
                                    license.used || !license.is_active ? 'bg-gray-200' : 'bg-green-100 text-green-800'
                                  }`}>
                                    {isExpired ? "منتهي" : license.used ? "مستخدم" : "نشط"}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="text-gray-600 border-gray-400 hover:bg-gray-50"
                                      onClick={() => copyToClipboard(license.license_key || license.key)}
                                      title="نسخ المفتاح"
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="text-blue-600 border-blue-600 hover:bg-blue-50"
                                      onClick={() => {
                                        setRenewingLicense(license);
                                        setShowRenewModal(true);
                                      }}
                                    >
                                      <RefreshCw className="h-3 w-3 ml-1" />
                                      تجديد
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="text-red-600 border-red-600 hover:bg-red-50"
                                      onClick={() => {
                                        setDeletingLicense(license);
                                        setShowDeleteLicenseModal(true);
                                      }}
                                      title="حذف الترخيص"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="border-2 border-[#E84c3d]">
              <CardHeader className="bg-gradient-to-r from-red-100 to-white border-b border-[#E84c3d]">
                <div className="flex justify-between items-center">
                  <CardTitle>إدارة المستخدمين</CardTitle>
                  <Button 
                    onClick={handleAddUser}
                    className="bg-[#E84c3d] hover:bg-red-700 text-white"
                  >
                    <User className="h-4 w-4 ml-2" />
                    إضافة مستخدم جديد
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {users.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    لا يوجد مستخدمين. قم بإضافة مستخدم جديد.
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader className="bg-black text-white">
                        <TableRow>
                          <TableHead className="text-right text-white">اسم المستخدم</TableHead>
                          <TableHead className="text-right text-white">الاسم</TableHead>
                          <TableHead className="text-right text-white">الدور</TableHead>
                          <TableHead className="text-right text-white">الإجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id} className="border-t hover:bg-gray-50">
                            <TableCell>{user.username}</TableCell>
                            <TableCell>{user.name}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded text-sm ${
                                user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {user.role === 'admin' ? 'مدير' : 'مستخدم'}
                              </span>
                            </TableCell>
                            <TableCell className="flex gap-2">
                              <Button 
                                variant="outline" 
                                className="text-blue-600 border-blue-600 hover:bg-blue-50"
                                onClick={() => handleEditUser(user)}
                              >
                                تعديل
                              </Button>
                              <Button 
                                variant="outline" 
                                className="text-red-600 border-red-600 hover:bg-red-50"
                                onClick={() => confirmDeleteUser(user)}
                              >
                                حذف
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                
                {/* Teachers List */}
                <div className="mt-8">
                  <h3 className="font-bold text-xl mb-4">المعلمون</h3>
                  
                  {teachers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      لا يوجد معلمين مسجلين في النظام.
                    </div>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader className="bg-black text-white">
                          <TableRow>
                            <TableHead className="text-right text-white">اسم المعلم</TableHead>
                            <TableHead className="text-right text-white">اسم المستخدم</TableHead>
                            <TableHead className="text-right text-white">المواد</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {teachers.map((teacher) => (
                            <TableRow key={teacher.id} className="border-t hover:bg-gray-50">
                              <TableCell>{teacher.name}</TableCell>
                              <TableCell>{teacher.username}</TableCell>
                              <TableCell>
                                {Array.isArray(teacher.subjects) 
                                  ? teacher.subjects.join(', ')
                                  : teacher.subjects || '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Updates Tab */}
          <TabsContent value="updates">
            <UpdatesManagement />
          </TabsContent>
          
          {/* Results Tab */}
          <TabsContent value="results">
            <Card className="border-2 border-green-500">
              <CardHeader className="bg-gradient-to-r from-green-100 to-white border-b border-green-500">
                <CardTitle>الاختبارات والنتائج</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {tests.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    لا توجد اختبارات مسجلة في النظام.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Tests List */}
                    <Card className="col-span-1 border">
                      <CardHeader>
                        <CardTitle className="text-lg">الاختبارات</CardTitle>
                      </CardHeader>
                      <CardContent className="max-h-[400px] overflow-y-auto">
                        {tests.map((test) => (
                          <div 
                            key={test.id}
                            className={`mb-2 p-3 border rounded cursor-pointer hover:bg-gray-100 ${
                              selectedTest?.id === test.id ? 'bg-green-50 border-green-500' : ''
                            }`}
                            onClick={() => handleViewTestResults(test)}
                          >
                            <h4 className="font-bold">{test.name}</h4>
                            <div className="text-sm text-gray-600">
                              <div>التاريخ: {test.date}</div>
                              <div>النوع: {test.type}</div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                    
                    {/* Results */}
                    <Card className="col-span-1 lg:col-span-2 border">
                      <CardHeader>
                        <CardTitle className="text-lg">نتائج الاختبار</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {selectedTest ? (
                          <div>
                            <div className="mb-4 p-3 bg-gray-50 rounded">
                              <h3 className="font-bold text-lg">{selectedTest.name}</h3>
                              <div className="text-sm text-gray-600">
                                <div>التاريخ: {selectedTest.date}</div>
                                <div>النوع: {selectedTest.type}</div>
                              </div>
                            </div>
                            
                            {results.length === 0 ? (
                              <div className="text-center py-8 text-gray-500">
                                لا توجد نتائج مسجلة لهذا الاختبار.
                              </div>
                            ) : (
                              <div className="border rounded-lg overflow-hidden">
                                <Table>
                                  <TableHeader className="bg-black text-white">
                                    <TableRow>
                                      <TableHead className="text-right text-white">الطالب</TableHead>
                                      <TableHead className="text-right text-white">الحضور</TableHead>
                                      <TableHead className="text-right text-white">العلامة</TableHead>
                                      <TableHead className="text-right text-white">النسبة المئوية</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {results.map((result) => (
                                      <TableRow key={result.id} className="border-t hover:bg-gray-50">
                                        <TableCell>{result.studentId}</TableCell>
                                        <TableCell>
                                          {result.isAbsent ? (
                                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded">غائب</span>
                                          ) : (
                                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded">حاضر</span>
                                          )}
                                        </TableCell>
                                        <TableCell>{result.isAbsent ? 0 : result.totalScore}</TableCell>
                                        <TableCell>{result.isAbsent ? "0%" : `${result.percentage}%`}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            اختر اختبارًا من القائمة لعرض نتائجه
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="border-2 border-[#E84c3d]">
                <CardHeader className="bg-gradient-to-r from-red-100 to-white border-b border-[#E84c3d]">
                  <CardTitle>إعدادات النظام</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="sysUsername">اسم مستخدم مسؤول النظام</Label>
                      <Input 
                        id="sysUsername" 
                        value={sysUsername}
                        onChange={(e) => setSysUsername(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sysPassword">كلمة المرور</Label>
                      <Input 
                        id="sysPassword" 
                        type="password" 
                        value={sysPassword}
                        onChange={(e) => setSysPassword(e.target.value)}
                      />
                    </div>
                    <Button 
                      className="bg-[#E84c3d] hover:bg-red-700"
                      onClick={handleUpdateSystemAdmin}
                    >
                      <Lock className="h-4 w-4 ml-2" />
                      حفظ التغييرات
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-purple-500">
                <CardHeader className="bg-gradient-to-r from-purple-100 to-white border-b border-purple-500">
                  <CardTitle>إعدادات التذييل والحقوق</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>نص الحقوق (أسفل التقرير)</Label>
                      <Input 
                        placeholder="مثال: جميع الحقوق محفوظة © 2025"
                        defaultValue={localStorage.getItem("copyrightText") || ""}
                        onChange={(e) => localStorage.setItem("copyrightText", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>عبارة إضافية</Label>
                      <Textarea 
                        placeholder="أي عبارة تريد إظهارها أسفل التقرير..."
                        rows={3}
                        defaultValue={localStorage.getItem("footerNote") || ""}
                        onChange={(e) => localStorage.setItem("footerNote", e.target.value)}
                      />
                    </div>
                    <Button 
                      className="bg-purple-600 hover:bg-purple-700"
                      onClick={() => {
                        toast({
                          title: "تم الحفظ",
                          description: "تم حفظ إعدادات التذييل بنجاح",
                        });
                      }}
                    >
                      حفظ إعدادات التذييل
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-black">
                <CardHeader className="bg-gradient-to-r from-gray-100 to-white border-b border-black">
                  <CardTitle>النسخ الاحتياطي واستعادة البيانات</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-blue-800 mb-2">النسخ الاحتياطي التلقائي</h4>
                      <p className="text-sm text-blue-600">
                        يتم إنشاء نسخة احتياطية تلقائياً يومياً في الساعة 11 مساءً
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h3 className="font-medium">نسخة احتياطية محلية</h3>
                        <p className="text-sm text-muted-foreground">
                          تنزيل نسخة احتياطية على جهازك
                        </p>
                        <Button 
                          variant="outline" 
                          className="w-full border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                          onClick={handleManualBackup}
                        >
                          <Database className="h-4 w-4 ml-2" />
                          تنزيل نسخة احتياطية
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="font-medium">نسخة احتياطية سحابية</h3>
                        <p className="text-sm text-muted-foreground">
                          حفظ نسخة احتياطية في السحابة
                        </p>
                        <Button 
                          variant="outline" 
                          className="w-full border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
                          onClick={handleCloudBackup}
                          disabled={isLoadingBackups}
                        >
                          <Cloud className="h-4 w-4 ml-2" />
                          {isLoadingBackups ? "جاري الحفظ..." : "حفظ في السحابة"}
                        </Button>
                      </div>
                    </div>
                    
                    {/* Backups History */}
                    {backups.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="font-medium">سجل النسخ الاحتياطية</h3>
                        <div className="border rounded-lg overflow-hidden max-h-[200px] overflow-y-auto">
                          <Table>
                            <TableHeader className="bg-gray-100">
                              <TableRow>
                                <TableHead className="text-right">المدرسة</TableHead>
                                <TableHead className="text-right">النوع</TableHead>
                                <TableHead className="text-right">التاريخ</TableHead>
                                <TableHead className="text-right">الحالة</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {backups.slice(0, 5).map((backup) => (
                                <TableRow key={backup.id}>
                                  <TableCell>{backup.school_name || 'غير محدد'}</TableCell>
                                  <TableCell>
                                    <span className={`px-2 py-1 rounded text-xs ${
                                      backup.backup_type === 'automatic' 
                                        ? 'bg-blue-100 text-blue-800' 
                                        : 'bg-green-100 text-green-800'
                                    }`}>
                                      {backup.backup_type === 'automatic' ? 'تلقائي' : 'يدوي'}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    {new Date(backup.created_at).toLocaleDateString('ar-SA')}
                                  </TableCell>
                                  <TableCell>
                                    <span className={`px-2 py-1 rounded text-xs ${
                                      backup.status === 'completed' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {backup.status === 'completed' ? 'مكتمل' : 'قيد التنفيذ'}
                                    </span>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <h3 className="font-medium">استعادة البيانات</h3>
                      <p className="text-sm text-muted-foreground">
                        استعادة البيانات من نسخة احتياطية سابقة
                      </p>
                      {isElectron() ? (
                        <Label htmlFor="restoreFile" className="block w-full">
                          <div className="cursor-pointer border-2 border-dashed border-gray-300 rounded-md p-6 text-center hover:border-gray-400">
                            <Input 
                              id="restoreFile" 
                              type="file" 
                              className="hidden" 
                              onChange={() => {
                                toast({
                                  title: "تنبيه",
                                  description: "وظيفة استعادة البيانات متاحة في التطبيق المثبت فقط.",
                                });
                              }}
                            />
                            <span className="text-gray-600">اختر ملف النسخة الاحتياطية لاستعادة البيانات</span>
                          </div>
                        </Label>
                      ) : (
                        <Label htmlFor="restoreFileWeb" className="block w-full">
                          <div className="cursor-pointer border-2 border-dashed border-gray-300 rounded-md p-6 text-center hover:border-gray-400">
                            <Input 
                              id="restoreFileWeb" 
                              type="file" 
                              accept=".json"
                              className="hidden" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    try {
                                      const data = JSON.parse(event.target?.result as string);
                                      // Restore each key
                                      Object.keys(data).forEach(key => {
                                        localStorage.setItem(key, JSON.stringify(data[key]));
                                      });
                                      toast({
                                        title: "تم الاستعادة",
                                        description: "تم استعادة البيانات بنجاح. يرجى تحديث الصفحة.",
                                      });
                                    } catch (error) {
                                      toast({
                                        title: "خطأ",
                                        description: "ملف النسخة الاحتياطية غير صالح",
                                        variant: "destructive",
                                      });
                                    }
                                  };
                                  reader.readAsText(file);
                                }
                              }}
                            />
                            <span className="text-gray-600">اختر ملف النسخة الاحتياطية (JSON)</span>
                          </div>
                        </Label>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      
      {/* User Edit Modal */}
      <Dialog open={showEditUserModal} onOpenChange={setShowEditUserModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{currentUser?.id ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">الاسم</Label>
              <Input
                id="name"
                value={currentUser?.name || ''}
                onChange={(e) => setCurrentUser({...currentUser, name: e.target.value})}
                placeholder="أدخل اسم المستخدم"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="username">اسم المستخدم</Label>
              <Input
                id="username"
                value={currentUser?.username || ''}
                onChange={(e) => setCurrentUser({...currentUser, username: e.target.value})}
                placeholder="أدخل اسم تسجيل الدخول"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                value={currentUser?.password || ''}
                onChange={(e) => setCurrentUser({...currentUser, password: e.target.value})}
                placeholder="أدخل كلمة المرور"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="role">الدور</Label>
              <Select 
                value={currentUser?.role || 'teacher'} 
                onValueChange={(value) => setCurrentUser({...currentUser, role: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الدور" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">مدير</SelectItem>
                  <SelectItem value="teacher">معلم</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowEditUserModal(false)}>
              إلغاء
            </Button>
            <Button type="button" onClick={handleSaveUser}>
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Confirm Delete User Modal */}
      <Dialog open={showConfirmDeleteModal} onOpenChange={setShowConfirmDeleteModal}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p>هل أنت متأكد من حذف المستخدم "{currentUser?.name}"؟</p>
            <p className="text-red-500 text-sm mt-2">لا يمكن التراجع عن هذا الإجراء</p>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowConfirmDeleteModal(false)}>
              إلغاء
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteUser}>
              نعم، احذف المستخدم
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Renew License Modal */}
      <Dialog open={showRenewModal} onOpenChange={setShowRenewModal}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>تجديد الترخيص</DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm">المدرسة: <strong>{renewingLicense?.schools?.name || renewingLicense?.schoolName || 'غير محدد'}</strong></p>
              <p className="text-sm">مفتاح الترخيص: <strong className="font-mono">{renewingLicense?.license_key || renewingLicense?.key}</strong></p>
            </div>
            
            <div className="space-y-2">
              <Label>مدة التجديد</Label>
              <Select value={renewMonths} onValueChange={setRenewMonths}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المدة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">شهر واحد</SelectItem>
                  <SelectItem value="3">3 أشهر</SelectItem>
                  <SelectItem value="6">6 أشهر</SelectItem>
                  <SelectItem value="12">سنة كاملة</SelectItem>
                  <SelectItem value="24">سنتان</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowRenewModal(false)}>
              إلغاء
            </Button>
            <Button type="button" className="bg-blue-600 hover:bg-blue-700" onClick={handleRenewLicense}>
              <RefreshCw className="h-4 w-4 ml-2" />
              تجديد الترخيص
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Confirm Delete License Modal */}
      <AlertDialog open={showDeleteLicenseModal} onOpenChange={setShowDeleteLicenseModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد إلغاء الترخيص</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              <div className="space-y-2">
                <p>هل أنت متأكد من إلغاء هذا الترخيص؟</p>
                <div className="p-3 bg-gray-50 rounded-lg mt-2">
                  <p className="text-sm">المدرسة: <strong>{deletingLicense?.schools?.name || deletingLicense?.schoolName || 'غير محدد'}</strong></p>
                  <p className="text-sm">مفتاح الترخيص: <strong className="font-mono">{deletingLicense?.license_key || deletingLicense?.key}</strong></p>
                </div>
                <p className="text-red-500 text-sm mt-2">سيتم إلغاء تفعيل هذا الترخيص ولن يتمكن أي جهاز من استخدامه</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteLicense}
            >
              نعم، إلغاء الترخيص
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SystemAdmin;
