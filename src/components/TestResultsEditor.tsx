import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Edit2, Save, X, User } from "lucide-react";
import { toast } from "sonner";
import { Test, TestResult, Question } from "@/types";
import { getStudentById, updateTest } from "@/services/dataService";

interface TestResultsEditorProps {
  test: Test;
  open: boolean;
  onClose: () => void;
  onSave: (updatedTest: Test) => void;
}

const TestResultsEditor: React.FC<TestResultsEditorProps> = ({ test, open, onClose, onSave }) => {
  const [editedResults, setEditedResults] = useState<TestResult[]>([]);

  useEffect(() => {
    if (test?.results) {
      setEditedResults([...test.results]);
    }
  }, [test]);

  const handleScoreChange = (resultIndex: number, questionId: string, value: number, maxScore: number) => {
    const clampedValue = Math.max(0, Math.min(value, maxScore));
    
    setEditedResults(prev => {
      const updated = [...prev];
      const result = { ...updated[resultIndex] };
      result.scores = { ...result.scores, [questionId]: clampedValue };
      
      // Recalculate total and percentage
      const totalScore = test.questions.reduce((sum, q) => sum + (result.scores[q.id] || 0), 0);
      const totalMaxScore = test.questions.reduce((sum, q) => sum + q.maxScore, 0);
      result.totalScore = totalScore;
      result.percentage = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;
      
      updated[resultIndex] = result;
      return updated;
    });
  };

  const handleAbsentChange = (resultIndex: number, isAbsent: boolean) => {
    setEditedResults(prev => {
      const updated = [...prev];
      const result = { ...updated[resultIndex] };
      result.isAbsent = isAbsent;
      
      if (isAbsent) {
        result.scores = {};
        result.totalScore = 0;
        result.percentage = 0;
      }
      
      updated[resultIndex] = result;
      return updated;
    });
  };

  const handleSave = () => {
    // Add student names to results
    const resultsWithNames = editedResults.map(r => ({
      ...r,
      studentName: getStudentById(r.studentId)?.name || r.studentId
    }));

    const updatedTest = {
      ...test,
      results: resultsWithNames
    };

    // Save to localStorage
    updateTest(test.id, { results: resultsWithNames });
    onSave(updatedTest);
    toast.success("تم حفظ التعديلات بنجاح");
    onClose();
  };

  const getStudentName = (studentId: string): string => {
    const student = getStudentById(studentId);
    return student?.name || studentId;
  };

  const getPerformanceLevel = (percentage: number): { label: string; color: string } => {
    if (percentage >= 85) return { label: "ممتاز", color: "text-green-600 bg-green-50" };
    if (percentage >= 75) return { label: "جيد", color: "text-blue-600 bg-blue-50" };
    if (percentage >= 65) return { label: "متوسط", color: "text-yellow-600 bg-yellow-50" };
    if (percentage >= 50) return { label: "متدني", color: "text-orange-600 bg-orange-50" };
    return { label: "راسب", color: "text-red-600 bg-red-50" };
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b bg-gradient-to-r from-primary/10 to-primary/5">
          <DialogTitle className="flex items-center gap-2">
            <Edit2 className="h-5 w-5" />
            تعديل نتائج الاختبار - {test?.name}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {/* Questions Header */}
            <Card className="p-4 bg-muted/30">
              <div className="flex items-center gap-4 flex-wrap text-sm">
                <span className="font-semibold">الأسئلة:</span>
                {test?.questions?.map((q, idx) => (
                  <span key={q.id} className="px-2 py-1 bg-primary/10 rounded">
                    {q.type} ({q.maxScore})
                  </span>
                ))}
              </div>
            </Card>

            {/* Results Table */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-right border-b">#</th>
                    <th className="p-2 text-right border-b">اسم الطالب</th>
                    <th className="p-2 text-center border-b">غائب</th>
                    {test?.questions?.map((q, idx) => (
                      <th key={q.id} className="p-2 text-center border-b">
                        {q.type}
                        <span className="block text-xs text-muted-foreground">({q.maxScore})</span>
                      </th>
                    ))}
                    <th className="p-2 text-center border-b">المجموع</th>
                    <th className="p-2 text-center border-b">النسبة</th>
                    <th className="p-2 text-center border-b">المستوى</th>
                  </tr>
                </thead>
                <tbody>
                  {editedResults.map((result, index) => {
                    const level = getPerformanceLevel(result.percentage);
                    return (
                      <tr key={result.id} className="hover:bg-muted/50">
                        <td className="p-2 border-b text-center">{index + 1}</td>
                        <td className="p-2 border-b">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {getStudentName(result.studentId)}
                          </div>
                        </td>
                        <td className="p-2 border-b text-center">
                          <Checkbox
                            checked={result.isAbsent}
                            onCheckedChange={(checked) => handleAbsentChange(index, checked as boolean)}
                          />
                        </td>
                        {test?.questions?.map((q) => (
                          <td key={q.id} className="p-2 border-b text-center">
                            <Input
                              type="number"
                              min={0}
                              max={q.maxScore}
                              value={result.isAbsent ? "" : (result.scores[q.id] || 0)}
                              onChange={(e) => handleScoreChange(index, q.id, parseInt(e.target.value) || 0, q.maxScore)}
                              disabled={result.isAbsent}
                              className="w-16 text-center mx-auto"
                            />
                          </td>
                        ))}
                        <td className="p-2 border-b text-center font-semibold">
                          {result.isAbsent ? "-" : result.totalScore}
                        </td>
                        <td className="p-2 border-b text-center font-semibold">
                          {result.isAbsent ? "-" : `${result.percentage}%`}
                        </td>
                        <td className="p-2 border-b text-center">
                          {result.isAbsent ? (
                            <span className="px-2 py-1 rounded text-gray-500 bg-gray-100">غائب</span>
                          ) : (
                            <span className={`px-2 py-1 rounded ${level.color}`}>{level.label}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-4 border-t bg-muted/30">
          <Button variant="outline" onClick={onClose}>
            <X className="ml-2 h-4 w-4" />
            إلغاء
          </Button>
          <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
            <Save className="ml-2 h-4 w-4" />
            حفظ التعديلات
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TestResultsEditor;
