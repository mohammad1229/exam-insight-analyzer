
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';

const SettingsTab = () => {
  const { toast } = useToast();
  const [schoolName, setSchoolName] = useState("مدرسة النجاح الثانوية");
  const [academicYear, setAcademicYear] = useState("2023-2024");

  // Function to handle file uploads for teachers
  const handleTeacherImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Process teacher data
        const teachersData = jsonData.map((row: any, index) => ({
          id: `teacher_${index + 1}`,
          name: row.name || `معلم ${index + 1}`,
          subjects: row.subjects ? row.subjects.split(',').map((s: string) => s.trim()) : [],
          username: row.username || row.name?.split(' ')?.[0]?.toLowerCase() || `teacher${index + 1}`,
          password: row.password || "12345",
          assignedClasses: row.classes ? row.classes.split(',').map((c: string) => c.trim()) : [],
          assignedSubjects: row.subjects ? row.subjects.split(',').map((s: string) => s.trim()) : [],
        }));
        
        // Save teacher data to localStorage
        localStorage.setItem("teachersWithCredentials", JSON.stringify(teachersData));
        
        toast({
          title: "تم استيراد بيانات المعلمين",
          description: `تم استيراد ${teachersData.length} معلم بنجاح`,
        });
      } catch (error) {
        toast({
          title: "خطأ في استيراد البيانات",
          description: "يرجى التأكد من تنسيق الملف",
          variant: "destructive",
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Function to handle file uploads for students
  const handleStudentImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        toast({
          title: "تم استيراد بيانات الطلاب",
          description: `تم استيراد ${jsonData.length} طالب بنجاح`,
        });
      } catch (error) {
        toast({
          title: "خطأ في استيراد البيانات",
          description: "يرجى التأكد من تنسيق الملف",
          variant: "destructive",
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Function to handle file uploads for subjects
  const handleSubjectImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        toast({
          title: "تم استيراد بيانات المواد الدراسية",
          description: `تم استيراد ${jsonData.length} مادة دراسية بنجاح`,
        });
      } catch (error) {
        toast({
          title: "خطأ في استيراد البيانات",
          description: "يرجى التأكد من تنسيق الملف",
          variant: "destructive",
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Function to download template for teachers
  const downloadTeacherTemplate = () => {
    const template = [
      { name: "أحمد محمد", subjects: "رياضيات,علوم", classes: "الصف التاسع,الصف العاشر", username: "ahmed", password: "12345" },
      { name: "سارة خالد", subjects: "لغة عربية,تربية إسلامية", classes: "الصف السابع,الصف الثامن", username: "sara", password: "12345" }
    ];
    
    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Teachers");
    XLSX.writeFile(workbook, "teachers_template.xlsx");
    
    toast({
      title: "تم تنزيل القالب",
      description: "تم تنزيل قالب بيانات المعلمين بنجاح",
    });
  };

  const handleSaveSettings = () => {
    localStorage.setItem("schoolSettings", JSON.stringify({
      name: schoolName,
      academicYear: academicYear
    }));
    
    toast({
      title: "تم حفظ الإعدادات",
      description: "تم تحديث إعدادات النظام بنجاح",
    });
  };

  return (
    <Card className="border-2 border-black">
      <CardHeader className="bg-gradient-to-r from-black to-green-600 text-white border-b border-black">
        <CardTitle>إعدادات النظام</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>اسم المدرسة</Label>
              <Input 
                value={schoolName} 
                onChange={(e) => setSchoolName(e.target.value)} 
                className="mt-1" 
              />
            </div>
            
            <div>
              <Label>العام الدراسي</Label>
              <Input 
                value={academicYear} 
                onChange={(e) => setAcademicYear(e.target.value)}
                className="mt-1" 
              />
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium mb-4">استيراد/تصدير البيانات</h3>
            
            <div className="space-y-4">
              <div>
                <Label>استيراد بيانات المعلمين</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input 
                    type="file" 
                    accept=".xlsx, .xls" 
                    className="flex-1"
                    onChange={handleTeacherImport}
                  />
                  <Button 
                    className="bg-black text-white hover:bg-gray-800"
                    onClick={downloadTeacherTemplate}
                  >
                    <Download className="h-4 w-4 ml-2" />
                    تنزيل القالب
                  </Button>
                </div>
              </div>
              
              <div>
                <Label>استيراد بيانات الطلاب</Label>
                <Input 
                  type="file" 
                  accept=".xlsx, .xls" 
                  className="mt-1"
                  onChange={handleStudentImport}
                />
              </div>
              
              <div>
                <Label>استيراد بيانات المواد الدراسية</Label>
                <Input 
                  type="file" 
                  accept=".xlsx, .xls" 
                  className="mt-1"
                  onChange={handleSubjectImport}
                />
              </div>
            </div>
            
            <Button 
              className="mt-4 bg-[#ea384c] hover:bg-red-700 text-white"
              onClick={handleSaveSettings}
            >
              حفظ الإعدادات
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SettingsTab;
