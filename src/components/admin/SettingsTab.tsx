
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SettingsTab = () => {
  return (
    <Card className="border-2 border-black">
      <CardHeader className="bg-gradient-to-r from-gray-100 to-white border-b border-black">
        <CardTitle>إعدادات النظام</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>اسم المدرسة</Label>
              <Input defaultValue="مدرسة النجاح الثانوية" className="mt-1" />
            </div>
            
            <div>
              <Label>العام الدراسي</Label>
              <Input defaultValue="2023-2024" className="mt-1" />
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium mb-4">استيراد بيانات</h3>
            
            <div className="space-y-4">
              <div>
                <Label>استيراد بيانات المعلمين</Label>
                <Input type="file" accept=".xlsx, .xls" className="mt-1" />
              </div>
              
              <div>
                <Label>استيراد بيانات الطلاب</Label>
                <Input type="file" accept=".xlsx, .xls" className="mt-1" />
              </div>
              
              <div>
                <Label>استيراد بيانات المواد الدراسية</Label>
                <Input type="file" accept=".xlsx, .xls" className="mt-1" />
              </div>
            </div>
            
            <Button className="mt-4 bg-green-600 hover:bg-green-700">
              حفظ الإعدادات
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SettingsTab;
