import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  School, 
  Users, 
  Key, 
  Smartphone, 
  RefreshCw, 
  Download,
  BarChart3,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Copy
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SchoolData {
  schools: any[];
  licenses: any[];
  admins: any[];
  devices: any[];
  backups: any[];
  stats: {
    totalSchools: number;
    totalLicenses: number;
    activeLicenses: number;
    totalAdmins: number;
    activeAdmins: number;
    totalDevices: number;
  };
}

const SchoolsDataTab = () => {
  const { toast } = useToast();
  const [data, setData] = useState<SchoolData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState("schools");

  // Edit modals
  const [showEditSchoolModal, setShowEditSchoolModal] = useState(false);
  const [editingSchool, setEditingSchool] = useState<any>(null);
  const [showDeleteSchoolModal, setShowDeleteSchoolModal] = useState(false);
  const [deletingSchool, setDeletingSchool] = useState<any>(null);

  const [showEditLicenseModal, setShowEditLicenseModal] = useState(false);
  const [editingLicense, setEditingLicense] = useState<any>(null);
  const [showDeleteLicenseModal, setShowDeleteLicenseModal] = useState(false);
  const [deletingLicense, setDeletingLicense] = useState<any>(null);

  const [showDeleteDeviceModal, setShowDeleteDeviceModal] = useState(false);
  const [deletingDevice, setDeletingDevice] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const { data: result, error } = await supabase.functions.invoke('get-all-schools-data');
      
      if (error) throw error;
      
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast({
        title: "خطأ في تحميل البيانات",
        description: error.message || "حدث خطأ أثناء جلب البيانات",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string = "النص") => {
    navigator.clipboard.writeText(text);
    toast({
      title: "تم النسخ",
      description: `تم نسخ ${label} إلى الحافظة`,
    });
  };

  const handleEditSchool = async () => {
    if (!editingSchool) return;
    try {
      const { error } = await supabase.functions.invoke('get-admin-data', {
        body: { 
          action: 'updateSchool',
          schoolId: editingSchool.id,
          updateData: {
            name: editingSchool.name,
            director_name: editingSchool.director_name,
            email: editingSchool.email,
            phone: editingSchool.phone,
            address: editingSchool.address
          }
        }
      });
      if (error) throw error;
      toast({ title: "تم التحديث", description: "تم تحديث بيانات المدرسة بنجاح" });
      setShowEditSchoolModal(false);
      loadData();
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteSchool = async () => {
    if (!deletingSchool) return;
    try {
      const { error } = await supabase.functions.invoke('get-admin-data', {
        body: { action: 'deleteSchool', schoolId: deletingSchool.id }
      });
      if (error) throw error;
      toast({ title: "تم الحذف", description: "تم حذف المدرسة بنجاح" });
      setShowDeleteSchoolModal(false);
      loadData();
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  };

  const handleEditLicense = async () => {
    if (!editingLicense) return;
    try {
      const { error } = await supabase.functions.invoke('get-admin-data', {
        body: { 
          action: 'updateLicense',
          licenseId: editingLicense.id,
          updateData: {
            max_devices: parseInt(editingLicense.max_devices),
            is_active: editingLicense.is_active
          }
        }
      });
      if (error) throw error;
      toast({ title: "تم التحديث", description: "تم تحديث الترخيص بنجاح" });
      setShowEditLicenseModal(false);
      loadData();
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteLicense = async () => {
    if (!deletingLicense) return;
    try {
      const { error } = await supabase.functions.invoke('manage-license', {
        body: { action: 'delete', licenseId: deletingLicense.id }
      });
      if (error) throw error;
      toast({ title: "تم الحذف", description: "تم حذف الترخيص بنجاح" });
      setShowDeleteLicenseModal(false);
      loadData();
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteDevice = async () => {
    if (!deletingDevice) return;
    try {
      const { error } = await supabase.functions.invoke('get-admin-data', {
        body: { action: 'deleteDevice', deviceId: deletingDevice.id }
      });
      if (error) throw error;
      toast({ title: "تم الحذف", description: "تم حذف الجهاز بنجاح" });
      setShowDeleteDeviceModal(false);
      loadData();
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  };

  const exportToJson = () => {
    if (!data) return;
    
    const jsonData = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `schools_data_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "تم التصدير",
      description: "تم تنزيل ملف البيانات بنجاح",
    });
  };

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="mr-3 text-lg">جاري تحميل البيانات...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {data?.stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="border-2 border-blue-500">
            <CardContent className="pt-4 text-center">
              <School className="h-8 w-8 mx-auto text-blue-600 mb-2" />
              <p className="text-2xl font-bold text-blue-600">{data.stats.totalSchools}</p>
              <p className="text-sm text-muted-foreground">المدارس</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-green-500">
            <CardContent className="pt-4 text-center">
              <Key className="h-8 w-8 mx-auto text-green-600 mb-2" />
              <p className="text-2xl font-bold text-green-600">{data.stats.totalLicenses}</p>
              <p className="text-sm text-muted-foreground">التراخيص</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-emerald-500">
            <CardContent className="pt-4 text-center">
              <CheckCircle className="h-8 w-8 mx-auto text-emerald-600 mb-2" />
              <p className="text-2xl font-bold text-emerald-600">{data.stats.activeLicenses}</p>
              <p className="text-sm text-muted-foreground">تراخيص نشطة</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-purple-500">
            <CardContent className="pt-4 text-center">
              <Users className="h-8 w-8 mx-auto text-purple-600 mb-2" />
              <p className="text-2xl font-bold text-purple-600">{data.stats.totalAdmins}</p>
              <p className="text-sm text-muted-foreground">المدراء</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-indigo-500">
            <CardContent className="pt-4 text-center">
              <Users className="h-8 w-8 mx-auto text-indigo-600 mb-2" />
              <p className="text-2xl font-bold text-indigo-600">{data.stats.activeAdmins}</p>
              <p className="text-sm text-muted-foreground">مدراء نشطون</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-orange-500">
            <CardContent className="pt-4 text-center">
              <Smartphone className="h-8 w-8 mx-auto text-orange-600 mb-2" />
              <p className="text-2xl font-bold text-orange-600">{data.stats.totalDevices}</p>
              <p className="text-sm text-muted-foreground">الأجهزة</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={loadData} disabled={isLoading} variant="outline">
          <RefreshCw className={`h-4 w-4 ml-2 ${isLoading ? 'animate-spin' : ''}`} />
          تحديث البيانات
        </Button>
        <Button onClick={exportToJson} disabled={!data} className="bg-green-600 hover:bg-green-700">
          <Download className="h-4 w-4 ml-2" />
          تصدير JSON
        </Button>
      </div>

      {/* Data Tables */}
      <Card className="border-2 border-gray-400">
        <CardHeader className="bg-gradient-to-r from-gray-100 to-white border-b">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            بيانات المدارس من قاعدة البيانات
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
            <TabsList className="grid grid-cols-4 w-full mb-4">
              <TabsTrigger value="schools">المدارس ({data?.schools?.length || 0})</TabsTrigger>
              <TabsTrigger value="licenses">التراخيص ({data?.licenses?.length || 0})</TabsTrigger>
              <TabsTrigger value="admins">المدراء ({data?.admins?.length || 0})</TabsTrigger>
              <TabsTrigger value="devices">الأجهزة ({data?.devices?.length || 0})</TabsTrigger>
            </TabsList>

            {/* Schools Tab */}
            <TabsContent value="schools">
              <div className="border rounded-lg overflow-hidden max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader className="bg-blue-100 sticky top-0">
                    <TableRow>
                      <TableHead className="text-right">اسم المدرسة</TableHead>
                      <TableHead className="text-right">المدير</TableHead>
                      <TableHead className="text-right">البريد</TableHead>
                      <TableHead className="text-right">الهاتف</TableHead>
                      <TableHead className="text-right">تاريخ الإنشاء</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.schools?.map((school) => (
                      <TableRow key={school.id} className="hover:bg-blue-50">
                        <TableCell className="font-medium">{school.name}</TableCell>
                        <TableCell>{school.director_name || '-'}</TableCell>
                        <TableCell>{school.email || '-'}</TableCell>
                        <TableCell>{school.phone || '-'}</TableCell>
                        <TableCell>
                          {new Date(school.created_at).toLocaleDateString('ar-SA')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(school.name, "اسم المدرسة")}
                              className="h-7 w-7 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingSchool({ ...school });
                                setShowEditSchoolModal(true);
                              }}
                              className="h-7 w-7 p-0 text-blue-600"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setDeletingSchool(school);
                                setShowDeleteSchoolModal(true);
                              }}
                              className="h-7 w-7 p-0 text-red-600"
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
            </TabsContent>

            {/* Licenses Tab */}
            <TabsContent value="licenses">
              <div className="border rounded-lg overflow-hidden max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader className="bg-green-100 sticky top-0">
                    <TableRow>
                      <TableHead className="text-right">مفتاح الترخيص</TableHead>
                      <TableHead className="text-right">المدرسة</TableHead>
                      <TableHead className="text-right">النوع</TableHead>
                      <TableHead className="text-right">الأجهزة</TableHead>
                      <TableHead className="text-right">انتهاء الصلاحية</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.licenses?.map((license) => {
                      const isExpired = license.expiry_date && new Date(license.expiry_date) < new Date();
                      return (
                        <TableRow key={license.id} className="hover:bg-green-50">
                          <TableCell className="font-mono text-sm">{license.license_key}</TableCell>
                          <TableCell>{license.schools?.name || '-'}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs ${
                              license.is_trial ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {license.is_trial ? 'تجريبي' : 'مرخص'}
                            </span>
                          </TableCell>
                          <TableCell>{license.max_devices}</TableCell>
                          <TableCell>
                            {license.expiry_date 
                              ? new Date(license.expiry_date).toLocaleDateString('ar-SA')
                              : '-'
                            }
                          </TableCell>
                          <TableCell>
                            {license.is_active ? (
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                                isExpired ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {isExpired ? <XCircle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                                {isExpired ? 'منتهي' : 'نشط'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-gray-100 text-gray-800">
                                <XCircle className="h-3 w-3" />
                                غير نشط
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(license.license_key, "مفتاح الترخيص")}
                                className="h-7 w-7 p-0"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingLicense({ ...license });
                                  setShowEditLicenseModal(true);
                                }}
                                className="h-7 w-7 p-0 text-blue-600"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setDeletingLicense(license);
                                  setShowDeleteLicenseModal(true);
                                }}
                                className="h-7 w-7 p-0 text-red-600"
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
            </TabsContent>

            {/* Admins Tab */}
            <TabsContent value="admins">
              <div className="border rounded-lg overflow-hidden max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader className="bg-purple-100 sticky top-0">
                    <TableRow>
                      <TableHead className="text-right">اسم المستخدم</TableHead>
                      <TableHead className="text-right">الاسم الكامل</TableHead>
                      <TableHead className="text-right">المدرسة</TableHead>
                      <TableHead className="text-right">البريد</TableHead>
                      <TableHead className="text-right">آخر دخول</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.admins?.map((admin) => (
                      <TableRow key={admin.id} className="hover:bg-purple-50">
                        <TableCell className="font-mono">{admin.username}</TableCell>
                        <TableCell>{admin.full_name}</TableCell>
                        <TableCell>{admin.schools?.name || '-'}</TableCell>
                        <TableCell>{admin.email || '-'}</TableCell>
                        <TableCell>
                          {admin.last_login_at 
                            ? new Date(admin.last_login_at).toLocaleDateString('ar-SA', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                            admin.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {admin.is_active ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                            {admin.is_active ? 'نشط' : 'غير نشط'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(admin.username, "اسم المستخدم")}
                              className="h-7 w-7 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Devices Tab */}
            <TabsContent value="devices">
              <div className="border rounded-lg overflow-hidden max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader className="bg-orange-100 sticky top-0">
                    <TableRow>
                      <TableHead className="text-right">معرف الجهاز</TableHead>
                      <TableHead className="text-right">اسم الجهاز</TableHead>
                      <TableHead className="text-right">الترخيص</TableHead>
                      <TableHead className="text-right">المدرسة</TableHead>
                      <TableHead className="text-right">تاريخ التفعيل</TableHead>
                      <TableHead className="text-right">آخر نشاط</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.devices?.map((device) => (
                      <TableRow key={device.id} className="hover:bg-orange-50">
                        <TableCell className="font-mono text-xs">{device.device_id.substring(0, 20)}...</TableCell>
                        <TableCell>{device.device_name || '-'}</TableCell>
                        <TableCell className="font-mono text-xs">{device.licenses?.license_key || '-'}</TableCell>
                        <TableCell>{device.licenses?.schools?.name || '-'}</TableCell>
                        <TableCell>
                          {new Date(device.activated_at).toLocaleDateString('ar-SA')}
                        </TableCell>
                        <TableCell>
                          {new Date(device.last_seen_at).toLocaleDateString('ar-SA', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                            device.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {device.is_active ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                            {device.is_active ? 'نشط' : 'غير نشط'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(device.device_id, "معرف الجهاز")}
                              className="h-7 w-7 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setDeletingDevice(device);
                                setShowDeleteDeviceModal(true);
                              }}
                              className="h-7 w-7 p-0 text-red-600"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!data?.devices || data.devices.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          لا توجد أجهزة مسجلة
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit School Modal */}
      <Dialog open={showEditSchoolModal} onOpenChange={setShowEditSchoolModal}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل بيانات المدرسة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>اسم المدرسة</Label>
              <Input
                value={editingSchool?.name || ""}
                onChange={(e) => setEditingSchool({ ...editingSchool, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>اسم المدير</Label>
              <Input
                value={editingSchool?.director_name || ""}
                onChange={(e) => setEditingSchool({ ...editingSchool, director_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>البريد الإلكتروني</Label>
              <Input
                value={editingSchool?.email || ""}
                onChange={(e) => setEditingSchool({ ...editingSchool, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>رقم الهاتف</Label>
              <Input
                value={editingSchool?.phone || ""}
                onChange={(e) => setEditingSchool({ ...editingSchool, phone: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditSchoolModal(false)}>إلغاء</Button>
            <Button onClick={handleEditSchool}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete School Confirmation */}
      <AlertDialog open={showDeleteSchoolModal} onOpenChange={setShowDeleteSchoolModal}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المدرسة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف المدرسة "{deletingSchool?.name}"؟ سيتم حذف جميع البيانات المرتبطة بها.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSchool} className="bg-red-600 hover:bg-red-700">حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit License Modal */}
      <Dialog open={showEditLicenseModal} onOpenChange={setShowEditLicenseModal}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل الترخيص</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>مفتاح الترخيص</Label>
              <Input value={editingLicense?.license_key || ""} disabled className="font-mono" />
            </div>
            <div className="space-y-2">
              <Label>عدد الأجهزة</Label>
              <Input
                type="number"
                value={editingLicense?.max_devices || 1}
                onChange={(e) => setEditingLicense({ ...editingLicense, max_devices: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editingLicense?.is_active || false}
                onChange={(e) => setEditingLicense({ ...editingLicense, is_active: e.target.checked })}
              />
              <Label>نشط</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditLicenseModal(false)}>إلغاء</Button>
            <Button onClick={handleEditLicense}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete License Confirmation */}
      <AlertDialog open={showDeleteLicenseModal} onOpenChange={setShowDeleteLicenseModal}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الترخيص</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف الترخيص "{deletingLicense?.license_key}"؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLicense} className="bg-red-600 hover:bg-red-700">حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Device Confirmation */}
      <AlertDialog open={showDeleteDeviceModal} onOpenChange={setShowDeleteDeviceModal}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الجهاز</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا الجهاز؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDevice} className="bg-red-600 hover:bg-red-700">حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SchoolsDataTab;
