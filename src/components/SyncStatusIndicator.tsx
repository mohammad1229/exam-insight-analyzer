import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Wifi, 
  WifiOff, 
  Cloud, 
  HardDrive, 
  RefreshCw, 
  AlertCircle,
  CheckCircle,
  Loader2
} from "lucide-react";
import { getStorageStatus, syncPendingChanges } from "@/services/hybridStorageService";
import { toast } from "sonner";

const SyncStatusIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [storageMode, setStorageMode] = useState<string>('local');
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadStatus();
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Refresh status every 30 seconds
    const interval = setInterval(loadStatus, 30000);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const loadStatus = async () => {
    try {
      const status = await getStorageStatus();
      setPendingCount(status.pendingSyncCount);
      setLastSync(status.lastSyncTime);
      setStorageMode(status.mode);
    } catch (error) {
      console.error('Failed to load sync status:', error);
    }
  };

  const handleSync = async () => {
    if (!isOnline) {
      toast.error("لا يوجد اتصال بالإنترنت");
      return;
    }

    setIsSyncing(true);
    try {
      const result = await syncPendingChanges();
      toast.success(`تم مزامنة ${result.success} عنصر`);
      await loadStatus();
    } catch (error) {
      toast.error("فشل في المزامنة");
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusColor = () => {
    if (!isOnline) return "bg-destructive/10 text-destructive border-destructive/20";
    if (pendingCount > 0) return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
    return "bg-green-500/10 text-green-600 border-green-500/20";
  };

  const getModeIcon = () => {
    switch (storageMode) {
      case 'cloud': return <Cloud className="h-3 w-3" />;
      case 'hybrid': return <Cloud className="h-3 w-3" />;
      default: return <HardDrive className="h-3 w-3" />;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Badge 
          variant="outline" 
          className={`cursor-pointer gap-1.5 px-2 py-1 ${getStatusColor()}`}
        >
          {isOnline ? (
            <Wifi className="h-3 w-3" />
          ) : (
            <WifiOff className="h-3 w-3" />
          )}
          {getModeIcon()}
          {pendingCount > 0 && (
            <span className="text-xs font-medium">{pendingCount}</span>
          )}
        </Badge>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">حالة الاتصال</span>
            <div className="flex items-center gap-1.5">
              {isOnline ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600">متصل</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <span className="text-sm text-destructive">غير متصل</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">نوع التخزين</span>
            <span className="text-sm text-muted-foreground">
              {storageMode === 'local' && 'محلي'}
              {storageMode === 'cloud' && 'سحابي'}
              {storageMode === 'hybrid' && 'هجين'}
            </span>
          </div>

          {pendingCount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">بانتظار المزامنة</span>
              <Badge variant="secondary">{pendingCount}</Badge>
            </div>
          )}

          {lastSync && (
            <div className="text-xs text-muted-foreground">
              آخر مزامنة: {new Date(lastSync).toLocaleString('ar-SA')}
            </div>
          )}

          {(storageMode === 'hybrid' || storageMode === 'cloud') && (
            <Button 
              size="sm" 
              className="w-full" 
              onClick={handleSync}
              disabled={isSyncing || !isOnline || pendingCount === 0}
            >
              {isSyncing ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : (
                <RefreshCw className="h-4 w-4 ml-2" />
              )}
              مزامنة الآن
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SyncStatusIndicator;
