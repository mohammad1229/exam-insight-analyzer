import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Save, RotateCcw, GraduationCap, BookOpen, BarChart3 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ClassItem {
  id: string;
  name: string;
  sections: { id: string; name: string }[];
}

interface SubjectItem {
  id: string;
  name: string;
}

interface PerformanceLevel {
  id: string;
  name: string;
  minScore: number;
  maxScore: number;
  color: string;
}

const STORAGE_KEY = "defaultSchoolData";

const getDefaultData = () => ({
  classes: [
    { id: "c1", name: "الصف الأول", sections: [{ id: "s1c1", name: "أ" }, { id: "s2c1", name: "ب" }] },
    { id: "c2", name: "الصف الثاني", sections: [{ id: "s1c2", name: "أ" }, { id: "s2c2", name: "ب" }] },
    { id: "c3", name: "الصف الثالث", sections: [{ id: "s1c3", name: "أ" }, { id: "s2c3", name: "ب" }] },
    { id: "c4", name: "الصف الرابع", sections: [{ id: "s1c4", name: "أ" }, { id: "s2c4", name: "ب" }] },
    { id: "c5", name: "الصف الخامس", sections: [{ id: "s1c5", name: "أ" }, { id: "s2c5", name: "ب" }] },
    { id: "c6", name: "الصف السادس", sections: [{ id: "s1c6", name: "أ" }, { id: "s2c6", name: "ب" }] },
    { id: "c7", name: "الصف السابع", sections: [{ id: "s1c7", name: "أ" }, { id: "s2c7", name: "ب" }] },
    { id: "c8", name: "الصف الثامن", sections: [{ id: "s1c8", name: "أ" }, { id: "s2c8", name: "ب" }] },
    { id: "c9", name: "الصف التاسع", sections: [{ id: "s1c9", name: "أ" }, { id: "s2c9", name: "ب" }] },
    { id: "c10", name: "الصف العاشر", sections: [{ id: "s1c10", name: "أ" }, { id: "s2c10", name: "ب" }] },
  ],
  subjects: [
    { id: "sub1", name: "الرياضيات" },
    { id: "sub2", name: "العلوم" },
    { id: "sub3", name: "اللغة العربية" },
    { id: "sub4", name: "اللغة الإنجليزية" },
    { id: "sub5", name: "التربية الإسلامية" },
    { id: "sub6", name: "الدراسات الاجتماعية" },
    { id: "sub7", name: "التربية الوطنية" },
    { id: "sub8", name: "الحاسوب" },
  ],
  performanceLevels: [
    { id: "lvl1", name: "متفوق", minScore: 90, maxScore: 100, color: "#22c55e" },
    { id: "lvl2", name: "جيد جداً", minScore: 80, maxScore: 89, color: "#3b82f6" },
    { id: "lvl3", name: "جيد", minScore: 70, maxScore: 79, color: "#eab308" },
    { id: "lvl4", name: "مقبول", minScore: 60, maxScore: 69, color: "#f97316" },
    { id: "lvl5", name: "ضعيف", minScore: 50, maxScore: 59, color: "#ef4444" },
    { id: "lvl6", name: "راسب", minScore: 0, maxScore: 49, color: "#991b1b" },
  ]
});

