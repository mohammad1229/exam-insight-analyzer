import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  XCircle
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
                      </TableRow>
                    ))}
                    {(!data?.devices || data.devices.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
    </div>
  );
};

export default SchoolsDataTab;
