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
import { Database, Cloud, Download, Upload, HardDrive, Trash2, RefreshCw } from "lucide-react";
import { 
  downloadBackup, 
  createCloudBackup, 
  getBackups, 
  restoreFromCloudBackup, 
  downloadCloudBackup,
  deleteBackup,
  getCurrentUserContext
} from "@/services/backupService";
import { getStoredLicense } from "@/services/licenseService";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface BackupTabProps {
  isSystemAdmin?: boolean;
}

const BackupTab = ({ isSystemAdmin = false }: BackupTabProps) => {
  const { toast } = useToast();
  const [backups, setBackups] = useState<any[]>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [backupToDelete, setBackupToDelete] = useState<string | null>(null);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [backupToRestore, setBackupToRestore] = useState<string | null>(null);
  
  const license = getStoredLicense();
  const userContext = getCurrentUserContext();

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      setIsLoadingBackups(true);
      const schoolId = isSystemAdmin ? undefined : license?.schoolId;
      const backupsData = await getBackups(schoolId);
      setBackups(backupsData || []);
    } catch (error) {
      console.error("Error loading backups:", error);
      toast({
        title: "خطأ في تحميل النسخ الاحتياطية",
        description: "تعذر تحميل قائمة النسخ الاحتياطية",
        variant: "destructive",
      });
    } finally {
      setIsLoadingBackups(false);
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
    if (!userContext) {
      toast({
        title: "خطأ",
        description: "يجب تسجيل الدخول أولاً",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreatingBackup(true);
      await createCloudBackup(userContext.schoolId, userContext.schoolName, 'manual');
      toast({
        title: "تم النسخ الاحتياطي",
        description: "تم حفظ النسخة الاحتياطية في السحابة بنجاح",
      });
      await loadBackups();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء النسخ الاحتياطي",
        variant: "destructive",
      });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleRestoreFromFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backupData = JSON.parse(e.target?.result as string);
        
        // Restore each key (except metadata)
        Object.keys(backupData).forEach(key => {
          if (key !== '_metadata') {
            if (typeof backupData[key] === 'object') {
              localStorage.setItem(key, JSON.stringify(backupData[key]));
            } else {
              localStorage.setItem(key, backupData[key]);
            }
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
    
    // Reset file input
    event.target.value = '';
  };

  const confirmRestore = (backupId: string) => {
    setBackupToRestore(backupId);
    setRestoreDialogOpen(true);
  };

  const handleRestoreFromCloud = async () => {
    if (!backupToRestore) return;

    try {
      setIsRestoring(true);
      setRestoreDialogOpen(false);
      
      await restoreFromCloudBackup(backupToRestore);
      
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
      setBackupToRestore(null);
    }
  };

  const handleDownloadCloudBackup = async (backupId: string) => {
    try {
      await downloadCloudBackup(backupId);
      toast({
        title: "جاري التحميل",
        description: "سيتم تحميل ملف النسخة الاحتياطية",
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء تحميل الملف",
        variant: "destructive",
      });
    }
  };

  const confirmDelete = (backupId: string) => {
    setBackupToDelete(backupId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteBackup = async () => {
    if (!backupToDelete) return;

    try {
      await deleteBackup(backupToDelete);
      toast({
        title: "تم الحذف",
        description: "تم حذف النسخة الاحتياطية بنجاح",
      });
      await loadBackups();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء الحذف",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setBackupToDelete(null);
    }
  };

  return (
    <>
      <Card className="border-2 border-green-500">
        <CardHeader className="bg-green-50 pb-2">
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              النسخ الاحتياطي واستعادة البيانات
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadBackups}
              disabled={isLoadingBackups}
            >
              <RefreshCw className={`h-4 w-4 ml-1 ${isLoadingBackups ? 'animate-spin' : ''}`} />
              تحديث
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-6">
          {/* School Info */}
          {userContext && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-1">
                {userContext.type === 'system_admin' ? 'مسؤول النظام' : 'المدرسة الحالية'}
              </h4>
              <p className="text-blue-600">{userContext.schoolName}</p>
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
                حفظ نسخة احتياطية في التخزين السحابي
              </p>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={handleCloudBackup}
                disabled={isCreatingBackup || !userContext}
              >
                <Cloud className="h-4 w-4 ml-2" />
                {isCreatingBackup ? "جاري الحفظ..." : "حفظ في السحابة"}
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
          <div className="space-y-3">
            <h3 className="font-medium text-lg">سجل النسخ الاحتياطية السحابية</h3>
            {isLoadingBackups ? (
              <div className="text-center py-8 text-muted-foreground">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                جاري التحميل...
              </div>
            ) : backups.length > 0 ? (
              <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
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
                          {backup.status === 'completed' && (
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => confirmRestore(backup.id)}
                                disabled={isRestoring}
                                className="text-blue-600 border-blue-600 hover:bg-blue-50"
                                title="استعادة"
                              >
                                <Upload className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadCloudBackup(backup.id)}
                                className="text-green-600 border-green-600 hover:bg-green-50"
                                title="تنزيل"
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => confirmDelete(backup.id)}
                                className="text-red-600 border-red-600 hover:bg-red-50"
                                title="حذف"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                <Cloud className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>لا توجد نسخ احتياطية سحابية</p>
                <p className="text-sm">قم بإنشاء نسخة احتياطية للبدء</p>
              </div>
            )}
          </div>

          {/* Auto Backup Info */}
          <div className="p-4 bg-gray-50 rounded-lg border">
            <h4 className="font-medium mb-2">معلومات النسخ الاحتياطي</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• يتم تخزين النسخ الاحتياطية السحابية بشكل آمن في الخادم</li>
              <li>• يمكنك استعادة أي نسخة احتياطية سابقة أو تنزيلها على جهازك</li>
              <li>• تحتوي النسخة الاحتياطية على: الطلاب، المعلمين، الصفوف، المواد، الاختبارات</li>
              <li>• يُنصح بإنشاء نسخ احتياطية بشكل دوري للحفاظ على البيانات</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذه النسخة الاحتياطية؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteBackup}
              className="bg-red-600 hover:bg-red-700"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الاستعادة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من استعادة هذه النسخة الاحتياطية؟ سيتم استبدال البيانات الحالية بالبيانات من النسخة الاحتياطية.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRestoreFromCloud}
              className="bg-blue-600 hover:bg-blue-700"
            >
              استعادة
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default BackupTab;