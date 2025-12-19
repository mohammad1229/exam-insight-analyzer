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
import { Plus, Trash2, Edit, Upload, Download, FileSpreadsheet } from "lucide-react";
import { Student, Class, Section } from "@/types";
import { getStudents, saveStudents, getClasses, getClassById, getSectionById } from "@/services/dataService";
import * as XLSX from "xlsx";

const StudentsTab = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  
  const [newStudentName, setNewStudentName] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [sections, setSections] = useState<Section[]>([]);
  
  // Filter states
  const [filterClassId, setFilterClassId] = useState("");
  const [filterSectionId, setFilterSectionId] = useState("");
  const [filterSections, setFilterSections] = useState<Section[]>([]);

  useEffect(() => {
    setStudents(getStudents());
    setClasses(getClasses());
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      const cls = getClassById(selectedClassId);
      setSections(cls?.sections || []);
      setSelectedSectionId("");
    } else {
      setSections([]);
    }
  }, [selectedClassId]);

  useEffect(() => {
    if (filterClassId) {
      const cls = getClassById(filterClassId);
      setFilterSections(cls?.sections || []);
    } else {
      setFilterSections([]);
      setFilterSectionId("");
    }
  }, [filterClassId]);

  const filteredStudents = students.filter(s => {
    if (filterClassId && filterClassId !== "all" && s.classId !== filterClassId) return false;
    if (filterSectionId && filterSectionId !== "all" && s.sectionId !== filterSectionId) return false;
    return true;
  });

  const handleAddStudent = () => {
    if (!newStudentName.trim() || !selectedClassId || !selectedSectionId) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    const newStudent: Student = {
      id: `st${Date.now()}`,
      name: newStudentName.trim(),
      classId: selectedClassId,
      sectionId: selectedSectionId,
    };

    const updatedStudents = [...students, newStudent];
    setStudents(updatedStudents);
    saveStudents(updatedStudents);

    toast({
      title: "تمت الإضافة",
      description: `تم إضافة ${newStudentName} بنجاح`,
    });

    resetForm();
    setShowAddModal(false);
  };

  const handleEditStudent = () => {
    if (!editingStudent || !newStudentName.trim() || !selectedClassId || !selectedSectionId) return;

    const updatedStudents = students.map(s =>
      s.id === editingStudent.id
        ? { ...s, name: newStudentName.trim(), classId: selectedClassId, sectionId: selectedSectionId }
        : s
    );

    setStudents(updatedStudents);
    saveStudents(updatedStudents);

    toast({
      title: "تم التحديث",
      description: `تم تحديث بيانات ${newStudentName} بنجاح`,
    });

    setEditingStudent(null);
    resetForm();
    setShowEditModal(false);
  };

  const handleDeleteStudent = (studentId: string) => {
    const studentToDelete = students.find(s => s.id === studentId);
    const updatedStudents = students.filter(s => s.id !== studentId);
    setStudents(updatedStudents);
    saveStudents(updatedStudents);

    toast({
      title: "تم الحذف",
      description: `تم حذف ${studentToDelete?.name || "الطالب"} بنجاح`,
    });
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setNewStudentName(student.name);
    setSelectedClassId(student.classId);
    const cls = getClassById(student.classId);
    setSections(cls?.sections || []);
    setTimeout(() => setSelectedSectionId(student.sectionId), 100);
    setShowEditModal(true);
  };

  const resetForm = () => {
    setNewStudentName("");
    setSelectedClassId("");
    setSelectedSectionId("");
    setSections([]);
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

      const newStudents: Student[] = [];
      let skippedCount = 0;

      jsonData.forEach((row, index) => {
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
        const section = cls.sections.find(s => s.name === sectionName || s.name.includes(sectionName));
        if (!section) {
          skippedCount++;
          return;
        }

        // Check if student already exists
        const exists = students.some(s => 
          s.name === name && s.classId === cls.id && s.sectionId === section.id
        );

        if (!exists) {
          newStudents.push({
            id: `st${Date.now()}_${index}`,
            name: name.trim(),
            classId: cls.id,
            sectionId: section.id,
          });
        }
      });

      if (newStudents.length > 0) {
        const updatedStudents = [...students, ...newStudents];
        setStudents(updatedStudents);
        saveStudents(updatedStudents);

        toast({
          title: "تم الاستيراد",
          description: `تم إضافة ${newStudents.length} طالب بنجاح${skippedCount > 0 ? ` (تم تخطي ${skippedCount} سجل)` : ""}`,
        });
      } else {
        toast({
          title: "تنبيه",
          description: "لم يتم العثور على بيانات جديدة للاستيراد",
          variant: "destructive",
        });
      }

      // Reset file input
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
      const cls = getClassById(student.classId);
      const section = getSectionById(student.classId, student.sectionId);
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
            <Select value={filterClassId} onValueChange={setFilterClassId}>
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
                {filterSections.map(section => (
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
              filteredStudents.map((student, index) => {
                const cls = getClassById(student.classId);
                const section = getSectionById(student.classId, student.sectionId);
                return (
                  <TableRow key={student.id} className="hover:bg-green-50">
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{cls?.name || "-"}</TableCell>
                    <TableCell>{section?.name || "-"}</TableCell>
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
                );
              })
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
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
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
                  {sections.map(section => (
                    <SelectItem key={section.id} value={section.id}>{section.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              إلغاء
            </Button>
            <Button onClick={handleAddStudent} className="bg-green-600 hover:bg-green-700">
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
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
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
                  {sections.map(section => (
                    <SelectItem key={section.id} value={section.id}>{section.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              إلغاء
            </Button>
            <Button onClick={handleEditStudent} className="bg-green-600 hover:bg-green-700">
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default StudentsTab;
