import { useState, useEffect } from "react";
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
import { Plus, Trash2, Edit } from "lucide-react";
import { Student, Class, Section } from "@/types";
import { getStudents, saveStudents, getClasses, getClassById, getSectionById } from "@/services/dataService";

const StudentsTab = () => {
  const { toast } = useToast();
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
    if (filterClassId && s.classId !== filterClassId) return false;
    if (filterSectionId && s.sectionId !== filterSectionId) return false;
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

  return (
    <Card className="border-2 border-black">
      <CardHeader className="bg-gradient-to-r from-gray-100 to-white border-b border-black">
        <CardTitle className="flex justify-between items-center">
          <span>إدارة الطلاب</span>
          <Button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="ml-2 h-4 w-4" /> إضافة طالب جديد
          </Button>
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
            <Select value={filterSectionId} onValueChange={setFilterSectionId} disabled={!filterClassId}>
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
        </div>

        <Table>
          <TableHeader className="bg-black">
            <TableRow>
              <TableHead className="text-white">اسم الطالب</TableHead>
              <TableHead className="text-white">الصف</TableHead>
              <TableHead className="text-white">الشعبة</TableHead>
              <TableHead className="text-white">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.length > 0 ? (
              filteredStudents.map(student => {
                const cls = getClassById(student.classId);
                const section = getSectionById(student.classId, student.sectionId);
                return (
                  <TableRow key={student.id} className="hover:bg-green-50">
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
                <TableCell colSpan={4} className="text-center py-6">
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
