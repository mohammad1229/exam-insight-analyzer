import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { useToast } from "@/hooks/use-toast";
import { 
  Sparkles, 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  RefreshCw,
  Quote,
  Check,
  X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getStoredLicense } from "@/services/licenseService";
import { z } from "zod";

// Validation schema
const wisdomSchema = z.object({
  content: z.string()
    .trim()
    .min(1, "محتوى الحكمة مطلوب")
    .max(500, "الحكمة يجب أن لا تتجاوز 500 حرف"),
  author: z.string().max(100, "اسم المؤلف يجب أن لا يتجاوز 100 حرف").optional(),
  category: z.string().max(50).optional(),
});

interface Wisdom {
  id: string;
  content: string;
  author: string | null;
  category: string;
  is_active: boolean;
  is_global: boolean;
  display_order: number;
  created_at: string;
}

interface WisdomsTabProps {
  isSystemAdmin?: boolean;
}

const WisdomsTab = ({ isSystemAdmin = false }: WisdomsTabProps) => {
  const { toast } = useToast();
  const [wisdoms, setWisdoms] = useState<Wisdom[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [editingWisdom, setEditingWisdom] = useState<Wisdom | null>(null);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  
  // Form state
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("general");
  const [isGlobal, setIsGlobal] = useState(false);
  const [bulkText, setBulkText] = useState("");

  const license = getStoredLicense();

  useEffect(() => {
    loadWisdoms();
  }, []);

  const loadWisdoms = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke("manage-wisdoms", {
        body: { 
          action: "getAll", 
          schoolId: isSystemAdmin ? undefined : license?.schoolId 
        },
      });

      if (error) throw error;

      if (data?.success) {
        setWisdoms(data.wisdoms || []);
      }
    } catch (error: any) {
      console.error("Error loading wisdoms:", error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل الحكم",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    try {
      wisdomSchema.parse({ content, author, category });
      setFormErrors([]);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setFormErrors(error.errors.map(e => e.message));
      }
      return false;
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      const wisdomData = {
        content: content.trim(),
        author: author.trim() || null,
        category,
        school_id: isSystemAdmin && isGlobal ? null : license?.schoolId,
        is_global: isSystemAdmin ? isGlobal : false,
        created_by: isSystemAdmin ? "system_admin" : "school_admin",
      };

      const { data, error } = await supabase.functions.invoke("manage-wisdoms", {
        body: {
          action: editingWisdom ? "update" : "create",
          wisdom: wisdomData,
          wisdomId: editingWisdom?.id,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: editingWisdom ? "تم التحديث" : "تمت الإضافة",
          description: editingWisdom ? "تم تحديث الحكمة بنجاح" : "تمت إضافة الحكمة بنجاح",
        });
        resetForm();
        loadWisdoms();
      } else {
        throw new Error(data?.error || "حدث خطأ");
      }
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء الحفظ",
        variant: "destructive",
      });
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkText.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال الحكم",
        variant: "destructive",
      });
      return;
    }

    try {
      // Parse bulk text (each line is a wisdom)
      const lines = bulkText.split("\n").filter(line => line.trim());
      const wisdomsList = lines.map((line, index) => {
        // Check if line has author (format: "wisdom - author" or "wisdom | author")
        const separators = [" - ", " | ", " — "];
        let content = line.trim();
        let author = null;

        for (const sep of separators) {
          if (line.includes(sep)) {
            const parts = line.split(sep);
            content = parts[0].trim();
            author = parts.slice(1).join(sep).trim();
            break;
          }
        }

        return {
          content,
          author,
          category: "general",
          school_id: isSystemAdmin && isGlobal ? null : license?.schoolId,
          is_global: isSystemAdmin ? isGlobal : false,
          created_by: isSystemAdmin ? "system_admin" : "school_admin",
          display_order: index,
        };
      });

      const { data, error } = await supabase.functions.invoke("manage-wisdoms", {
        body: { action: "bulkCreate", wisdoms: wisdomsList },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "تمت الإضافة",
          description: `تم إضافة ${data.count} حكمة بنجاح`,
        });
        setShowBulkDialog(false);
        setBulkText("");
        loadWisdoms();
      } else {
        throw new Error(data?.error || "حدث خطأ");
      }
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء الإضافة",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (wisdomId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الحكمة؟")) return;

    try {
      const { data, error } = await supabase.functions.invoke("manage-wisdoms", {
        body: { action: "delete", wisdomId },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "تم الحذف",
          description: "تم حذف الحكمة بنجاح",
        });
        loadWisdoms();
      }
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء الحذف",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (wisdom: Wisdom) => {
    try {
      const { data, error } = await supabase.functions.invoke("manage-wisdoms", {
        body: {
          action: "update",
          wisdomId: wisdom.id,
          wisdom: { is_active: !wisdom.is_active },
        },
      });

      if (error) throw error;

      if (data?.success) {
        loadWisdoms();
      }
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setContent("");
    setAuthor("");
    setCategory("general");
    setIsGlobal(false);
    setEditingWisdom(null);
    setShowAddDialog(false);
    setFormErrors([]);
  };

  const openEditDialog = (wisdom: Wisdom) => {
    setEditingWisdom(wisdom);
    setContent(wisdom.content);
    setAuthor(wisdom.author || "");
    setCategory(wisdom.category);
    setIsGlobal(wisdom.is_global);
    setShowAddDialog(true);
  };

  return (
    <Card className="border-2 border-amber-500">
      <CardHeader className="bg-gradient-to-r from-amber-100 to-yellow-50 border-b border-amber-500">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-600" />
            الحكم والمواعظ
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadWisdoms}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ml-1 ${isLoading ? "animate-spin" : ""}`} />
              تحديث
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBulkDialog(true)}
              className="border-amber-500 text-amber-700 hover:bg-amber-50"
            >
              <Upload className="h-4 w-4 ml-1" />
              رفع مجموعة
            </Button>
            <Button
              size="sm"
              onClick={() => setShowAddDialog(true)}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <Plus className="h-4 w-4 ml-1" />
              إضافة حكمة
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
            جاري التحميل...
          </div>
        ) : wisdoms.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Quote className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>لا توجد حكم مضافة</p>
            <p className="text-sm mt-1">اضغط على "إضافة حكمة" لإضافة حكمة جديدة</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden max-h-[500px] overflow-y-auto">
            <Table>
              <TableHeader className="bg-amber-50 sticky top-0">
                <TableRow>
                  <TableHead className="text-right">الحكمة</TableHead>
                  <TableHead className="text-right">المؤلف</TableHead>
                  <TableHead className="text-right">النوع</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wisdoms.map((wisdom) => (
                  <TableRow key={wisdom.id} className="hover:bg-amber-50/50">
                    <TableCell className="max-w-[300px]">
                      <p className="truncate" title={wisdom.content}>
                        {wisdom.content}
                      </p>
                    </TableCell>
                    <TableCell>{wisdom.author || "-"}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${
                        wisdom.is_global 
                          ? "bg-blue-100 text-blue-800" 
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {wisdom.is_global ? "عامة" : "خاصة"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(wisdom)}
                        className={wisdom.is_active ? "text-green-600" : "text-gray-400"}
                      >
                        {wisdom.is_active ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(wisdom)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(wisdom.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={showAddDialog} onOpenChange={(open) => !open && resetForm()}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-600" />
                {editingWisdom ? "تعديل الحكمة" : "إضافة حكمة جديدة"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {formErrors.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  {formErrors.map((error, i) => (
                    <p key={i} className="text-sm text-red-600">{error}</p>
                  ))}
                </div>
              )}
              <div className="space-y-2">
                <Label>الحكمة *</Label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="اكتب الحكمة هنا..."
                  className="min-h-[100px]"
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground text-left">
                  {content.length}/500
                </p>
              </div>
              <div className="space-y-2">
                <Label>المؤلف (اختياري)</Label>
                <Input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="مثال: الإمام الشافعي"
                  maxLength={100}
                />
              </div>
              {isSystemAdmin && (
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <Label>حكمة عامة</Label>
                    <p className="text-xs text-muted-foreground">
                      تظهر في جميع المدارس
                    </p>
                  </div>
                  <Switch
                    checked={isGlobal}
                    onCheckedChange={setIsGlobal}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetForm}>
                إلغاء
              </Button>
              <Button 
                onClick={handleSave}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {editingWisdom ? "تحديث" : "إضافة"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Upload Dialog */}
        <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-amber-600" />
                رفع مجموعة حكم
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  اكتب كل حكمة في سطر منفصل. يمكنك إضافة المؤلف بعد الحكمة مفصولاً بـ "-" أو "|"
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  مثال: العلم نور - الإمام علي
                </p>
              </div>
              <div className="space-y-2">
                <Label>الحكم</Label>
                <Textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder="العلم نور&#10;من جد وجد - مثل عربي&#10;الصبر مفتاح الفرج"
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>
              {isSystemAdmin && (
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <Label>حكم عامة</Label>
                    <p className="text-xs text-muted-foreground">
                      تظهر في جميع المدارس
                    </p>
                  </div>
                  <Switch
                    checked={isGlobal}
                    onCheckedChange={setIsGlobal}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
                إلغاء
              </Button>
              <Button 
                onClick={handleBulkUpload}
                className="bg-amber-600 hover:bg-amber-700"
              >
                <Upload className="h-4 w-4 ml-1" />
                رفع الحكم
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default WisdomsTab;
