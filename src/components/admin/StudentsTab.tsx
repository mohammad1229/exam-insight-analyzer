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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Edit, Upload, Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { 
  getClassesDB, 
  getStudentsDB, 
  addStudentDB, 
  updateStudentDB, 
  deleteStudentDB,
  bulkAddStudentsDB,
  DBClass,
  DBStudent 
} from "@/services/databaseService";
import * as XLSX from "xlsx";

const StudentsTab = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [students, setStudents] = useState<DBStudent[]>([]);
  const [classes, setClasses] = useState<DBClass[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<DBStudent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [newStudentName, setNewStudentName] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  
  // Filter states
  const [filterClassId, setFilterClassId] = useState("");
  const [filterSectionId, setFilterSectionId] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [classesData, studentsData] = await Promise.all([
        getClassesDB(),
        getStudentsDB()
      ]);
      setClasses(classesData);
      setStudents(studentsData);
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل البيانات",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSectionsForClass = (classId: string) => {
    const cls = classes.find(c => c.id === classId);
    return cls?.sections || [];
  };

  const filteredStudents = students.filter(s => {
    if (filterClassId && filterClassId !== "all" && s.class_id !== filterClassId) return false;
    if (filterSectionId && filterSectionId !== "all" && s.section_id !== filterSectionId) return false;
    return true;
  });

  const handleAddStudent = async () => {
    if (!newStudentName.trim() || !selectedClassId || !selectedSectionId) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const newStudent = await addStudentDB({
        name: newStudentName.trim(),
        class_id: selectedClassId,
        section_id: selectedSectionId,
      });

      setStudents([...students, newStudent]);

      toast({
        title: "تمت الإضافة",
        description: `تم إضافة ${newStudentName} بنجاح`,
      });

      resetForm();
      setShowAddModal(false);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إضافة الطالب",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditStudent = async () => {
    if (!editingStudent || !newStudentName.trim() || !selectedClassId || !selectedSectionId) return;

    setIsSaving(true);
    try {
      await updateStudentDB(editingStudent.id, {
        name: newStudentName.trim(),
        class_id: selectedClassId,
        section_id: selectedSectionId,
      });

      setStudents(students.map(s =>
        s.id === editingStudent.id
          ? { ...s, name: newStudentName.trim(), class_id: selectedClassId, section_id: selectedSectionId }
          : s
      ));

      toast({
        title: "تم التحديث",
        description: `تم تحديث بيانات ${newStudentName} بنجاح`,
      });

      setEditingStudent(null);
      resetForm();
      setShowEditModal(false);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث الطالب",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    const studentToDelete = students.find(s => s.id === studentId);
    
    try {
      await deleteStudentDB(studentId);
      setStudents(students.filter(s => s.id !== studentId));

      toast({
        title: "تم الحذف",
        description: `تم حذف ${studentToDelete?.name || "الطالب"} بنجاح`,
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في حذف الطالب",
        variant: "destructive",
      });
    }
  };

  const openEditModal = (student: DBStudent) => {
    setEditingStudent(student);
    setNewStudentName(student.name);
    setSelectedClassId(student.class_id);
    setTimeout(() => setSelectedSectionId(student.section_id), 100);
    setShowEditModal(true);
  };

  const resetForm = () => {
    setNewStudentName("");
    setSelectedClassId("");
    setSelectedSectionId("");
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

      const newStudentsData: { name: string; class_id: string; section_id: string }[] = [];
      let skippedCount = 0;

      jsonData.forEach((row) => {
        const name = row["اسم الطالب"] || row["الاسم"] || row["name"];
        const className = row["الصف"] || row["class"];
        const sectionName = row["الشعبة"] || row["section"];

        if (!name) {
          skippedCount++;
          return;
        }

        // Find class by name
        const cls = classes.find(c => c.name === className || c.name.includes(className));
        if (!cls) {
          skippedCount++;
          return;
        }

        // Find section by name
        const section = cls.sections?.find(s => s.name === sectionName || s.name.includes(sectionName));
        if (!section) {
          skippedCount++;
          return;
        }

        // Check if student already exists
        const exists = students.some(s => 
          s.name === name && s.class_id === cls.id && s.section_id === section.id
        );

        if (!exists) {
          newStudentsData.push({
            name: name.trim(),
            class_id: cls.id,
            section_id: section.id,
          });
        }
      });

      if (newStudentsData.length > 0) {
        const addedStudents = await bulkAddStudentsDB(newStudentsData);
        setStudents([...students, ...addedStudents]);

        toast({
          title: "تم الاستيراد",
          description: `تم إضافة ${addedStudents.length} طالب بنجاح${skippedCount > 0 ? ` (تم تخطي ${skippedCount} سجل)` : ""}`,
        });
      } else {
        toast({
          title: "تنبيه",
          description: "لم يتم العثور على بيانات جديدة للاستيراد",
          variant: "destructive",
        });
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
      { "اسم الطالب": "محمد أحمد", "الصف": "الصف الأول", "الشعبة": "أ" },
      { "اسم الطالب": "فاطمة علي", "الصف": "الصف الأول", "الشعبة": "ب" },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "الطلاب");
    XLSX.writeFile(wb, "قالب_الطلاب.xlsx");

    toast({
      title: "تم التحميل",
      description: "تم تحميل قالب ملف الطلاب",
    });
  };

  // Export students
  const exportStudents = () => {
    const exportData = filteredStudents.map(student => {
      const cls = classes.find(c => c.id === student.class_id);
      const section = cls?.sections?.find(s => s.id === student.section_id);
      return {
        "اسم الطالب": student.name,
        "الصف": cls?.name || "",
        "الشعبة": section?.name || "",
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "الطلاب");
    XLSX.writeFile(wb, `الطلاب_${new Date().toLocaleDateString("ar")}.xlsx`);

    toast({
      title: "تم التصدير",
      description: `تم تصدير ${filteredStudents.length} طالب`,
    });
  };

  const getClassName = (classId: string) => {
    return classes.find(c => c.id === classId)?.name || "-";
  };

  const getSectionName = (classId: string, sectionId: string) => {
    const cls = classes.find(c => c.id === classId);
    return cls?.sections?.find(s => s.id === sectionId)?.name || "-";
  };

  if (isLoading) {
    return (
      <Card className="border-2 border-black">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="mr-2 text-muted-foreground">جاري تحميل الطلاب...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-black">
      <CardHeader className="bg-gradient-to-r from-gray-100 to-white border-b border-black">
        <CardTitle className="flex justify-between items-center flex-wrap gap-2">
          <span>إدارة الطلاب</span>
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
              onClick={exportStudents}
              className="border-orange-500 text-orange-600 hover:bg-orange-50"
            >
              <FileSpreadsheet className="ml-2 h-4 w-4" /> تصدير
            </Button>
            <Button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="ml-2 h-4 w-4" /> إضافة طالب
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <Label>تصفية حسب الصف</Label>
            <Select value={filterClassId} onValueChange={(val) => { setFilterClassId(val); setFilterSectionId(""); }}>
              <SelectTrigger>
                <SelectValue placeholder="جميع الصفوف" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الصفوف</SelectItem>
                {classes.map(cls => (
                  <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label>تصفية حسب الشعبة</Label>
            <Select value={filterSectionId} onValueChange={setFilterSectionId} disabled={!filterClassId || filterClassId === "all"}>
              <SelectTrigger>
                <SelectValue placeholder="جميع الشعب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الشعب</SelectItem>
                {getSectionsForClass(filterClassId).map(section => (
                  <SelectItem key={section.id} value={section.id}>{section.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <p className="text-sm text-muted-foreground">
              عدد الطلاب: <span className="font-bold">{filteredStudents.length}</span>
            </p>
          </div>
        </div>

        <Table>
          <TableHeader className="bg-black">
            <TableRow>
              <TableHead className="text-white">م</TableHead>
              <TableHead className="text-white">اسم الطالب</TableHead>
              <TableHead className="text-white">الصف</TableHead>
              <TableHead className="text-white">الشعبة</TableHead>
              <TableHead className="text-white">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student, index) => (
                <TableRow key={student.id} className="hover:bg-green-50">
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>{getClassName(student.class_id)}</TableCell>
                  <TableCell>{getSectionName(student.class_id, student.section_id)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(student)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500 hover:bg-red-50"
                        onClick={() => handleDeleteStudent(student.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6">
                  لا يوجد طلاب مضافين
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
            <DialogTitle>إضافة طالب جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>اسم الطالب</Label>
              <Input
                value={newStudentName}
                onChange={e => setNewStudentName(e.target.value)}
                placeholder="أدخل اسم الطالب"
              />
            </div>
            <div>
              <Label>الصف</Label>
              <Select value={selectedClassId} onValueChange={(val) => { setSelectedClassId(val); setSelectedSectionId(""); }}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الصف" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>الشعبة</Label>
              <Select value={selectedSectionId} onValueChange={setSelectedSectionId} disabled={!selectedClassId}>
                <SelectTrigger>
                  <SelectValue placeholder={selectedClassId ? "اختر الشعبة" : "اختر الصف أولاً"} />
                </SelectTrigger>
                <SelectContent>
                  {getSectionsForClass(selectedClassId).map(section => (
                    <SelectItem key={section.id} value={section.id}>{section.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)} disabled={isSaving}>
              إلغاء
            </Button>
            <Button onClick={handleAddStudent} className="bg-green-600 hover:bg-green-700" disabled={isSaving}>
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
            <DialogTitle>تعديل بيانات الطالب</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>اسم الطالب</Label>
              <Input
                value={newStudentName}
                onChange={e => setNewStudentName(e.target.value)}
              />
            </div>
            <div>
              <Label>الصف</Label>
              <Select value={selectedClassId} onValueChange={(val) => { setSelectedClassId(val); setSelectedSectionId(""); }}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الصف" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>الشعبة</Label>
              <Select value={selectedSectionId} onValueChange={setSelectedSectionId} disabled={!selectedClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الشعبة" />
                </SelectTrigger>
                <SelectContent>
                  {getSectionsForClass(selectedClassId).map(section => (
                    <SelectItem key={section.id} value={section.id}>{section.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)} disabled={isSaving}>
              إلغاء
            </Button>
            <Button onClick={handleEditStudent} className="bg-green-600 hover:bg-green-700" disabled={isSaving}>
              {isSaving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default StudentsTab;
