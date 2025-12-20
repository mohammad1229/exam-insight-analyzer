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
import { useToast } from "@/hooks/use-toast";
import { Database, Cloud, Download, Upload, HardDrive } from "lucide-react";
import { downloadBackup, createAutomaticBackup, getBackups, restoreFromCloudBackup, getCloudBackupsForRestore } from "@/services/backupService";
import { getStoredLicense } from "@/services/licenseService";

interface BackupTabProps {
  isSystemAdmin?: boolean;
}

const BackupTab = ({ isSystemAdmin = false }: BackupTabProps) => {
  const { toast } = useToast();
  const [backups, setBackups] = useState<any[]>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const license = getStoredLicense();

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      const backupsData = await getBackups(license?.schoolId);
      setBackups(backupsData || []);
    } catch (error) {
      console.error("Error loading backups:", error);
    }
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
      await loadBackups();
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

  const handleRestoreFromFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backupData = JSON.parse(e.target?.result as string);
        
        // Restore each key
        Object.keys(backupData).forEach(key => {
          if (typeof backupData[key] === 'object') {
            localStorage.setItem(key, JSON.stringify(backupData[key]));
          } else {
            localStorage.setItem(key, backupData[key]);
          }
        });
        
        toast({
          title: "تم استعادة البيانات",
          description: "تم استعادة البيانات بنجاح. سيتم تحديث الصفحة.",
        });
        
        // Reload the page to apply changes
        setTimeout(() => window.location.reload(), 1500);
      } catch (error) {
        toast({
          title: "خطأ في استعادة البيانات",
          description: "ملف النسخة الاحتياطية غير صالح",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const handleRestoreFromCloud = async (backupId: string) => {
    try {
      setIsRestoring(true);
      await restoreFromCloudBackup(backupId);
      toast({
        title: "تم استعادة البيانات",
        description: "تم استعادة البيانات بنجاح. سيتم تحديث الصفحة.",
      });
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء استعادة البيانات",
        variant: "destructive",
      });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <Card className="border-2 border-green-500">
      <CardHeader className="bg-green-50 pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Database className="h-5 w-5" />
          النسخ الاحتياطي واستعادة البيانات
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-6">
        {/* School Info */}
        {license && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-1">المدرسة الحالية</h4>
            <p className="text-blue-600">{license.schoolName || 'غير محدد'}</p>
          </div>
        )}

        {/* Backup Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Local Backup */}
          <div className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center gap-2 text-green-700">
              <HardDrive className="h-5 w-5" />
              <h3 className="font-medium">نسخة احتياطية محلية</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              تنزيل نسخة احتياطية من البيانات على جهازك
            </p>
            <Button 
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={handleManualBackup}
            >
              <Download className="h-4 w-4 ml-2" />
              تنزيل نسخة احتياطية
            </Button>
          </div>

          {/* Cloud Backup */}
          <div className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center gap-2 text-blue-700">
              <Cloud className="h-5 w-5" />
              <h3 className="font-medium">نسخة احتياطية سحابية</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              حفظ نسخة احتياطية في السحابة
            </p>
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={handleCloudBackup}
              disabled={isLoadingBackups || !license?.schoolId}
            >
              <Cloud className="h-4 w-4 ml-2" />
              {isLoadingBackups ? "جاري الحفظ..." : "حفظ في السحابة"}
            </Button>
          </div>
        </div>

        {/* Restore from File */}
        <div className="p-4 border rounded-lg space-y-3">
          <div className="flex items-center gap-2 text-orange-700">
            <Upload className="h-5 w-5" />
            <h3 className="font-medium">استعادة من ملف</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            استعادة البيانات من ملف نسخة احتياطية محلية
          </p>
          <Label htmlFor="restoreFile" className="block w-full">
            <div className="cursor-pointer border-2 border-dashed border-orange-300 rounded-md p-4 text-center hover:border-orange-400 hover:bg-orange-50 transition-colors">
              <Input 
                id="restoreFile" 
                type="file" 
                accept=".json"
                className="hidden" 
                onChange={handleRestoreFromFile}
              />
              <Upload className="h-8 w-8 mx-auto text-orange-500 mb-2" />
              <span className="text-gray-600">انقر لاختيار ملف النسخة الاحتياطية</span>
            </div>
          </Label>
        </div>

        {/* Backup History */}
        {backups.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-lg">سجل النسخ الاحتياطية</h3>
            <div className="border rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
              <Table>
                <TableHeader className="bg-gray-100 sticky top-0">
                  <TableRow>
                    <TableHead className="text-right">المدرسة</TableHead>
                    <TableHead className="text-right">النوع</TableHead>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">الحجم</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backups.map((backup) => (
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
                      <TableCell>
                        {backup.status === 'completed' && localStorage.getItem(`backup_${backup.id}`) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestoreFromCloud(backup.id)}
                            disabled={isRestoring}
                            className="text-blue-600 border-blue-600 hover:bg-blue-50"
                          >
                            استعادة
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Auto Backup Info */}
        <div className="p-4 bg-gray-50 rounded-lg border">
          <h4 className="font-medium mb-2">معلومات النسخ الاحتياطي التلقائي</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• يتم إنشاء نسخة احتياطية تلقائياً يومياً في الساعة 11 مساءً</li>
            <li>• تحتوي النسخة الاحتياطية على: الطلاب، المعلمين، الصفوف، المواد، الاختبارات</li>
            <li>• يُنصح بتنزيل نسخة احتياطية محلية بشكل دوري للحفاظ على البيانات</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default BackupTab;
