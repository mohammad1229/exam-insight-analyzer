
import { useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import QuestionAnalysis from "@/components/QuestionAnalysis";
import ReportGenerator from "@/components/ReportGenerator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  testsData, 
  classesData, 
  subjectsData,
  getClassById,
  getSectionById,
  getSubjectById,
  getTeacherById,
  getStudentById
} from "@/data/mockData";

const Reports = () => {
  const { testId } = useParams();
  const [selectedTestId, setSelectedTestId] = useState(testId || testsData[0]?.id || "");
  
  const selectedTest = testsData.find(test => test.id === selectedTestId);
  
  // Extract related data
  const classObj = selectedTest ? getClassById(selectedTest.classId) : null;
  const section = selectedTest ? getSectionById(selectedTest.classId, selectedTest.sectionId) : null;
  const subject = selectedTest ? getSubjectById(selectedTest.subjectId) : null;
  const teacher = selectedTest ? getTeacherById(selectedTest.teacherId) : null;

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-white to-green-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto p-6 dir-rtl">
          <div className="mb-8 pb-4 border-b-2 border-red-500">
            <h1 className="text-3xl font-bold text-black">تقارير الاختبارات</h1>
            <p className="text-muted-foreground">عرض وتحليل نتائج الاختبارات وإنشاء التقارير</p>
          </div>

          <div className="mb-8 flex items-center gap-4">
            <h2 className="text-lg font-semibold">اختر الاختبار:</h2>
            <Select value={selectedTestId} onValueChange={setSelectedTestId}>
              <SelectTrigger className="w-72 border-black">
                <SelectValue placeholder="اختر الاختبار" />
              </SelectTrigger>
              <SelectContent>
                {testsData.map(test => (
                  <SelectItem key={test.id} value={test.id}>
                    {test.name} - {getSubjectById(test.subjectId)?.name || ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTest ? (
            <div className="space-y-8">
              <Card className="border-2 border-green-500 shadow-lg bg-white">
                <CardHeader className="bg-gradient-to-r from-green-100 to-white border-b border-green-500">
                  <CardTitle className="text-black">بيانات الاختبار</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">اسم الاختبار</p>
                      <p className="font-medium">{selectedTest.name}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">نوع الاختبار</p>
                      <p className="font-medium">{selectedTest.type}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">المادة</p>
                      <p className="font-medium">{subject?.name || ''}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">المعلم</p>
                      <p className="font-medium">{teacher?.name || ''}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">الصف</p>
                      <p className="font-medium">{classObj?.name || ''} {section?.name || ''}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">تاريخ الاختبار</p>
                      <p className="font-medium">{selectedTest.date}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1">
                  <ReportGenerator test={selectedTest} />
                </div>
                
                <div className="lg:col-span-3">
                  <Card className="border-2 border-red-500 shadow-lg bg-white">
                    <CardHeader className="bg-gradient-to-r from-red-100 to-white border-b border-red-500">
                      <CardTitle className="text-black">نتائج الطلاب</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader className="bg-black">
                          <TableRow>
                            <TableHead className="text-right text-white">اسم الطالب</TableHead>
                            <TableHead className="text-right text-white">الحالة</TableHead>
                            <TableHead className="text-right text-white">العلامة النهائية</TableHead>
                            <TableHead className="text-right text-white">النسبة المئوية</TableHead>
                            <TableHead className="text-right text-white">النتيجة</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedTest.results.map(result => {
                            const student = getStudentById(result.studentId);
                            
                            return (
                              <TableRow key={result.id} className="hover:bg-green-50">
                                <TableCell className="font-medium">{student?.name || ''}</TableCell>
                                <TableCell>{result.isAbsent ? 'غائب' : 'حاضر'}</TableCell>
                                <TableCell>
                                  {result.isAbsent ? '-' : result.totalScore}
                                </TableCell>
                                <TableCell>
                                  {result.isAbsent ? '-' : `${result.percentage}%`}
                                </TableCell>
                                <TableCell>
                                  {result.isAbsent ? '-' : (
                                    result.percentage >= 50 ? 
                                      <span className="text-green-600 font-medium">ناجح</span> : 
                                      <span className="text-red-600 font-medium">راسب</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Card className="border-2 border-black shadow-lg bg-white">
                <CardHeader className="bg-gradient-to-r from-gray-100 to-white border-b border-black">
                  <CardTitle className="text-black">تحليل الأسئلة</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <QuestionAnalysis 
                    results={selectedTest.results} 
                    questions={selectedTest.questions}
                  />
                  
                  <div className="mt-8 bg-green-50 p-4 rounded-lg border-2 border-green-500">
                    <h3 className="text-lg font-bold mb-4 text-black">جدول تلخيص النتائج</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="bg-white p-4 rounded-lg shadow text-center border border-green-500">
                        <p className="text-sm text-gray-600">إجمالي الطلاب</p>
                        <p className="text-2xl font-bold text-black">
                          {selectedTest.results.filter(r => !r.isAbsent).length}
                        </p>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow text-center border border-green-500">
                        <p className="text-sm text-gray-600">عدد الناجحين</p>
                        <p className="text-2xl font-bold text-green-600">
                          {selectedTest.results.filter(r => !r.isAbsent && r.percentage >= 50).length}
                        </p>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow text-center border border-green-500">
                        <p className="text-sm text-gray-600">عدد الراسبين</p>
                        <p className="text-2xl font-bold text-red-600">
                          {selectedTest.results.filter(r => !r.isAbsent && r.percentage < 50).length}
                        </p>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow text-center border border-green-500">
                        <p className="text-sm text-gray-600">نسبة النجاح</p>
                        {(() => {
                          const present = selectedTest.results.filter(r => !r.isAbsent).length;
                          const passed = selectedTest.results.filter(r => !r.isAbsent && r.percentage >= 50).length;
                          const rate = present > 0 ? Math.round((passed / present) * 100) : 0;
                          return (
                            <p className={`text-2xl font-bold ${rate >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                              {rate}%
                            </p>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {selectedTest.notes && (
                <Card className="border-2 border-green-500 shadow-lg bg-white">
                  <CardHeader className="bg-gradient-to-r from-green-100 to-white border-b border-green-500">
                    <CardTitle className="text-black">ملاحظات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{selectedTest.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center py-12 bg-white p-8 rounded-lg border-2 border-green-500 shadow-lg">
              <h3 className="text-xl font-semibold mb-2 text-black">لا يوجد اختبار محدد</h3>
              <p className="text-muted-foreground">الرجاء اختيار اختبار من القائمة</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Reports;

