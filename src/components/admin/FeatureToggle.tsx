import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Package, Star, Zap, Check, Clock } from "lucide-react";
import {
  SystemUpdate,
  getSystemUpdates,
  getEnabledFeatures,
  enableFeature,
  disableFeature,
} from "@/services/updateService";
import { getStoredLicense } from "@/services/licenseService";

const FeatureToggle = () => {
  const { toast } = useToast();
  const [updates, setUpdates] = useState<SystemUpdate[]>([]);
  const [enabledFeatures, setEnabledFeatures] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [schoolId, setSchoolId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    
    // Get school ID from stored license
    const license = getStoredLicense();
    if (license?.schoolId) {
      setSchoolId(license.schoolId);
      
      // Load all updates
      const allUpdates = await getSystemUpdates();
      setUpdates(allUpdates.filter(u => u.is_optional)); // Only show optional features
      
      // Load enabled features for this school
      const enabled = await getEnabledFeatures(license.schoolId);
      setEnabledFeatures(enabled);
    }
    
    setIsLoading(false);
  };

  const handleToggle = async (updateId: string, enabled: boolean) => {
    if (!schoolId) return;

    try {
      let success: boolean;
      if (enabled) {
        success = await enableFeature(schoolId, updateId);
      } else {
        success = await disableFeature(schoolId, updateId);
      }

      if (success) {
        setEnabledFeatures(prev =>
          enabled
            ? [...prev, updateId]
            : prev.filter(id => id !== updateId)
        );
        toast({
          title: enabled ? "تم التفعيل" : "تم التعطيل",
          description: enabled
            ? "تم تفعيل الميزة بنجاح"
            : "تم تعطيل الميزة",
        });
      } else {
        toast({
          title: "خطأ",
          description: "فشل في تحديث الميزة",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "feature":
        return <Star className="h-5 w-5 text-yellow-500" />;
      case "bugfix":
        return <Zap className="h-5 w-5 text-blue-500" />;
      case "enhancement":
        return <Package className="h-5 w-5 text-green-500" />;
      default:
        return <Package className="h-5 w-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!schoolId) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6 text-center">
          <p className="text-yellow-800">لم يتم العثور على معلومات المدرسة. يرجى تفعيل الترخيص أولاً.</p>
        </CardContent>
      </Card>
    );
  }

  if (updates.length === 0) {
    return (
      <Card className="border-gray-200">
        <CardContent className="pt-6 text-center">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">لا توجد ميزات اختيارية متاحة حالياً</p>
          <p className="text-sm text-muted-foreground mt-2">سيتم إضافة ميزات جديدة قريباً</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">الميزات الاختيارية</h3>
        <Badge variant="outline" className="text-sm">
          {enabledFeatures.length} من {updates.length} مفعلة
        </Badge>
      </div>

      <div className="grid gap-4">
        {updates.map((update) => {
          const isEnabled = enabledFeatures.includes(update.id);
          
          return (
            <Card
              key={update.id}
              className={`transition-all ${
                isEnabled
                  ? "border-green-300 bg-green-50/50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">{getTypeIcon(update.update_type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{update.title}</h4>
                        <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">
                          v{update.version}
                        </span>
                      </div>
                      {update.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {update.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {isEnabled && (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            <Check className="h-3 w-3 ml-1" />
                            مفعل
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(update.created_at).toLocaleDateString("ar-SA")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={(checked) => handleToggle(update.id, checked)}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default FeatureToggle;
