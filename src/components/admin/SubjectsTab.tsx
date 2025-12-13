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
import { Plus, Trash2, Edit } from "lucide-react";
import { Subject } from "@/types";
import { getSubjects, saveSubjects } from "@/services/dataService";

const SubjectsTab = () => {
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [newSubjectName, setNewSubjectName] = useState("");

  useEffect(() => {
    setSubjects(getSubjects());
  }, []);

  const handleAddSubject = () => {
    if (!newSubjectName.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم المادة",
        variant: "destructive",
      });
      return;
    }

    const newSubject: Subject = {
      id: `sub${Date.now()}`,
      name: newSubjectName.trim(),
    };

    const updatedSubjects = [...subjects, newSubject];
    setSubjects(updatedSubjects);
    saveSubjects(updatedSubjects);

    toast({
      title: "تمت الإضافة",
      description: `تم إضافة ${newSubjectName} بنجاح`,
    });

    setNewSubjectName("");
    setShowAddModal(false);
  };

  const handleEditSubject = () => {
    if (!editingSubject || !newSubjectName.trim()) return;

    const updatedSubjects = subjects.map(s =>
      s.id === editingSubject.id ? { ...s, name: newSubjectName.trim() } : s
    );

    setSubjects(updatedSubjects);
    saveSubjects(updatedSubjects);

    toast({
      title: "تم التحديث",
      description: `تم تحديث ${newSubjectName} بنجاح`,
    });

    setEditingSubject(null);
    setNewSubjectName("");
    setShowEditModal(false);
  };

  const handleDeleteSubject = (subjectId: string) => {
    const subjectToDelete = subjects.find(s => s.id === subjectId);
    const updatedSubjects = subjects.filter(s => s.id !== subjectId);
    setSubjects(updatedSubjects);
    saveSubjects(updatedSubjects);

    toast({
      title: "تم الحذف",
      description: `تم حذف ${subjectToDelete?.name || "المادة"} بنجاح`,
    });
  };

  const openEditModal = (subject: Subject) => {
    setEditingSubject(subject);
    setNewSubjectName(subject.name);
    setShowEditModal(true);
  };

  return (
    <Card className="border-2 border-black">
      <CardHeader className="bg-gradient-to-r from-red-100 to-white border-b border-black">
        <CardTitle className="flex justify-between items-center">
          <span>إدارة المواد الدراسية</span>
          <Button
            onClick={() => {
              setNewSubjectName("");
              setShowAddModal(true);
            }}
            className="bg-red-600 hover:bg-red-700"
          >
            <Plus className="ml-2 h-4 w-4" /> إضافة مادة جديدة
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <Table>
          <TableHeader className="bg-black">
            <TableRow>
              <TableHead className="text-white">اسم المادة</TableHead>
              <TableHead className="text-white">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subjects.length > 0 ? (
              subjects.map(subject => (
                <TableRow key={subject.id} className="hover:bg-red-50">
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
                <TableCell colSpan={2} className="text-center py-6">
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
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              إلغاء
            </Button>
            <Button onClick={handleAddSubject} className="bg-red-600 hover:bg-red-700">
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
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              إلغاء
            </Button>
            <Button onClick={handleEditSubject} className="bg-red-600 hover:bg-red-700">
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default SubjectsTab;