const DefaultDataSettings = () => {
  const { toast } = useToast();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [performanceLevels, setPerformanceLevels] = useState<PerformanceLevel[]>([]);
  const [newClassName, setNewClassName] = useState("");
  const [newSubjectName, setNewSubjectName] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        setClasses(data.classes || []);
        setSubjects(data.subjects || []);
        setPerformanceLevels(data.performanceLevels || []);
      } else {
        const defaults = getDefaultData();
        setClasses(defaults.classes);
        setSubjects(defaults.subjects);
        setPerformanceLevels(defaults.performanceLevels);
      }
    } catch (error) {
      console.error("Error loading default data:", error);
      const defaults = getDefaultData();
      setClasses(defaults.classes);
      setSubjects(defaults.subjects);
      setPerformanceLevels(defaults.performanceLevels);
    }
  };

  const saveData = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        classes,
        subjects,
        performanceLevels
      }));
      toast({
        title: "تم الحفظ",
        description: "تم حفظ البيانات الافتراضية بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في حفظ البيانات",
        variant: "destructive",
      });
    }
  };

  const resetToDefaults = () => {
    const defaults = getDefaultData();
    setClasses(defaults.classes);
    setSubjects(defaults.subjects);
    setPerformanceLevels(defaults.performanceLevels);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    toast({
      title: "تم الاستعادة",
      description: "تم استعادة البيانات الافتراضية الأصلية",
    });
  };

  const addClass = () => {
    if (!newClassName.trim()) return;
    const newId = `c${Date.now()}`;
    setClasses([...classes, {
      id: newId,
      name: newClassName.trim(),
      sections: [
        { id: `s1${newId}`, name: "أ" },
        { id: `s2${newId}`, name: "ب" }
      ]
    }]);
    setNewClassName("");
  };

  const removeClass = (id: string) => {
    setClasses(classes.filter(c => c.id !== id));
  };

  const addSubject = () => {
    if (!newSubjectName.trim()) return;
    setSubjects([...subjects, {
      id: `sub${Date.now()}`,
      name: newSubjectName.trim()
    }]);
    setNewSubjectName("");
  };

  const removeSubject = (id: string) => {
    setSubjects(subjects.filter(s => s.id !== id));
  };

  const updatePerformanceLevel = (id: string, field: keyof PerformanceLevel, value: any) => {
    setPerformanceLevels(levels => 
      levels.map(l => l.id === id ? { ...l, [field]: value } : l)
    );
  };

  return (
    <Card className="border-2 border-indigo-500">
      <CardHeader className="bg-gradient-to-r from-indigo-100 to-white border-b border-indigo-500">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            البيانات الافتراضية للمدارس الجديدة
          </CardTitle>
          <div className="flex gap-2">
            <Button onClick={resetToDefaults} variant="outline" size="sm">
              <RotateCcw className="h-4 w-4 ml-2" />
              استعادة الافتراضي
            </Button>
            <Button onClick={saveData} className="bg-indigo-600 hover:bg-indigo-700" size="sm">
              <Save className="h-4 w-4 ml-2" />
              حفظ التغييرات
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <Tabs defaultValue="classes" className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="classes" className="flex items-center gap-1">
              <GraduationCap className="h-4 w-4" />
              الصفوف
            </TabsTrigger>
            <TabsTrigger value="subjects" className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              المواد
            </TabsTrigger>
            <TabsTrigger value="levels" className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              المستويات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="classes" className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="اسم الصف الجديد"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addClass()}
              />
              <Button onClick={addClass} className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              {classes.map((cls) => (
                <div key={cls.id} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                  <span className="text-sm font-medium">{cls.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeClass(cls.id)}
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="subjects" className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="اسم المادة الجديدة"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSubject()}
              />
              <Button onClick={addSubject} className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {subjects.map((subject) => (
                <div key={subject.id} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                  <span className="text-sm font-medium">{subject.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSubject(subject.id)}
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="levels" className="space-y-4">
            <div className="space-y-3">
              {performanceLevels.map((level) => (
                <div key={level.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded border">
                  <input
                    type="color"
                    value={level.color}
                    onChange={(e) => updatePerformanceLevel(level.id, "color", e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                  <Input
                    value={level.name}
                    onChange={(e) => updatePerformanceLevel(level.id, "name", e.target.value)}
                    className="w-32"
                  />
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={level.minScore}
                      onChange={(e) => updatePerformanceLevel(level.id, "minScore", parseInt(e.target.value) || 0)}
                      className="w-16 text-center"
                    />
                    <span>-</span>
                    <Input
                      type="number"
                      value={level.maxScore}
                      onChange={(e) => updatePerformanceLevel(level.id, "maxScore", parseInt(e.target.value) || 0)}
                      className="w-16 text-center"
                    />
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DefaultDataSettings;
