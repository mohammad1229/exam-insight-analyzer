import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Edit, Trash2, Building2, Key, Copy } from "lucide-react";
import { 
  getSchoolAdmins, 
  createSchoolAdmin, 
  updateSchoolAdmin, 
  deleteSchoolAdmin,
  getSchools,
  getLicenses,
  SchoolAdmin 
} from "@/services/licenseService";

const SchoolAdminsTab = () => {
  const { toast } = useToast();
  const [admins, setAdmins] = useState<SchoolAdmin[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [licenses, setLicenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<SchoolAdmin | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    school_id: "",
    license_id: "",
    username: "",
    password: "",
    full_name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [adminsData, schoolsData, licensesData] = await Promise.all([
        getSchoolAdmins(),
        getSchools(),
        getLicenses(),
      ]);
      setAdmins(adminsData || []);
      setSchools(schoolsData || []);
      setLicenses(licensesData || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "خطأ في تحميل البيانات",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      school_id: "",
      license_id: "",
      username: "",
      password: "",
      full_name: "",
      email: "",
      phone: "",
    });
  };

  const handleAddAdmin = async () => {
    if (!formData.school_id || !formData.username || !formData.password || !formData.full_name) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    try {
      await createSchoolAdmin({
        school_id: formData.school_id,
        license_id: formData.license_id || undefined,
        username: formData.username,
        password: formData.password,
        full_name: formData.full_name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
      });

      toast({
        title: "تم بنجاح",
        description: "تم إضافة مدير المدرسة بنجاح",
      });

      setShowAddModal(false);
      resetForm();
      loadData();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إضافة مدير المدرسة",
        variant: "destructive",
      });
    }
  };

  const handleEditAdmin = async () => {
    if (!selectedAdmin) return;

    try {
      const updates: any = {
        full_name: formData.full_name,
        email: formData.email || null,
        phone: formData.phone || null,
        school_id: formData.school_id,
        license_id: formData.license_id || null,
      };

      if (formData.username !== selectedAdmin.username) {
        updates.username = formData.username;
      }

      if (formData.password) {
        updates.password = formData.password;
      }

      await updateSchoolAdmin(selectedAdmin.id, updates);

      toast({
        title: "تم بنجاح",
        description: "تم تحديث بيانات مدير المدرسة",
      });

      setShowEditModal(false);
      setSelectedAdmin(null);
      resetForm();
      loadData();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث البيانات",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAdmin = async () => {
    if (!selectedAdmin) return;

    try {
      await deleteSchoolAdmin(selectedAdmin.id);

      toast({
        title: "تم بنجاح",
        description: "تم حذف مدير المدرسة",
      });

      setShowDeleteModal(false);
      setSelectedAdmin(null);
      loadData();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في حذف مدير المدرسة",
        variant: "destructive",
      });
    }
  };

  const openEditModal = (admin: SchoolAdmin) => {
    setSelectedAdmin(admin);
    setFormData({
      school_id: admin.school_id,
      license_id: admin.license_id || "",
      username: admin.username,
      password: "",
      full_name: admin.full_name,
      email: admin.email || "",
      phone: admin.phone || "",
    });
    setShowEditModal(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "تم النسخ",
      description: "تم نسخ اسم المستخدم إلى الحافظة",
    });
  };

  // Get licenses for a specific school
  const getSchoolLicenses = (schoolId: string) => {
    return licenses.filter((l: any) => l.school_id === schoolId);
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-purple-500">
        <CardHeader className="bg-gradient-to-r from-purple-100 to-white border-b border-purple-500">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              إدارة مدراء المدارس
            </CardTitle>
            <Button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <UserPlus className="h-4 w-4 ml-2" />
              إضافة مدير مدرسة
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-8">جاري التحميل...</div>
          ) : admins.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              لا يوجد مدراء مدارس. قم بإضافة مدير جديد.
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-black text-white">
                  <TableRow>
                    <TableHead className="text-right text-white">الاسم الكامل</TableHead>
                    <TableHead className="text-right text-white">اسم المستخدم</TableHead>
                    <TableHead className="text-right text-white">المدرسة</TableHead>
                    <TableHead className="text-right text-white">الترخيص</TableHead>
                    <TableHead className="text-right text-white">الحالة</TableHead>
                    <TableHead className="text-right text-white">آخر دخول</TableHead>
                    <TableHead className="text-right text-white">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => (
                    <TableRow key={admin.id} className="border-t hover:bg-gray-50">
                      <TableCell className="font-semibold">{admin.full_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{admin.username}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(admin.username)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{admin.schools?.name || "غير محدد"}</TableCell>
                      <TableCell>
                        {admin.licenses ? (
                          <span className={`px-2 py-1 rounded text-xs ${
                            admin.licenses.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {admin.licenses.license_key?.slice(0, 9)}...
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${
                          admin.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {admin.is_active ? "نشط" : "معطل"}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {admin.last_login_at 
                          ? new Date(admin.last_login_at).toLocaleDateString('ar-SA')
                          : "لم يسجل دخول"
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(admin)}
                            className="text-blue-600 border-blue-600 hover:bg-blue-50"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedAdmin(admin);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Admin Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة مدير مدرسة جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>المدرسة *</Label>
              <Select
                value={formData.school_id}
                onValueChange={(value) => setFormData({ ...formData, school_id: value, license_id: "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المدرسة" />
                </SelectTrigger>
                <SelectContent>
                  {schools.map((school) => (
                    <SelectItem key={school.id} value={school.id}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.school_id && (
              <div className="space-y-2">
                <Label>الترخيص</Label>
                <Select
                  value={formData.license_id}
                  onValueChange={(value) => setFormData({ ...formData, license_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الترخيص (اختياري)" />
                  </SelectTrigger>
                  <SelectContent>
                    {getSchoolLicenses(formData.school_id).map((license: any) => (
                      <SelectItem key={license.id} value={license.id}>
                        {license.license_key} {license.is_active ? "(نشط)" : "(معطل)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>الاسم الكامل *</Label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="أدخل الاسم الكامل"
              />
            </div>

            <div className="space-y-2">
              <Label>اسم المستخدم *</Label>
              <Input
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="أدخل اسم المستخدم"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label>كلمة المرور *</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="أدخل كلمة المرور"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label>البريد الإلكتروني</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="البريد الإلكتروني (اختياري)"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label>رقم الهاتف</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="رقم الهاتف (اختياري)"
                dir="ltr"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              إلغاء
            </Button>
            <Button onClick={handleAddAdmin} className="bg-purple-600 hover:bg-purple-700">
              إضافة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Admin Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل بيانات مدير المدرسة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>المدرسة *</Label>
              <Select
                value={formData.school_id}
                onValueChange={(value) => setFormData({ ...formData, school_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المدرسة" />
                </SelectTrigger>
                <SelectContent>
                  {schools.map((school) => (
                    <SelectItem key={school.id} value={school.id}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>الترخيص</Label>
              <Select
                value={formData.license_id}
                onValueChange={(value) => setFormData({ ...formData, license_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الترخيص (اختياري)" />
                </SelectTrigger>
                <SelectContent>
                  {getSchoolLicenses(formData.school_id).map((license: any) => (
                    <SelectItem key={license.id} value={license.id}>
                      {license.license_key} {license.is_active ? "(نشط)" : "(معطل)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>الاسم الكامل *</Label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>اسم المستخدم *</Label>
              <Input
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label>كلمة المرور الجديدة</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="اتركه فارغاً للإبقاء على كلمة المرور الحالية"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label>البريد الإلكتروني</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label>رقم الهاتف</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                dir="ltr"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              إلغاء
            </Button>
            <Button onClick={handleEditAdmin} className="bg-blue-600 hover:bg-blue-700">
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف مدير المدرسة "{selectedAdmin?.full_name}"؟
              <br />
              لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAdmin}
              className="bg-red-600 hover:bg-red-700"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SchoolAdminsTab;