import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Save, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getStudentById } from "@/services/dataService";
import { getStudentsDB, saveTestResultsDB } from "@/services/databaseService";
import { updateTest } from "@/services/dataService";

interface ResultsEditorProps {
  test: any;
  open: boolean;
  onClose: () => void;
  onSave: (updatedTest: any) => void;
}

const ResultsEditor: React.FC<ResultsEditorProps> = ({ test, open, onClose, onSave }) => {
  const [results, setResults] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [studentNames, setStudentNames] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (open && test) {
      // Deep clone results to avoid mutating original
      setResults(JSON.parse(JSON.stringify(test.results || [])));
      loadStudentNames();
    }
  }, [open, test]);

  const loadStudentNames = async () => {
    try {
      const students = await getStudentsDB();
      if (students && students.length > 0) {
        const namesMap = new Map<string, string>();
        students.forEach((s: any) => namesMap.set(s.id, s.name));
        setStudentNames(namesMap);
      }
    } catch (e) {
      // Fallback to local
    }
  };

  const getStudentName = (result: any): string => {
    const sid = result.studentId || result.student_id;
    if (result.studentName && result.studentName !== sid) return result.studentName;
    const fromDb = studentNames.get(sid);
    if (fromDb) return fromDb;
    const student = getStudentById(sid);
    return student?.name || "طالب غير معروف";
  };

  const handleScoreChange = (resultIndex: number, questionId: string, value: string) => {
    const newResults = [...results];
    const numValue = parseFloat(value) || 0;
    const question = test.questions.find((q: any) => q.id === questionId);
    const maxScore = question?.maxScore || 0;
    
    // Clamp value between 0 and maxScore
    const clampedValue = Math.min(Math.max(numValue, 0), maxScore);
    
    newResults[resultIndex].scores = {
      ...newResults[resultIndex].scores,
      [questionId]: clampedValue
    };
    
    // Recalculate total and percentage
    const totalMaxScore = test.questions.reduce((sum: number, q: any) => sum + q.maxScore, 0);
    const totalScore = test.questions.reduce((sum: number, q: any) => {
      return sum + (newResults[resultIndex].scores[q.id] || 0);
    }, 0);
    
    newResults[resultIndex].totalScore = totalScore;
    newResults[resultIndex].percentage = totalMaxScore > 0 
      ? Math.round((totalScore / totalMaxScore) * 100) 
      : 0;
    
    setResults(newResults);
  };

  const handleAbsentChange = (resultIndex: number, isAbsent: boolean) => {
    const newResults = [...results];
    newResults[resultIndex].isAbsent = isAbsent;
    
    if (isAbsent) {
      // Reset scores when marked as absent
      newResults[resultIndex].scores = {};
      newResults[resultIndex].totalScore = 0;
      newResults[resultIndex].percentage = 0;
    }
    
    setResults(newResults);
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Prepare updated test object
      const updatedTest = {
        ...test,
        results: results
      };

      // Try to save to database
      try {
        const dbResults = results.map(r => ({
          student_id: r.studentId || r.student_id,
          scores: r.scores,
          total_score: r.totalScore,
          percentage: r.percentage,
          is_absent: r.isAbsent || false
        }));
        
        await saveTestResultsDB(test.id, dbResults);
      } catch (dbError) {
        console.log("DB save failed, falling back to local:", dbError);
      }

      // Save locally as well
      updateTest(test.id, { results: results });

      toast.success("تم حفظ التعديلات بنجاح");
      onSave(updatedTest);
    } catch (error) {
      console.error("Error saving results:", error);
      toast.error("حدث خطأ أثناء حفظ التعديلات");
    } finally {
      setIsSaving(false);
    }
  };

  const totalMaxScore = test?.questions?.reduce((sum: number, q: any) => sum + q.maxScore, 0) || 0;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b bg-gradient-to-r from-amber-500 to-orange-500">
          <DialogTitle className="text-white flex items-center gap-2">
            تعديل نتائج الاختبار - {test?.name}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {/* Header Row */}
            <div className="grid gap-2 p-3 bg-muted rounded-lg font-semibold text-sm" 
                 style={{ gridTemplateColumns: `60px 1fr repeat(${test?.questions?.length || 0}, 70px) 70px 70px 80px` }}>
              <div className="text-center">#</div>
              <div>اسم الطالب</div>
              {test?.questions?.map((q: any, idx: number) => (
                <div key={q.id} className="text-center" title={q.type}>
                  {q.type}<br/>
                  <span className="text-xs text-muted-foreground">/{q.maxScore}</span>
                </div>
              ))}
              <div className="text-center">المجموع<br/><span className="text-xs text-muted-foreground">/{totalMaxScore}</span></div>
              <div className="text-center">النسبة</div>
              <div className="text-center">غائب</div>
            </div>

            {/* Results Rows */}
            {results.map((result, idx) => (
              <div 
                key={result.studentId || result.student_id || idx}
                className={`grid gap-2 p-3 rounded-lg border transition-colors ${
                  result.isAbsent 
                    ? 'bg-muted/50 opacity-60' 
                    : result.percentage < 50 
                      ? 'bg-red-50 dark:bg-red-950/20 border-red-200' 
                      : 'bg-card hover:bg-muted/30'
                }`}
                style={{ gridTemplateColumns: `60px 1fr repeat(${test?.questions?.length || 0}, 70px) 70px 70px 80px` }}
              >
                <div className="text-center font-medium flex items-center justify-center">
                  {idx + 1}
                </div>
                <div className="flex items-center font-medium truncate">
                  {getStudentName(result)}
                </div>
                {test?.questions?.map((q: any) => (
                  <div key={q.id} className="flex items-center justify-center">
                    <Input
                      type="number"
                      min={0}
                      max={q.maxScore}
                      step={0.5}
                      value={result.isAbsent ? '' : (result.scores?.[q.id] ?? 0)}
                      onChange={(e) => handleScoreChange(idx, q.id, e.target.value)}
                      disabled={result.isAbsent}
                      className="w-16 h-8 text-center text-sm"
                    />
                  </div>
                ))}
                <div className="flex items-center justify-center font-semibold">
                  {result.isAbsent ? '-' : result.totalScore}
                </div>
                <div className={`flex items-center justify-center font-semibold ${
                  result.isAbsent ? '' :
                  result.percentage >= 85 ? 'text-green-600' :
                  result.percentage >= 75 ? 'text-blue-600' :
                  result.percentage >= 65 ? 'text-yellow-600' :
                  result.percentage >= 50 ? 'text-orange-600' :
                  'text-red-600'
                }`}>
                  {result.isAbsent ? '-' : `${result.percentage}%`}
                </div>
                <div className="flex items-center justify-center">
                  <Checkbox
                    checked={result.isAbsent || false}
                    onCheckedChange={(checked) => handleAbsentChange(idx, checked as boolean)}
                  />
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="p-4 border-t flex justify-between items-center bg-muted/30">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            <X className="ml-2 h-4 w-4" />
            إلغاء
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
            {isSaving ? (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="ml-2 h-4 w-4" />
            )}
            حفظ التعديلات
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ResultsEditor;
