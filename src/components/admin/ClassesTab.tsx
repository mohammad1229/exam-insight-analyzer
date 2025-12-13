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
import { Class, Section } from "@/types";
import { getClasses, saveClasses } from "@/services/dataService";

const ClassesTab = () => {
  const { toast } = useToast();
  const [classes, setClasses] = useState<Class[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [newClassName, setNewClassName] = useState("");
  const [newSections, setNewSections] = useState<string[]>([""]);

  useEffect(() => {
    setClasses(getClasses());
  }, []);

  const handleAddClass = () => {
    if (!newClassName.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم الصف",
        variant: "destructive",
      });
      return;
    }

    const sections: Section[] = newSections
      .filter(s => s.trim())
      .map((name, index) => ({
        id: `s${index + 1}c${Date.now()}`,
        name: name.trim(),
      }));

    const newClass: Class = {
      id: `c${Date.now()}`,
      name: newClassName.trim(),
      sections,
    };

    const updatedClasses = [...classes, newClass];
    setClasses(updatedClasses);
    saveClasses(updatedClasses);

    toast({
      title: "تمت الإضافة",
      description: `تم إضافة ${newClassName} بنجاح`,
    });

    setNewClassName("");
    setNewSections([""]);
    setShowAddModal(false);
  };

  const handleEditClass = () => {
    if (!editingClass || !newClassName.trim()) return;

    const sections: Section[] = newSections
      .filter(s => s.trim())
      .map((name, index) => ({
        id: editingClass.sections[index]?.id || `s${index + 1}c${Date.now()}`,
        name: name.trim(),
      }));

    const updatedClasses = classes.map(c =>
      c.id === editingClass.id
        ? { ...c, name: newClassName.trim(), sections }
        : c
    );

    setClasses(updatedClasses);
    saveClasses(updatedClasses);

    toast({
      title: "تم التحديث",
      description: `تم تحديث ${newClassName} بنجاح`,
    });

    setEditingClass(null);
    setNewClassName("");
    setNewSections([""]);
    setShowEditModal(false);
  };

  const handleDeleteClass = (classId: string) => {
    const classToDelete = classes.find(c => c.id === classId);
    const updatedClasses = classes.filter(c => c.id !== classId);
    setClasses(updatedClasses);
    saveClasses(updatedClasses);

    toast({
      title: "تم الحذف",
      description: `تم حذف ${classToDelete?.name || "الصف"} بنجاح`,
    });
  };

  const openEditModal = (cls: Class) => {
    setEditingClass(cls);
    setNewClassName(cls.name);
    setNewSections(cls.sections.map(s => s.name));
    setShowEditModal(true);
  };

  const addSectionField = () => {
    setNewSections([...newSections, ""]);
  };

  const updateSectionField = (index: number, value: string) => {
    const updated = [...newSections];
    updated[index] = value;
    setNewSections(updated);
  };

  const removeSectionField = (index: number) => {
    if (newSections.length > 1) {
      setNewSections(newSections.filter((_, i) => i !== index));
    }
  };

  return (
    <Card className="border-2 border-black">
      <CardHeader className="bg-gradient-to-r from-green-100 to-white border-b border-black">
        <CardTitle className="flex justify-between items-center">
          <span>إدارة الصفوف</span>
          <Button
            onClick={() => {
              setNewClassName("");
              setNewSections([""]);
              setShowAddModal(true);
            }}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="ml-2 h-4 w-4" /> إضافة صف جديد
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <Table>
          <TableHeader className="bg-black">
            <TableRow>
              <TableHead className="text-white">اسم الصف</TableHead>
              <TableHead className="text-white">الشعب</TableHead>
              <TableHead className="text-white">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classes.length > 0 ? (
              classes.map(cls => (
                <TableRow key={cls.id} className="hover:bg-green-50">
                  <TableCell className="font-medium">{cls.name}</TableCell>
                  <TableCell>
                    {cls.sections.map(s => s.name).join("، ")}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(cls)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500 hover:bg-red-50"
                        onClick={() => handleDeleteClass(cls.id)}
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
                  لا توجد صفوف مضافة
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
            <DialogTitle>إضافة صف جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>اسم الصف</Label>
              <Input
                value={newClassName}
                onChange={e => setNewClassName(e.target.value)}
                placeholder="مثال: الصف الرابع"
              />
            </div>
            <div>
              <Label>الشعب</Label>
              {newSections.map((section, index) => (
                <div key={index} className="flex gap-2 mt-2">
                  <Input
                    value={section}
                    onChange={e => updateSectionField(index, e.target.value)}
                    placeholder="مثال: أ"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeSectionField(index)}
                    disabled={newSections.length === 1}
                    className="text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={addSectionField}
                className="mt-2"
              >
                <Plus className="h-4 w-4 ml-1" /> إضافة شعبة
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              إلغاء
            </Button>
            <Button onClick={handleAddClass} className="bg-green-600 hover:bg-green-700">
              إضافة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="dir-rtl">
          <DialogHeader>
            <DialogTitle>تعديل الصف</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>اسم الصف</Label>
              <Input
                value={newClassName}
                onChange={e => setNewClassName(e.target.value)}
              />
            </div>
            <div>
              <Label>الشعب</Label>
              {newSections.map((section, index) => (
                <div key={index} className="flex gap-2 mt-2">
                  <Input
                    value={section}
                    onChange={e => updateSectionField(index, e.target.value)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeSectionField(index)}
                    disabled={newSections.length === 1}
                    className="text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={addSectionField}
                className="mt-2"
              >
                <Plus className="h-4 w-4 ml-1" /> إضافة شعبة
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              إلغاء
            </Button>
            <Button onClick={handleEditClass} className="bg-green-600 hover:bg-green-700">
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ClassesTab;
