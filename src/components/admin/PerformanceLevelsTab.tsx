import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, RefreshCw, Settings2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  getPerformanceLevelsDB, 
  bulkSavePerformanceLevelsDB,
  DBPerformanceLevel 
} from "@/services/databaseService";

// Default performance levels
const DEFAULT_PERFORMANCE_LEVELS = {
  excellent: { min: 85, label: "ممتاز", color: "#22c55e" },
  good: { min: 75, max: 84, label: "جيد", color: "#3b82f6" },
  average: { min: 65, max: 74, label: "متوسط", color: "#f59e0b" },
  low: { min: 50, max: 64, label: "متدني", color: "#ef4444" },
  failed: { max: 49, label: "راسب", color: "#dc2626" }
};

export const getPerformanceLevels = () => {
  const saved = localStorage.getItem("performanceLevels");
  if (saved) {
    return JSON.parse(saved);
  }
  return DEFAULT_PERFORMANCE_LEVELS;
};

const PerformanceLevelsTab = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Performance levels state
  const [excellentMin, setExcellentMin] = useState(85);
  const [goodMin, setGoodMin] = useState(75);
  const [averageMin, setAverageMin] = useState(65);
  const [lowMin, setLowMin] = useState(50);

  // Load saved levels on mount
  useEffect(() => {
    loadLevels();
  }, []);

  const loadLevels = async () => {
    setIsLoading(true);
    try {
      const dbLevels = await getPerformanceLevelsDB();
      
      if (dbLevels && dbLevels.length > 0) {
        // Map from database format
        const excellent = dbLevels.find((l: DBPerformanceLevel) => l.name === "ممتاز");
        const good = dbLevels.find((l: DBPerformanceLevel) => l.name === "جيد");
        const average = dbLevels.find((l: DBPerformanceLevel) => l.name === "متوسط");
        const low = dbLevels.find((l: DBPerformanceLevel) => l.name === "متدني");

        if (excellent) setExcellentMin(excellent.min_score);
        if (good) setGoodMin(good.min_score);
        if (average) setAverageMin(average.min_score);
        if (low) setLowMin(low.min_score);
      } else {
        // Fall back to localStorage
        const levels = getPerformanceLevels();
        setExcellentMin(levels.excellent.min);
        setGoodMin(levels.good.min);
        setAverageMin(levels.average.min);
        setLowMin(levels.low.min);
      }
    } catch (error) {
      console.error("Error loading performance levels:", error);
      // Fall back to localStorage
      const levels = getPerformanceLevels();
      setExcellentMin(levels.excellent.min);
      setGoodMin(levels.good.min);
      setAverageMin(levels.average.min);
      setLowMin(levels.low.min);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    // Validate values
    if (excellentMin <= goodMin || goodMin <= averageMin || averageMin <= lowMin) {
      toast({
        title: "خطأ في القيم",
        description: "يجب أن تكون قيم المستويات تنازلية (ممتاز > جيد > متوسط > متدني)",
        variant: "destructive",
      });
      setIsSaving(false);
      return;
    }

    const levels = {
      excellent: { min: excellentMin, label: "ممتاز", color: "#22c55e" },
      good: { min: goodMin, max: excellentMin - 1, label: "جيد", color: "#3b82f6" },
      average: { min: averageMin, max: goodMin - 1, label: "متوسط", color: "#f59e0b" },
      low: { min: lowMin, max: averageMin - 1, label: "متدني", color: "#ef4444" },
      failed: { max: lowMin - 1, label: "راسب", color: "#dc2626" }
    };

    // Save to localStorage for backward compatibility
    localStorage.setItem("performanceLevels", JSON.stringify(levels));

    // Save to database
    try {
      const dbLevels = [
        { name: "ممتاز", min_score: excellentMin, max_score: 100, color: "#22c55e" },
        { name: "جيد", min_score: goodMin, max_score: excellentMin - 1, color: "#3b82f6" },
        { name: "متوسط", min_score: averageMin, max_score: goodMin - 1, color: "#f59e0b" },
        { name: "متدني", min_score: lowMin, max_score: averageMin - 1, color: "#ef4444" },
        { name: "راسب", min_score: 0, max_score: lowMin - 1, color: "#dc2626" },
      ];

      await bulkSavePerformanceLevelsDB(dbLevels);
      
      toast({
        title: "✓ تم حفظ المستويات",
        description: "تم تحديث معايير توزيع المستويات بنجاح - ستطبق على جميع التقارير والإحصائيات",
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في حفظ المستويات",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setExcellentMin(85);
    setGoodMin(75);
    setAverageMin(65);
    setLowMin(50);
    localStorage.removeItem("performanceLevels");

    // Also reset in database
    try {
      const defaultLevels = [
        { name: "ممتاز", min_score: 85, max_score: 100, color: "#22c55e" },
        { name: "جيد", min_score: 75, max_score: 84, color: "#3b82f6" },
        { name: "متوسط", min_score: 65, max_score: 74, color: "#f59e0b" },
        { name: "متدني", min_score: 50, max_score: 64, color: "#ef4444" },
        { name: "راسب", min_score: 0, max_score: 49, color: "#dc2626" },
      ];

      await bulkSavePerformanceLevelsDB(defaultLevels);
    } catch (error) {
      console.error("Error resetting levels in database:", error);
    }

    toast({
      title: "تم إعادة التعيين",
      description: "تم إعادة المستويات إلى القيم الافتراضية",
    });
  };

  if (isLoading) {
    return (
      <Card className="border-2 border-black">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="mr-2 text-muted-foreground">جاري تحميل المستويات...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-black">
      <CardHeader className="bg-gradient-to-r from-gray-100 to-white border-b border-black">
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="h-5 w-5" />
          إعدادات توزيع المستويات
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground mb-6">
          قم بتعديل حدود المستويات حسب احتياجاتك. هذه الإعدادات ستطبق على جميع التقارير والإحصائيات في النظام.
        </p>

        <div className="space-y-6">
          {/* Level Settings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Excellent */}
            <div className="p-4 rounded-lg" style={{ backgroundColor: "#22c55e20" }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "#22c55e" }} />
                <Label className="font-bold">ممتاز</Label>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">من</span>
                <Input 
                  type="number"
                  value={excellentMin}
                  onChange={(e) => setExcellentMin(Number(e.target.value))}
                  className="w-20"
                  min={1}
                  max={100}
                />
                <span className="text-sm">% فما فوق</span>
              </div>
            </div>

            {/* Good */}
            <div className="p-4 rounded-lg" style={{ backgroundColor: "#3b82f620" }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "#3b82f6" }} />
                <Label className="font-bold">جيد</Label>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">من</span>
                <Input 
                  type="number"
                  value={goodMin}
                  onChange={(e) => setGoodMin(Number(e.target.value))}
                  className="w-20"
                  min={1}
                  max={100}
                />
                <span className="text-sm">% إلى {excellentMin - 1}%</span>
              </div>
            </div>

            {/* Average */}
            <div className="p-4 rounded-lg" style={{ backgroundColor: "#f59e0b20" }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "#f59e0b" }} />
                <Label className="font-bold">متوسط</Label>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">من</span>
                <Input 
                  type="number"
                  value={averageMin}
                  onChange={(e) => setAverageMin(Number(e.target.value))}
                  className="w-20"
                  min={1}
                  max={100}
                />
                <span className="text-sm">% إلى {goodMin - 1}%</span>
              </div>
            </div>

            {/* Low */}
            <div className="p-4 rounded-lg" style={{ backgroundColor: "#ef444420" }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "#ef4444" }} />
                <Label className="font-bold">متدني</Label>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">من</span>
                <Input 
                  type="number"
                  value={lowMin}
                  onChange={(e) => setLowMin(Number(e.target.value))}
                  className="w-20"
                  min={1}
                  max={100}
                />
                <span className="text-sm">% إلى {averageMin - 1}%</span>
              </div>
            </div>
          </div>

          {/* Failed Level Display */}
          <div className="p-4 rounded-lg max-w-xs" style={{ backgroundColor: "#dc262620" }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "#dc2626" }} />
              <Label className="font-bold">راسب</Label>
            </div>
            <p className="text-sm">أقل من {lowMin}%</p>
          </div>

          {/* Preview Table */}
          <div className="border rounded-lg overflow-hidden mt-6">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-right">المستوى</th>
                  <th className="p-3 text-right">النطاق</th>
                  <th className="p-3 text-right">اللون</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="p-3 font-medium">ممتاز</td>
                  <td className="p-3">{excellentMin}% فما فوق</td>
                  <td className="p-3"><div className="w-6 h-6 rounded" style={{ backgroundColor: "#22c55e" }} /></td>
                </tr>
                <tr className="border-t">
                  <td className="p-3 font-medium">جيد</td>
                  <td className="p-3">{goodMin}% - {excellentMin - 1}%</td>
                  <td className="p-3"><div className="w-6 h-6 rounded" style={{ backgroundColor: "#3b82f6" }} /></td>
                </tr>
                <tr className="border-t">
                  <td className="p-3 font-medium">متوسط</td>
                  <td className="p-3">{averageMin}% - {goodMin - 1}%</td>
                  <td className="p-3"><div className="w-6 h-6 rounded" style={{ backgroundColor: "#f59e0b" }} /></td>
                </tr>
                <tr className="border-t">
                  <td className="p-3 font-medium">متدني</td>
                  <td className="p-3">{lowMin}% - {averageMin - 1}%</td>
                  <td className="p-3"><div className="w-6 h-6 rounded" style={{ backgroundColor: "#ef4444" }} /></td>
                </tr>
                <tr className="border-t">
                  <td className="p-3 font-medium">راسب</td>
                  <td className="p-3">أقل من {lowMin}%</td>
                  <td className="p-3"><div className="w-6 h-6 rounded" style={{ backgroundColor: "#dc2626" }} /></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 border-t">
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white px-8"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <Save className="h-4 w-4 ml-2" />}
              {isSaving ? "جاري الحفظ..." : "حفظ المستويات"}
            </Button>
            <Button 
              variant="outline"
              onClick={handleReset}
              disabled={isSaving}
            >
              <RefreshCw className="h-4 w-4 ml-2" />
              إعادة تعيين
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceLevelsTab;
