import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Package, Star, Zap, Download } from "lucide-react";
import {
  SystemUpdate,
  getSystemUpdates,
  createSystemUpdate,
  updateSystemUpdate,
  deleteSystemUpdate,
} from "@/services/updateService";

interface UpdatesManagementProps {
  onClose?: () => void;
}

const UpdatesManagement = ({ onClose }: UpdatesManagementProps) => {
  const { toast } = useToast();
  const [updates, setUpdates] = useState<SystemUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<SystemUpdate | null>(null);
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [version, setVersion] = useState("");
  const [updateType, setUpdateType] = useState("feature");
  const [isOptional, setIsOptional] = useState(false);

  useEffect(() => {
    loadUpdates();
  }, []);

  const loadUpdates = async () => {
    setIsLoading(true);
    const data = await getSystemUpdates();
    setUpdates(data);
    setIsLoading(false);
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setVersion("");
    setUpdateType("feature");
    setIsOptional(false);
    setEditingUpdate(null);
  };

  const handleOpenModal = (update?: SystemUpdate) => {
    if (update) {
      setEditingUpdate(update);
      setTitle(update.title);
      setDescription(update.description || "");
      setVersion(update.version);
      setUpdateType(update.update_type);
      setIsOptional(update.is_optional);
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!title || !version) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال العنوان ورقم الإصدار",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingUpdate) {
        await updateSystemUpdate(editingUpdate.id, {
          title,
          description,
          version,
          update_type: updateType,
          is_optional: isOptional,
        });
        toast({
          title: "تم التحديث",
          description: "تم تحديث البيانات بنجاح",
        });
      } else {
        await createSystemUpdate({
          title,
          description,
          version,
          update_type: updateType,
          is_optional: isOptional,
        });
        toast({
          title: "تم الإضافة",
          description: "تم إضافة التحديث بنجاح",
        });
      }
      setShowModal(false);
      resetForm();
      loadUpdates();
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء الحفظ",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا التحديث؟")) {
      const success = await deleteSystemUpdate(id);
      if (success) {
        toast({
          title: "تم الحذف",
          description: "تم حذف التحديث بنجاح",
        });
        loadUpdates();
      } else {
        toast({
          title: "خطأ",
          description: "فشل في حذف التحديث",
          variant: "destructive",
        });
      }
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "feature":
        return <Star className="h-4 w-4 text-yellow-500" />;
      case "bugfix":
        return <Zap className="h-4 w-4 text-blue-500" />;
      case "enhancement":
        return <Package className="h-4 w-4 text-green-500" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "feature":
        return "ميزة جديدة";
      case "bugfix":
        return "إصلاح خطأ";
      case "enhancement":
        return "تحسين";
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-purple-500">
        <CardHeader className="bg-gradient-to-r from-purple-100 to-white border-b border-purple-500">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              إدارة التحديثات والميزات
            </CardTitle>
            <Button
              onClick={() => handleOpenModal()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4 ml-2" />
              إضافة تحديث
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-2 text-muted-foreground">جاري التحميل...</p>
            </div>
          ) : updates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد تحديثات. قم بإضافة تحديث جديد.
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-black text-white">
                  <TableRow>
                    <TableHead className="text-right text-white">العنوان</TableHead>
                    <TableHead className="text-right text-white">الإصدار</TableHead>
                    <TableHead className="text-right text-white">النوع</TableHead>
                    <TableHead className="text-right text-white">اختياري</TableHead>
                    <TableHead className="text-right text-white">التاريخ</TableHead>
                    <TableHead className="text-right text-white">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {updates.map((update) => (
                    <TableRow key={update.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <p className="font-medium">{update.title}</p>
                          {update.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {update.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
                          v{update.version}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getTypeIcon(update.update_type)}
                          <span className="text-sm">{getTypeLabel(update.update_type)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            update.is_optional
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {update.is_optional ? "اختياري" : "إلزامي"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(update.created_at).toLocaleDateString("ar-SA")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-blue-600 border-blue-600 hover:bg-blue-50"
                            onClick={() => handleOpenModal(update)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(update.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingUpdate ? "تعديل التحديث" : "إضافة تحديث جديد"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">العنوان</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: نظام التقارير المتقدم"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="version">رقم الإصدار</Label>
              <Input
                id="version"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="مثال: 1.2.0"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="type">نوع التحديث</Label>
              <Select value={updateType} onValueChange={setUpdateType}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر النوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="feature">ميزة جديدة</SelectItem>
                  <SelectItem value="bugfix">إصلاح خطأ</SelectItem>
                  <SelectItem value="enhancement">تحسين</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">الوصف</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="وصف تفصيلي للتحديث..."
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>تحديث اختياري</Label>
                <p className="text-sm text-muted-foreground">
                  يمكن للمدارس اختيار تفعيل هذا التحديث
                </p>
              </div>
              <Switch checked={isOptional} onCheckedChange={setIsOptional} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              إلغاء
            </Button>
            <Button
              onClick={handleSave}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {editingUpdate ? "تحديث" : "إضافة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UpdatesManagement;
