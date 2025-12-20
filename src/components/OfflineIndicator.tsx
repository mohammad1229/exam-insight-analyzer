import React, { useState, useEffect } from "react";
import { Wifi, WifiOff, RefreshCw, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  isOnline, 
  getPendingOperations, 
  syncPendingOperations, 
  setupAutoSync,
  getSyncStatus 
} from "@/services/offlineSyncService";

const OfflineIndicator: React.FC = () => {
  const [online, setOnline] = useState(isOnline());
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<{ synced: number; failed: number } | null>(null);

  useEffect(() => {
    // Update pending count
    const updatePendingCount = () => {
      const ops = getPendingOperations();
      setPendingCount(ops.length);
    };

    // Handle online/offline events
    const handleOnline = () => {
      setOnline(true);
      toast.success("تم استعادة الاتصال بالإنترنت");
    };

    const handleOffline = () => {
      setOnline(false);
      toast.warning("أنت الآن في وضع عدم الاتصال");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Setup auto sync
    const cleanupAutoSync = setupAutoSync((result) => {
      setLastSyncResult(result);
      updatePendingCount();
      if (result.synced > 0) {
        toast.success(`تم مزامنة ${result.synced} عملية بنجاح`);
      }
      if (result.failed > 0) {
        toast.error(`فشلت ${result.failed} عملية في المزامنة`);
      }
    });

    // Initial update
    updatePendingCount();

    // Periodic check for pending operations
    const interval = setInterval(updatePendingCount, 5000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      cleanupAutoSync();
      clearInterval(interval);
    };
  }, []);

  const handleManualSync = async () => {
    if (!online) {
      toast.error("لا يمكن المزامنة - أنت غير متصل بالإنترنت");
      return;
    }

    setSyncing(true);
    try {
      const result = await syncPendingOperations();
      setLastSyncResult(result);
      const ops = getPendingOperations();
      setPendingCount(ops.length);

      if (result.synced > 0 || result.failed === 0) {
        toast.success("تمت المزامنة بنجاح");
      } else {
        toast.error("فشلت بعض العمليات في المزامنة");
      }
    } catch (e) {
      console.error("Sync error:", e);
      toast.error("حدث خطأ أثناء المزامنة");
    } finally {
      setSyncing(false);
    }
  };

  // Don't show if online and no pending operations
  if (online && pendingCount === 0) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 left-4 z-50 flex items-center gap-2 p-3 rounded-lg shadow-lg ${
      online ? "bg-yellow-50 border border-yellow-200" : "bg-red-50 border border-red-200"
    }`}>
      {online ? (
        <Wifi className="h-5 w-5 text-green-600" />
      ) : (
        <WifiOff className="h-5 w-5 text-red-600" />
      )}
      
      <div className="flex flex-col">
        <span className={`text-sm font-medium ${online ? "text-yellow-800" : "text-red-800"}`}>
          {online ? "متصل" : "غير متصل"}
        </span>
        {pendingCount > 0 && (
          <span className="text-xs text-muted-foreground">
            {pendingCount} عملية في الانتظار
          </span>
        )}
      </div>

      {pendingCount > 0 && (
        <Badge variant="secondary" className="ml-2">
          {pendingCount}
        </Badge>
      )}

      {online && pendingCount > 0 && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleManualSync}
          disabled={syncing}
          className="ml-2"
        >
          {syncing ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span className="mr-1 text-xs">مزامنة</span>
        </Button>
      )}
    </div>
  );
};

export default OfflineIndicator;
