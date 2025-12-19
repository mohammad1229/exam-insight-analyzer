import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, RefreshCw, Settings2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const [isSaving, setIsSaving] = useState(false);
  
  // Performance levels state
  const [excellentMin, setExcellentMin] = useState(85);
  const [goodMin, setGoodMin] = useState(75);
  const [averageMin, setAverageMin] = useState(65);
  const [lowMin, setLowMin] = useState(50);

  // Load saved levels on mount
  useEffect(() => {
    const levels = getPerformanceLevels();
    setExcellentMin(levels.excellent.min);
    setGoodMin(levels.good.min);
    setAverageMin(levels.average.min);
    setLowMin(levels.low.min);
  }, []);

  const handleSave = () => {
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

    localStorage.setItem("performanceLevels", JSON.stringify(levels));
    
    toast({
      title: "✓ تم حفظ المستويات",
      description: "تم تحديث معايير توزيع المستويات بنجاح - ستطبق على جميع التقارير والإحصائيات",
    });
    
    setIsSaving(false);
  };

  const handleReset = () => {
    setExcellentMin(85);
    setGoodMin(75);
    setAverageMin(65);
    setLowMin(50);
    localStorage.removeItem("performanceLevels");
    toast({
      title: "تم إعادة التعيين",
      description: "تم إعادة المستويات إلى القيم الافتراضية",
    });
  };

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
              <Save className="h-4 w-4 ml-2" />
              {isSaving ? "جاري الحفظ..." : "حفظ المستويات"}
            </Button>
            <Button 
              variant="outline"
              onClick={handleReset}
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
