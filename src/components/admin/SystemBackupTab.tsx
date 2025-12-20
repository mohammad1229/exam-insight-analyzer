import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Database, Cloud, Download, Upload, HardDrive, School, RefreshCw } from "lucide-react";
import { getSchools } from "@/services/licenseService";
import { supabase } from "@/integrations/supabase/client";

const SystemBackupTab = () => {
  const { toast } = useToast();
  const [schools, setSchools] = useState<any[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("");
  const [backups, setBackups] = useState<any[]>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [isLoadingSchools, setIsLoadingSchools] = useState(false);

  useEffect(() => {
    loadSchools();
    loadAllBackups();
  }, []);

  const loadSchools = async () => {
    try {
      setIsLoadingSchools(true);
      const schoolsData = await getSchools();
      setSchools(schoolsData || []);
    } catch (error) {
      console.error("Error loading schools:", error);
    } finally {
      setIsLoadingSchools(false);
    }
  };

  const loadAllBackups = async () => {
    try {
      setIsLoadingBackups(true);
      const { data, error } = await supabase
        .from("backups")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      setBackups(data || []);
    } catch (error) {
      console.error("Error loading backups:", error);
    } finally {
      setIsLoadingBackups(false);
    }
  };

  const loadSchoolBackups = async (schoolId: string) => {
    if (!schoolId) {
      loadAllBackups();
      return;
    }
    
    try {
      setIsLoadingBackups(true);
      const { data, error } = await supabase
        .from("backups")
        .select("*")
        .eq("school_id", schoolId)
        .order("created_at", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      setBackups(data || []);
    } catch (error) {
      console.error("Error loading school backups:", error);
    } finally {
      setIsLoadingBackups(false);
    }
  };

  const handleSchoolChange = (schoolId: string) => {
    setSelectedSchoolId(schoolId);
    if (schoolId === "all") {
      loadAllBackups();
    } else {
      loadSchoolBackups(schoolId);
    }
  };

  const handleDownloadAllSchoolsBackup = async () => {
    try {
      // Get all schools data
      const { data: schoolsData } = await supabase.from("schools").select("*");
      const { data: licensesData } = await supabase.from("licenses").select("*");
      const { data: adminsData } = await supabase.from("school_admins").select("id, username, full_name, email, phone, school_id, is_active, created_at");
      
      const backupData = {
        exportDate: new Date().toISOString(),
        schools: schoolsData || [],
        licenses: licensesData || [],
        admins: adminsData || [],
      };

      const jsonData = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `all_schools_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "تم التنزيل",
        description: "تم تنزيل نسخة احتياطية لجميع المدارس",
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء التنزيل",
        variant: "destructive",
      });
    }
  };

  const handleDownloadSchoolBackup = async (schoolId: string) => {
    try {
      const school = schools.find(s => s.id === schoolId);
      
      const { data: licenseData } = await supabase
        .from("licenses")
        .select("*")
        .eq("school_id", schoolId);
      
      const { data: adminData } = await supabase
        .from("school_admins")
        .select("id, username, full_name, email, phone, school_id, is_active, created_at")
        .eq("school_id", schoolId);

      const backupData = {
        exportDate: new Date().toISOString(),
        school: school,
        licenses: licenseData || [],
        admins: adminData || [],
      };

      const jsonData = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${school?.name || 'school'}_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "تم التنزيل",
        description: `تم تنزيل نسخة احتياطية للمدرسة: ${school?.name}`,
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء التنزيل",
        variant: "destructive",
      });
    }
  };

  const getSchoolName = (schoolId: string) => {
    const school = schools.find(s => s.id === schoolId);
    return school?.name || 'غير محدد';
  };

  return (
    <div className="space-y-6">
      {/* Schools Selection */}
      <Card className="border-2 border-blue-500">
        <CardHeader className="bg-gradient-to-r from-blue-100 to-white border-b border-blue-500">
          <CardTitle className="flex items-center gap-2">
            <School className="h-5 w-5" />
            اختيار المدرسة
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>المدرسة</Label>
              <Select value={selectedSchoolId} onValueChange={handleSchoolChange}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع المدارس" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المدارس</SelectItem>
                  {schools.map((school) => (
                    <SelectItem key={school.id} value={school.id}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  loadSchools();
                  loadAllBackups();
                }}
                disabled={isLoadingSchools}
              >
                <RefreshCw className={`h-4 w-4 ml-2 ${isLoadingSchools ? 'animate-spin' : ''}`} />
                تحديث
              </Button>
            </div>
          </div>
          
          {/* Schools List */}
          {schools.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium mb-3">المدارس المسجلة ({schools.length})</h4>
              <div className="border rounded-lg overflow-hidden max-h-[200px] overflow-y-auto">
                <Table>
                  <TableHeader className="bg-gray-100 sticky top-0">
                    <TableRow>
                      <TableHead className="text-right">اسم المدرسة</TableHead>
                      <TableHead className="text-right">المدير</TableHead>
                      <TableHead className="text-right">تاريخ الإنشاء</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schools.map((school) => (
                      <TableRow key={school.id}>
                        <TableCell className="font-medium">{school.name}</TableCell>
                        <TableCell>{school.director_name || '-'}</TableCell>
                        <TableCell>
                          {new Date(school.created_at).toLocaleDateString('ar-SA')}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadSchoolBackup(school.id)}
                            className="text-green-600 border-green-600 hover:bg-green-50"
                          >
                            <Download className="h-4 w-4 ml-1" />
                            تنزيل
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Backup Actions */}
      <Card className="border-2 border-green-500">
        <CardHeader className="bg-gradient-to-r from-green-100 to-white border-b border-green-500">
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            النسخ الاحتياطي
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Download All Schools */}
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center gap-2 text-green-700">
                <HardDrive className="h-5 w-5" />
                <h3 className="font-medium">نسخة احتياطية لجميع المدارس</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                تنزيل نسخة احتياطية تحتوي على بيانات جميع المدارس والتراخيص
              </p>
              <Button 
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={handleDownloadAllSchoolsBackup}
              >
                <Download className="h-4 w-4 ml-2" />
                تنزيل نسخة شاملة
              </Button>
            </div>

            {/* Download Selected School */}
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center gap-2 text-blue-700">
                <School className="h-5 w-5" />
                <h3 className="font-medium">نسخة احتياطية لمدرسة محددة</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedSchoolId && selectedSchoolId !== "all" 
                  ? `تنزيل نسخة احتياطية للمدرسة: ${getSchoolName(selectedSchoolId)}`
                  : "اختر مدرسة من القائمة أعلاه أولاً"
                }
              </p>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => selectedSchoolId && selectedSchoolId !== "all" && handleDownloadSchoolBackup(selectedSchoolId)}
                disabled={!selectedSchoolId || selectedSchoolId === "all"}
              >
                <Download className="h-4 w-4 ml-2" />
                تنزيل نسخة المدرسة
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backup History */}
      <Card className="border-2 border-gray-400">
        <CardHeader className="bg-gradient-to-r from-gray-100 to-white border-b border-gray-400">
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            سجل النسخ الاحتياطية
            {selectedSchoolId && selectedSchoolId !== "all" && (
              <span className="text-sm font-normal text-muted-foreground">
                ({getSchoolName(selectedSchoolId)})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoadingBackups ? (
            <div className="text-center py-8 text-gray-500">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
              جاري التحميل...
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              لا توجد نسخ احتياطية مسجلة
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader className="bg-gray-100 sticky top-0">
                  <TableRow>
                    <TableHead className="text-right">المدرسة</TableHead>
                    <TableHead className="text-right">النوع</TableHead>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">الحجم</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backups.map((backup) => (
                    <TableRow key={backup.id}>
                      <TableCell>{backup.school_name || getSchoolName(backup.school_id)}</TableCell>
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
                        {new Date(backup.created_at).toLocaleDateString('ar-SA', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                      <TableCell>
                        {backup.file_size 
                          ? `${(backup.file_size / 1024).toFixed(1)} KB`
                          : '-'
                        }
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemBackupTab;
