
import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Label } from "@/components/ui/label";
import { 
  classesData, 
  subjectsData,
  teachersData,
  getClassById,
  getSectionById,
  getSubjectById,
  getTeacherById
} from "@/data/mockData";

// Mock reports type
interface Report {
  id: string;
  testId: string;
  testName: string;
  className: string;
  sectionName: string;
  subjectName: string;
  teacherName: string;
  date: string;
  totalStudents: number;
  passedStudents: number;
  passRate: number;
}

interface ReportsTabProps {
  mockReports: Report[];
}

const ReportsTab = ({ mockReports }: ReportsTabProps) => {
  const navigate = useNavigate();
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  // Filter reports based on selections
  const filteredReports = mockReports.filter(report => {
    let matches = true;
    
    if (selectedClass && report.className !== selectedClass) {
      matches = false;
    }
    
    if (selectedTeacher && report.teacherName !== selectedTeacher) {
      matches = false;
    }
    
    if (selectedSubject && report.subjectName !== selectedSubject) {
      matches = false;
    }
    
    return matches;
  });

  // Handle report view
  const handleViewReport = (testId: string) => {
    navigate(`/reports/${testId}`);
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-green-500">
        <CardHeader className="bg-gradient-to-r from-green-100 to-white border-b border-green-500">
          <CardTitle>تصفية التقارير</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>الصف</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="اختر الصف" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">جميع الصفوف</SelectItem>
                  {classesData.map(cls => (
                    <SelectItem key={cls.id} value={cls.name}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>المعلم</Label>
              <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="اختر المعلم" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">جميع المعلمين</SelectItem>
                  {teachersData.map(teacher => (
                    <SelectItem key={teacher.id} value={teacher.name}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>المادة</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="اختر المادة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">جميع المواد</SelectItem>
                  {subjectsData.map(subject => (
                    <SelectItem key={subject.id} value={subject.name}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-2 border-red-500">
        <CardHeader className="bg-gradient-to-r from-red-100 to-white border-b border-red-500">
          <CardTitle>قائمة التقارير</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Table>
            <TableHeader className="bg-black">
              <TableRow>
                <TableHead className="text-white">اسم الاختبار</TableHead>
                <TableHead className="text-white">الصف</TableHead>
                <TableHead className="text-white">المادة</TableHead>
                <TableHead className="text-white">المعلم</TableHead>
                <TableHead className="text-white">التاريخ</TableHead>
                <TableHead className="text-center text-white">نسبة النجاح</TableHead>
                <TableHead className="text-white"></TableHead>
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {filteredReports.length > 0 ? (
                filteredReports.map(report => (
                  <TableRow key={report.id} className="hover:bg-green-50">
                    <TableCell className="font-medium">{report.testName}</TableCell>
                    <TableCell>{report.className} {report.sectionName}</TableCell>
                    <TableCell>{report.subjectName}</TableCell>
                    <TableCell>{report.teacherName}</TableCell>
                    <TableCell>{report.date}</TableCell>
                    <TableCell className="text-center">
                      <span className={`px-2 py-1 rounded-full text-white ${
                        report.passRate >= 70 ? 'bg-green-500' : 
                        report.passRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}>
                        {report.passRate}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewReport(report.testId)}
                      >
                        عرض التقرير
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">
                    لا توجد تقارير تطابق معايير التصفية المحددة
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsTab;
