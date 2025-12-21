import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  getStorageStatus, 
  syncPendingChanges, 
  downloadCloudData,
  initHybridStorage 
} from "@/services/hybridStorageService";
import { getStorageSettings, saveStorageSettings, StorageSettings, exportAllData } from "@/services/indexedDBService";
import { 
  Cloud, 
  HardDrive, 
  RefreshCw, 
  Download, 
  Upload,
  Wifi,
  WifiOff,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileJson,
  FileSpreadsheet
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const StorageSettingsTab = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<StorageSettings>({
    id: 'storage_settings',
    storageMode: 'hybrid',
    autoSync: true,
    syncInterval: 5,
    lastSyncTime: null
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadSettings();
    
    // Initialize hybrid storage
    initHybridStorage();
    
    // Set up online/offline listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadSettings = async () => {
    try {
      const status = await getStorageStatus();
      const currentSettings = await getStorageSettings();
      setSettings(currentSettings);
      setPendingSyncCount(status.pendingSyncCount);
      setIsOnline(status.isOnline);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeChange = async (mode: StorageSettings['storageMode']) => {
    try {
      await saveStorageSettings({ storageMode: mode });
      setSettings(prev => ({ ...prev, storageMode: mode }));
      toast({
        title: "تم تحديث الإعدادات",
        description: `تم تغيير نوع التخزين إلى ${getModeLabel(mode)}`,
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في حفظ الإعدادات",
        variant: "destructive",
      });
    }
  };

  const handleAutoSyncChange = async (enabled: boolean) => {
    try {
      await saveStorageSettings({ autoSync: enabled });
      setSettings(prev => ({ ...prev, autoSync: enabled }));
      toast({
        title: "تم تحديث الإعدادات",
        description: enabled ? "تم تفعيل المزامنة التلقائية" : "تم إيقاف المزامنة التلقائية",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في حفظ الإعدادات",
        variant: "destructive",
      });
    }
  };

  const handleSyncIntervalChange = async (interval: string) => {
    try {
      const intervalNum = parseInt(interval);
      await saveStorageSettings({ syncInterval: intervalNum });
      setSettings(prev => ({ ...prev, syncInterval: intervalNum }));
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في حفظ الإعدادات",
        variant: "destructive",
      });
    }
  };

  const handleManualSync = async () => {
    if (!isOnline) {
      toast({
        title: "غير متصل",
        description: "لا يوجد اتصال بالإنترنت",
        variant: "destructive",
      });
      return;
    }

    setIsSyncing(true);
    try {
      const result = await syncPendingChanges();
      toast({
        title: "تمت المزامنة",
        description: `تم مزامنة ${result.success} عنصر${result.failed > 0 ? ` وفشل ${result.failed}` : ''}`,
      });
      await loadSettings();
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في المزامنة",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDownloadFromCloud = async () => {
    if (!isOnline) {
      toast({
        title: "غير متصل",
        description: "لا يوجد اتصال بالإنترنت",
        variant: "destructive",
      });
      return;
    }

    setIsDownloading(true);
    try {
      await downloadCloudData();
      toast({
        title: "تم التحميل",
        description: "تم تحميل البيانات من السحابة إلى التخزين المحلي",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل البيانات",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleExportLocalData = async () => {
    setIsExporting(true);
    try {
      const schoolId = localStorage.getItem("currentSchoolId") || "";
      const data = await exportAllData(schoolId);
      
      // Create JSON blob
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = `school_data_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "تم التصدير",
        description: "تم تصدير البيانات المحلية بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تصدير البيانات",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case 'local': return 'محلي فقط';
      case 'cloud': return 'سحابي فقط';
      case 'hybrid': return 'هجين (محلي + سحابي)';
      default: return mode;
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'local': return <HardDrive className="h-5 w-5" />;
      case 'cloud': return <Cloud className="h-5 w-5" />;
      case 'hybrid': return (
        <div className="flex gap-1">
          <HardDrive className="h-4 w-4" />
          <Cloud className="h-4 w-4" />
        </div>
      );
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            {isOnline ? (
              <>
                <Wifi className="h-5 w-5 text-green-500" />
                <span>متصل بالإنترنت</span>
              </>
            ) : (
              <>
                <WifiOff className="h-5 w-5 text-red-500" />
                <span>غير متصل بالإنترنت</span>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {pendingSyncCount > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {pendingSyncCount} عنصر بانتظار المزامنة
                </Badge>
              )}
              {settings.lastSyncTime && (
                <span className="text-sm text-muted-foreground">
                  آخر مزامنة: {new Date(settings.lastSyncTime).toLocaleString('ar-SA')}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleManualSync}
                disabled={isSyncing || !isOnline}
              >
                {isSyncing ? (
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 ml-2" />
                )}
                مزامنة الآن
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Storage Mode */}
      <Card>
        <CardHeader>
          <CardTitle>نوع التخزين</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['local', 'hybrid', 'cloud'] as const).map((mode) => (
              <div
                key={mode}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  settings.storageMode === mode
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => handleModeChange(mode)}
              >
                <div className="flex items-center justify-between mb-2">
                  {getModeIcon(mode)}
                  {settings.storageMode === mode && (
                    <CheckCircle className="h-5 w-5 text-primary" />
                  )}
                </div>
                <h3 className="font-semibold">{getModeLabel(mode)}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {mode === 'local' && 'البيانات تُحفظ على جهازك فقط'}
                  {mode === 'cloud' && 'البيانات تُحفظ في السحابة فقط'}
                  {mode === 'hybrid' && 'البيانات تُحفظ محلياً وتُرفع للسحابة'}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Auto Sync Settings */}
      <Card>
        <CardHeader>
          <CardTitle>إعدادات المزامنة التلقائية</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>المزامنة التلقائية</Label>
              <p className="text-sm text-muted-foreground">
                مزامنة البيانات تلقائياً عند الاتصال بالإنترنت
              </p>
            </div>
            <Switch
              checked={settings.autoSync}
              onCheckedChange={handleAutoSyncChange}
              disabled={settings.storageMode === 'local'}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>فترة المزامنة</Label>
              <p className="text-sm text-muted-foreground">
                كل كم دقيقة يتم مزامنة البيانات
              </p>
            </div>
            <Select
              value={String(settings.syncInterval)}
              onValueChange={handleSyncIntervalChange}
              disabled={!settings.autoSync || settings.storageMode === 'local'}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">كل دقيقة</SelectItem>
                <SelectItem value="5">كل 5 دقائق</SelectItem>
                <SelectItem value="10">كل 10 دقائق</SelectItem>
                <SelectItem value="30">كل 30 دقيقة</SelectItem>
                <SelectItem value="60">كل ساعة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle>إدارة البيانات</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-auto py-4"
              onClick={handleDownloadFromCloud}
              disabled={isDownloading || !isOnline}
            >
              <div className="flex flex-col items-center gap-2">
                {isDownloading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Download className="h-6 w-6" />
                )}
                <span>تحميل من السحابة</span>
                <span className="text-xs text-muted-foreground">
                  تحميل جميع البيانات إلى التخزين المحلي
                </span>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto py-4"
              onClick={handleManualSync}
              disabled={isSyncing || !isOnline || pendingSyncCount === 0}
            >
              <div className="flex flex-col items-center gap-2">
                {isSyncing ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Upload className="h-6 w-6" />
                )}
                <span>رفع للسحابة</span>
                <span className="text-xs text-muted-foreground">
                  رفع التغييرات المحلية للسحابة
                </span>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto py-4"
              onClick={handleExportLocalData}
              disabled={isExporting}
            >
              <div className="flex flex-col items-center gap-2">
                {isExporting ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <FileJson className="h-6 w-6" />
                )}
                <span>تصدير البيانات</span>
                <span className="text-xs text-muted-foreground">
                  تصدير البيانات المحلية كملف JSON
                </span>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StorageSettingsTab;
