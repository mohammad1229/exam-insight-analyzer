import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileJson, CheckCircle, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface ImportSchoolDataProps {
  schoolId: string;
  schoolName: string;
  onImportComplete?: () => void;
}

const ImportSchoolData = ({ schoolId, schoolName, onImportComplete }: ImportSchoolDataProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [importData, setImportData] = useState<any>(null);
  const [importing, setImporting] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        // Validate backup structure
        if (!data.version || !data.exportDate) {
          toast({
            title: "ملف غير صالح",
            description: "الملف ليس نسخة احتياطية صالحة",
            variant: "destructive",
          });
          return;
        }

        setImportData(data);
        setShowPreview(true);
      } catch (error) {
        toast({
          title: "خطأ في قراءة الملف",
          description: "تأكد من أن الملف بصيغة JSON صحيحة",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const performImport = async () => {
    if (!importData || !schoolId) return;

    setImporting(true);
    try {
      // Import each data type with school ID prefix
      const dataTypes = ["students", "classes", "subjects", "teachers", "tests", "performanceLevels"];
      
      dataTypes.forEach((type) => {
        if (importData[type]) {
          const storageKey = `${schoolId}_${type}`;
          localStorage.setItem(storageKey, JSON.stringify(importData[type]));
        }
      });

      // Update school info
      if (importData.school) {
        const schoolData = {
          ...importData.school,
          id: schoolId,
          name: schoolName
        };
        localStorage.setItem(`${schoolId}_school`, JSON.stringify(schoolData));
      }

      toast({
        title: "تم الاستيراد بنجاح",
        description: `تم استيراد البيانات إلى ${schoolName}`,
      });

      setShowPreview(false);
      setImportData(null);
      onImportComplete?.();
    } catch (error: any) {
      toast({
        title: "خطأ في الاستيراد",
        description: error.message || "حدث خطأ أثناء استيراد البيانات",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const getDataSummary = () => {
    if (!importData) return [];
    
    return [
      { label: "الطلاب", count: importData.students?.length || 0 },
      { label: "الصفوف", count: importData.classes?.length || 0 },
      { label: "المواد", count: importData.subjects?.length || 0 },
      { label: "المعلمين", count: importData.teachers?.length || 0 },
      { label: "الاختبارات", count: importData.tests?.length || 0 },
    ];
  };

  return (
    <>
      <Card className="border-2 border-cyan-500">
        <CardHeader className="bg-gradient-to-r from-cyan-100 to-white border-b border-cyan-500">
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            استيراد بيانات من نسخة احتياطية
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
              <FileJson className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600 mb-4">
                اختر ملف نسخة احتياطية (.json) لاستيراد البيانات إلى المدرسة الجديدة
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                <Upload className="h-4 w-4 ml-2" />
                اختيار ملف
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              يمكنك الحصول على ملف النسخة الاحتياطية من قسم النسخ الاحتياطي في لوحة التحكم
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="sm:max-w-[500px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileJson className="h-5 w-5 text-cyan-600" />
              معاينة البيانات للاستيراد
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {importData && (
              <>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm">
                    <strong>المصدر:</strong> {importData.schoolName || "غير معروف"}
                  </p>
                  <p className="text-sm">
                    <strong>تاريخ النسخة:</strong> {new Date(importData.exportDate).toLocaleDateString("ar-SA")}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="font-semibold">البيانات التي سيتم استيرادها:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {getDataSummary().map((item) => (
                      <div key={item.label} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        {item.count > 0 ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="text-sm">{item.label}: <strong>{item.count}</strong></span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    <strong>تنبيه:</strong> سيتم استبدال أي بيانات موجودة حالياً في المدرسة.
                  </p>
                </div>
              </>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              إلغاء
            </Button>
            <Button 
              onClick={performImport} 
              className="bg-cyan-600 hover:bg-cyan-700"
              disabled={importing}
            >
              {importing ? "جاري الاستيراد..." : "استيراد البيانات"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImportSchoolData;
