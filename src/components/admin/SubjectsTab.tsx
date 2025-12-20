import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Trash2, Edit, Upload, Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { 
  getSubjectsDB, 
  addSubjectDB, 
  updateSubjectDB, 
  deleteSubjectDB,
  DBSubject 
} from "@/services/databaseService";
import * as XLSX from "xlsx";

const SubjectsTab = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [subjects, setSubjects] = useState<DBSubject[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<DBSubject | null>(null);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    setIsLoading(true);
    try {
      const data = await getSubjectsDB();
      setSubjects(data);
    } catch (error: any) {
      console.error("Error loading subjects:", error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل المواد",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم المادة",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const newSubject = await addSubjectDB(newSubjectName.trim());
      setSubjects([...subjects, newSubject]);

      toast({
        title: "تمت الإضافة",
        description: `تم إضافة ${newSubjectName} بنجاح`,
      });

      setNewSubjectName("");
      setShowAddModal(false);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إضافة المادة",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditSubject = async () => {
    if (!editingSubject || !newSubjectName.trim()) return;

    setIsSaving(true);
    try {
      await updateSubjectDB(editingSubject.id, newSubjectName.trim());
      
      setSubjects(subjects.map(s =>
        s.id === editingSubject.id ? { ...s, name: newSubjectName.trim() } : s
      ));

      toast({
        title: "تم التحديث",
        description: `تم تحديث ${newSubjectName} بنجاح`,
      });

      setEditingSubject(null);
      setNewSubjectName("");
      setShowEditModal(false);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث المادة",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    const subjectToDelete = subjects.find(s => s.id === subjectId);
    
    try {
      await deleteSubjectDB(subjectId);
      setSubjects(subjects.filter(s => s.id !== subjectId));

      toast({
        title: "تم الحذف",
        description: `تم حذف ${subjectToDelete?.name || "المادة"} بنجاح`,
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في حذف المادة",
        variant: "destructive",
      });
    }
  };

  const openEditModal = (subject: DBSubject) => {
    setEditingSubject(subject);
    setNewSubjectName(subject.name);
    setShowEditModal(true);
  };

  // Excel upload handler
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      if (jsonData.length === 0) {
        toast({
          title: "خطأ",
          description: "الملف فارغ أو غير صالح",
          variant: "destructive",
        });
        return;
      }

      let addedCount = 0;
      const newSubjects: DBSubject[] = [];

      for (const row of jsonData) {
        const subjectName = row["اسم المادة"] || row["المادة"] || row["name"];

        if (!subjectName) continue;

        // Check if subject already exists
        const exists = subjects.some(s => s.name === subjectName);
        if (exists) continue;

        try {
          const newSubject = await addSubjectDB(subjectName.trim());
          newSubjects.push(newSubject);
          addedCount++;
        } catch (error) {
          console.error("Error adding subject:", subjectName, error);
        }
      }

      if (addedCount > 0) {
        setSubjects([...subjects, ...newSubjects]);
        toast({
          title: "تم الاستيراد",
          description: `تم إضافة ${addedCount} مادة بنجاح`,
        });
      } else {
        toast({
          title: "تنبيه",
          description: "لم يتم العثور على بيانات جديدة للاستيراد",
        });
      }

      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Error importing file:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء قراءة الملف",
        variant: "destructive",
      });
    }
  };

  // Download template
  const downloadTemplate = () => {
    const templateData = [
      { "اسم المادة": "الرياضيات" },
      { "اسم المادة": "اللغة العربية" },
      { "اسم المادة": "العلوم" },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "المواد");
    XLSX.writeFile(wb, "قالب_المواد.xlsx");

    toast({
      title: "تم التحميل",
      description: "تم تحميل قالب ملف المواد",
    });
  };

  // Export subjects
  const exportSubjects = () => {
    const exportData = subjects.map(subject => ({
      "اسم المادة": subject.name,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "المواد");
    XLSX.writeFile(wb, `المواد_${new Date().toLocaleDateString("ar")}.xlsx`);

    toast({
      title: "تم التصدير",
      description: `تم تصدير ${subjects.length} مادة`,
    });
  };

  if (isLoading) {
    return (
      <Card className="border-2 border-black">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="mr-2 text-muted-foreground">جاري تحميل المواد...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-black">
      <CardHeader className="bg-gradient-to-r from-red-100 to-white border-b border-black">
        <CardTitle className="flex justify-between items-center flex-wrap gap-2">
          <span>إدارة المواد الدراسية</span>
          <div className="flex gap-2 flex-wrap">
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="border-blue-500 text-blue-600 hover:bg-blue-50"
            >
              <Download className="ml-2 h-4 w-4" /> تحميل القالب
            </Button>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="border-purple-500 text-purple-600 hover:bg-purple-50"
            >
              <Upload className="ml-2 h-4 w-4" /> رفع من Excel
            </Button>
            <Button
              variant="outline"
              onClick={exportSubjects}
              className="border-orange-500 text-orange-600 hover:bg-orange-50"
            >
              <FileSpreadsheet className="ml-2 h-4 w-4" /> تصدير
            </Button>
            <Button
              onClick={() => {
                setNewSubjectName("");
                setShowAddModal(true);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              <Plus className="ml-2 h-4 w-4" /> إضافة مادة
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <Table>
          <TableHeader className="bg-black">
            <TableRow>
              <TableHead className="text-white">م</TableHead>
              <TableHead className="text-white">اسم المادة</TableHead>
              <TableHead className="text-white">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subjects.length > 0 ? (
              subjects.map((subject, index) => (
                <TableRow key={subject.id} className="hover:bg-red-50">
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">{subject.name}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(subject)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500 hover:bg-red-50"
                        onClick={() => handleDeleteSubject(subject.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-6">
                  لا توجد مواد مضافة
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      {/* Add Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="dir-rtl">
          <DialogHeader>
            <DialogTitle>إضافة مادة جديدة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>اسم المادة</Label>
              <Input
                value={newSubjectName}
                onChange={e => setNewSubjectName(e.target.value)}
                placeholder="مثال: التربية الإسلامية"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)} disabled={isSaving}>
              إلغاء
            </Button>
            <Button onClick={handleAddSubject} className="bg-red-600 hover:bg-red-700" disabled={isSaving}>
              {isSaving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              إضافة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="dir-rtl">
          <DialogHeader>
            <DialogTitle>تعديل المادة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>اسم المادة</Label>
              <Input
                value={newSubjectName}
                onChange={e => setNewSubjectName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)} disabled={isSaving}>
              إلغاء
            </Button>
            <Button onClick={handleEditSubject} className="bg-red-600 hover:bg-red-700" disabled={isSaving}>
              {isSaving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default SubjectsTab;
