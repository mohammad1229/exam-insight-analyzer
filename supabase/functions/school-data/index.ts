import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-school-admin-token, x-teacher-token",
};

// Helper function to check if password is bcrypt hashed
function isBcryptHash(hash: string): boolean {
  return hash.startsWith('$2a$') || hash.startsWith('$2b$');
}

// Helper function to verify password (supports legacy plain text during migration)
async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (isBcryptHash(storedHash)) {
    return await bcrypt.compare(password, storedHash);
  }
  // Legacy plain text comparison (will be removed after migration)
  console.warn('Legacy plain text password detected - migration needed');
  return password === storedHash;
}

// Helper function to hash password
async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, schoolId, data } = await req.json();
    console.log(`School data action: ${action} for school: ${schoolId}`);

    switch (action) {
      // ========== CLASSES ==========
      case "getClasses": {
        const { data: classes, error } = await supabase
          .from("classes")
          .select("*, sections(*)")
          .eq("school_id", schoolId)
          .order("display_order", { ascending: true });
        
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, data: classes }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "addClass": {
        const { data: newClass, error } = await supabase
          .from("classes")
          .insert({ school_id: schoolId, name: data.name, display_order: data.display_order || 0 })
          .select()
          .single();
        
        if (error) throw error;

        // Add default sections if provided
        if (data.sections && data.sections.length > 0) {
          const sectionsToInsert = data.sections.map((s: any, idx: number) => ({
            class_id: newClass.id,
            school_id: schoolId,
            name: s.name,
            display_order: idx
          }));
          await supabase.from("sections").insert(sectionsToInsert);
        }

        return new Response(JSON.stringify({ success: true, data: newClass }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "updateClass": {
        const { error } = await supabase
          .from("classes")
          .update({ name: data.name })
          .eq("id", data.id);
        
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "deleteClass": {
        const { error } = await supabase
          .from("classes")
          .delete()
          .eq("id", data.id);
        
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ========== SECTIONS ==========
      case "getSections": {
        const { data: sections, error } = await supabase
          .from("sections")
          .select("*")
          .eq("school_id", schoolId)
          .order("display_order", { ascending: true });
        
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, data: sections }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "addSection": {
        const { data: newSection, error } = await supabase
          .from("sections")
          .insert({ 
            class_id: data.class_id, 
            school_id: schoolId, 
            name: data.name,
            display_order: data.display_order || 0 
          })
          .select()
          .single();
        
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, data: newSection }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "deleteSection": {
        const { error } = await supabase
          .from("sections")
          .delete()
          .eq("id", data.id);
        
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ========== SUBJECTS ==========
      case "getSubjects": {
        const { data: subjects, error } = await supabase
          .from("subjects")
          .select("*")
          .eq("school_id", schoolId)
          .order("display_order", { ascending: true });
        
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, data: subjects }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "addSubject": {
        const { data: newSubject, error } = await supabase
          .from("subjects")
          .insert({ school_id: schoolId, name: data.name, display_order: data.display_order || 0 })
          .select()
          .single();
        
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, data: newSubject }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "updateSubject": {
        const { error } = await supabase
          .from("subjects")
          .update({ name: data.name })
          .eq("id", data.id);
        
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "deleteSubject": {
        const { error } = await supabase
          .from("subjects")
          .delete()
          .eq("id", data.id);
        
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ========== STUDENTS ==========
      case "getStudents": {
        const { data: students, error } = await supabase
          .from("students")
          .select("*, classes(name), sections(name)")
          .eq("school_id", schoolId)
          .order("name", { ascending: true });
        
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, data: students }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "addStudent": {
        const { data: newStudent, error } = await supabase
          .from("students")
          .insert({ 
            school_id: schoolId, 
            name: data.name, 
            class_id: data.class_id, 
            section_id: data.section_id,
            student_number: data.student_number 
          })
          .select()
          .single();
        
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, data: newStudent }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "updateStudent": {
        const { error } = await supabase
          .from("students")
          .update({ 
            name: data.name, 
            class_id: data.class_id, 
            section_id: data.section_id,
            student_number: data.student_number 
          })
          .eq("id", data.id);
        
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "deleteStudent": {
        const { error } = await supabase
          .from("students")
          .delete()
          .eq("id", data.id);
        
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "bulkAddStudents": {
        const studentsToInsert = data.students.map((s: any) => ({
          school_id: schoolId,
          name: s.name,
          class_id: s.class_id,
          section_id: s.section_id,
          student_number: s.student_number
        }));
        
        const { data: inserted, error } = await supabase
          .from("students")
          .insert(studentsToInsert)
          .select();
        
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, data: inserted }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ========== TEACHERS ==========
      case "getTeachers": {
        const { data: teachers, error } = await supabase
          .from("teachers")
          .select("*, teacher_subjects(subject_id, subjects(name)), teacher_classes(class_id, classes(name)), teacher_sections(section_id, sections(name, class_id))")
          .eq("school_id", schoolId)
          .order("name", { ascending: true });
        
        if (error) throw error;
        
        // Remove password_hash from response for security
        const sanitizedTeachers = teachers?.map(t => {
          const { password_hash, ...rest } = t;
          return rest;
        });
        
        return new Response(JSON.stringify({ success: true, data: sanitizedTeachers }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "addTeacher": {
        // Hash password with bcrypt
        const passwordHash = await hashPassword(data.password);
        
        const { data: newTeacher, error } = await supabase
          .from("teachers")
          .insert({ 
            school_id: schoolId, 
            name: data.name, 
            username: data.username,
            password_hash: passwordHash,
            email: data.email,
            phone: data.phone,
            role: data.role || 'teacher',
            must_change_password: data.must_change_password ?? true
          })
          .select()
          .single();
        
        if (error) throw error;

        // Add subject assignments
        if (data.subjects && data.subjects.length > 0) {
          const subjectAssignments = data.subjects.map((subjectId: string) => ({
            teacher_id: newTeacher.id,
            subject_id: subjectId
          }));
          await supabase.from("teacher_subjects").insert(subjectAssignments);
        }

        // Add class assignments
        if (data.classes && data.classes.length > 0) {
          const classAssignments = data.classes.map((classId: string) => ({
            teacher_id: newTeacher.id,
            class_id: classId
          }));
          await supabase.from("teacher_classes").insert(classAssignments);
        }

        // Add section assignments
        if (data.sections && data.sections.length > 0) {
          const sectionAssignments = data.sections.map((sectionId: string) => ({
            teacher_id: newTeacher.id,
            section_id: sectionId
          }));
          await supabase.from("teacher_sections").insert(sectionAssignments);
        }

        // Remove password_hash from response
        const { password_hash, ...sanitizedTeacher } = newTeacher;
        return new Response(JSON.stringify({ success: true, data: sanitizedTeacher }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "updateTeacher": {
        const updates: any = {
          name: data.name,
          username: data.username,
          email: data.email,
          phone: data.phone,
          role: data.role,
          is_active: data.is_active
        };
        
        if (data.password) {
          // Hash password with bcrypt
          updates.password_hash = await hashPassword(data.password);
        }
        
        if (data.must_change_password !== undefined) {
          updates.must_change_password = data.must_change_password;
        }
        
        const { error } = await supabase
          .from("teachers")
          .update(updates)
          .eq("id", data.id);
        
        if (error) throw error;

        // Update subject assignments
        if (data.subjects !== undefined) {
          await supabase.from("teacher_subjects").delete().eq("teacher_id", data.id);
          if (data.subjects.length > 0) {
            const subjectAssignments = data.subjects.map((subjectId: string) => ({
              teacher_id: data.id,
              subject_id: subjectId
            }));
            await supabase.from("teacher_subjects").insert(subjectAssignments);
          }
        }

        // Update class assignments
        if (data.classes !== undefined) {
          await supabase.from("teacher_classes").delete().eq("teacher_id", data.id);
          if (data.classes.length > 0) {
            const classAssignments = data.classes.map((classId: string) => ({
              teacher_id: data.id,
              class_id: classId
            }));
            await supabase.from("teacher_classes").insert(classAssignments);
          }
        }

        // Update section assignments
        if (data.sections !== undefined) {
          await supabase.from("teacher_sections").delete().eq("teacher_id", data.id);
          if (data.sections.length > 0) {
            const sectionAssignments = data.sections.map((sectionId: string) => ({
              teacher_id: data.id,
              section_id: sectionId
            }));
            await supabase.from("teacher_sections").insert(sectionAssignments);
          }
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "deleteTeacher": {
        const { error } = await supabase
          .from("teachers")
          .delete()
          .eq("id", data.id);
        
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "verifyTeacherLogin": {
        const { data: teacher, error } = await supabase
          .from("teachers")
          .select("*, teacher_subjects(subject_id), teacher_classes(class_id), teacher_sections(section_id)")
          .eq("school_id", schoolId)
          .eq("username", data.username)
          .eq("is_active", true)
          .maybeSingle();
        
        if (error) throw error;
        if (!teacher) {
          return new Response(JSON.stringify({ success: false, error: "اسم المستخدم أو كلمة المرور غير صحيحة" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Verify password using bcrypt (with legacy fallback)
        const isValid = await verifyPassword(data.password, teacher.password_hash);

        if (!isValid) {
          return new Response(JSON.stringify({ success: false, error: "اسم المستخدم أو كلمة المرور غير صحيحة" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Auto-migrate plain text password to bcrypt
        if (!isBcryptHash(teacher.password_hash)) {
          const hashedPassword = await hashPassword(data.password);
          await supabase
            .from("teachers")
            .update({ password_hash: hashedPassword })
            .eq("id", teacher.id);
          console.log(`Auto-migrated password for teacher: ${teacher.username}`);
        }

        // Update last login
        await supabase.from("teachers").update({ last_login_at: new Date().toISOString() }).eq("id", teacher.id);

        return new Response(JSON.stringify({ 
          success: true, 
          must_change_password: teacher.must_change_password,
          teacher: {
            id: teacher.id,
            name: teacher.name,
            username: teacher.username,
            email: teacher.email,
            phone: teacher.phone,
            role: teacher.role,
            subjects: teacher.teacher_subjects?.map((ts: any) => ts.subject_id) || [],
            classes: teacher.teacher_classes?.map((tc: any) => tc.class_id) || [],
            sections: teacher.teacher_sections?.map((ts: any) => ts.section_id) || []
          }
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ========== TESTS ==========
      case "getTests": {
        const { data: tests, error } = await supabase
          .from("tests")
          .select("*, teachers(name), subjects(name), classes(name), sections(name), test_results(*, students(name))")
          .eq("school_id", schoolId)
          .order("created_at", { ascending: false });
        
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, data: tests }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "addTest": {
        // Check for duplicate test (same teacher + subject + class + section + date + name)
        const { data: existingTest, error: checkError } = await supabase
          .from("tests")
          .select("id, name")
          .eq("school_id", schoolId)
          .eq("teacher_id", data.teacher_id)
          .eq("subject_id", data.subject_id)
          .eq("class_id", data.class_id)
          .eq("section_id", data.section_id)
          .eq("test_date", data.test_date || new Date().toISOString().split('T')[0])
          .eq("name", data.name)
          .maybeSingle();

        if (checkError) {
          console.error("Error checking for duplicate test:", checkError);
        }

        if (existingTest) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: `يوجد اختبار بنفس الاسم مسجل بالفعل: ${existingTest.name}`,
            existingTestId: existingTest.id 
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: newTest, error } = await supabase
          .from("tests")
          .insert({ 
            school_id: schoolId, 
            name: data.name, 
            subject_id: data.subject_id,
            class_id: data.class_id,
            section_id: data.section_id,
            teacher_id: data.teacher_id,
            test_type: data.test_type || 'quiz',
            questions: data.questions || [],
            test_date: data.test_date || new Date().toISOString().split('T')[0],
            notes: data.notes,
            is_draft: data.is_draft ?? true
          })
          .select()
          .single();
        
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, data: newTest }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "updateTest": {
        const { error } = await supabase
          .from("tests")
          .update({ 
            name: data.name, 
            subject_id: data.subject_id,
            class_id: data.class_id,
            section_id: data.section_id,
            test_type: data.test_type,
            questions: data.questions,
            test_date: data.test_date,
            notes: data.notes,
            is_draft: data.is_draft
          })
          .eq("id", data.id);
        
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "deleteTest": {
        // Delete test results first
        await supabase.from("test_results").delete().eq("test_id", data.id);
        
        const { error } = await supabase
          .from("tests")
          .delete()
          .eq("id", data.id);
        
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ========== TEST RESULTS ==========
      case "saveTestResults": {
        // First delete existing results for this test
        await supabase.from("test_results").delete().eq("test_id", data.testId);
        
        // Insert new results
        const resultsToInsert = data.results.map((r: any) => ({
          test_id: data.testId,
          student_id: r.student_id,
          scores: r.scores,
          total_score: r.total_score,
          percentage: r.percentage,
          is_absent: r.is_absent || false
        }));
        
        const { error } = await supabase.from("test_results").insert(resultsToInsert);
        
        if (error) throw error;

        // Update test to mark as not draft
        await supabase.from("tests").update({ is_draft: false }).eq("id", data.testId);
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ========== PERFORMANCE LEVELS ==========
      case "getPerformanceLevels": {
        const { data: levels, error } = await supabase
          .from("performance_levels")
          .select("*")
          .eq("school_id", schoolId)
          .order("display_order", { ascending: true });
        
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, data: levels }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "addPerformanceLevel": {
        const { data: newLevel, error } = await supabase
          .from("performance_levels")
          .insert({ 
            school_id: schoolId, 
            name: data.name, 
            min_score: data.min_score,
            max_score: data.max_score,
            color: data.color || '#3b82f6',
            display_order: data.display_order || 0
          })
          .select()
          .single();
        
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, data: newLevel }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "updatePerformanceLevel": {
        const { error } = await supabase
          .from("performance_levels")
          .update({ 
            name: data.name,
            min_score: data.min_score,
            max_score: data.max_score,
            color: data.color
          })
          .eq("id", data.id);
        
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "deletePerformanceLevel": {
        const { error } = await supabase
          .from("performance_levels")
          .delete()
          .eq("id", data.id);
        
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "bulkSavePerformanceLevels": {
        // Delete all existing levels for this school
        await supabase.from("performance_levels").delete().eq("school_id", schoolId);
        
        // Insert new levels
        const levelsToInsert = data.levels.map((l: any, idx: number) => ({
          school_id: schoolId,
          name: l.name,
          min_score: l.min_score,
          max_score: l.max_score,
          color: l.color || '#3b82f6',
          display_order: idx
        }));
        
        const { error } = await supabase.from("performance_levels").insert(levelsToInsert);
        
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ========== UPDATE SCHOOL ==========
      case "updateSchool": {
        const { error } = await supabase
          .from("schools")
          .update({
            name: data.name,
            director_name: data.director_name,
            logo_url: data.logo_url,
            phone: data.phone,
            email: data.email,
            address: data.address
          })
          .eq("id", schoolId);
        
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ========== GET SCHOOL ==========
      case "getSchool": {
        const { data: school, error } = await supabase
          .from("schools")
          .select("*")
          .eq("id", schoolId)
          .single();
        
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, data: school }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ========== VERIFY TEACHER LOGIN BY USERNAME ONLY ==========
      case "verifyTeacherLoginByUsername": {
        // Get the activated school ID from the request
        const activatedSchoolId = data.activatedSchoolId;
        
        // Search for teacher by username across all schools
        const { data: teacher, error } = await supabase
          .from("teachers")
          .select("*, teacher_subjects(subject_id), teacher_classes(class_id), teacher_sections(section_id)")
          .eq("username", data.username)
          .eq("is_active", true)
          .maybeSingle();
        
        if (error) throw error;
        if (!teacher) {
          return new Response(JSON.stringify({ success: false, error: "اسم المستخدم أو كلمة المرور غير صحيحة" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Verify password using bcrypt (with legacy fallback)
        const isValid = await verifyPassword(data.password, teacher.password_hash);

        if (!isValid) {
          return new Response(JSON.stringify({ success: false, error: "اسم المستخدم أو كلمة المرور غير صحيحة" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Auto-migrate plain text password to bcrypt
        if (!isBcryptHash(teacher.password_hash)) {
          const hashedPassword = await hashPassword(data.password);
          await supabase
            .from("teachers")
            .update({ password_hash: hashedPassword })
            .eq("id", teacher.id);
          console.log(`Auto-migrated password for teacher: ${teacher.username}`);
        }

        // SECURITY CHECK: Verify teacher's school matches the activated school on this device
        if (activatedSchoolId && teacher.school_id !== activatedSchoolId) {
          console.log(`Security: Teacher ${data.username} from school ${teacher.school_id} tried to login on device with school ${activatedSchoolId}`);
          return new Response(JSON.stringify({ 
            success: false, 
            error: "لا يمكنك تسجيل الدخول على هذا الجهاز - أنت مسجل في مدرسة أخرى" 
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Get the school's license to verify it's active
        const { data: school, error: schoolError } = await supabase
          .from("schools")
          .select("id, name")
          .eq("id", teacher.school_id)
          .single();
        
        if (schoolError || !school) {
          return new Response(JSON.stringify({ success: false, error: "المدرسة غير موجودة" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Check if there's an active license for this school
        const { data: license, error: licenseError } = await supabase
          .from("licenses")
          .select("id, is_active, expiry_date, is_trial, trial_days, trial_start_date")
          .eq("school_id", teacher.school_id)
          .eq("is_active", true)
          .maybeSingle();
        
        if (licenseError) {
          console.error("Error checking license:", licenseError);
        }
        
        // Verify license is valid
        if (!license) {
          return new Response(JSON.stringify({ success: false, error: "ترخيص المدرسة غير مفعل - تواصل مع مدير النظام" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Check if license is expired
        if (license.is_trial) {
          const trialStart = new Date(license.trial_start_date);
          const trialDays = license.trial_days || 15;
          const trialEnd = new Date(trialStart.getTime() + trialDays * 24 * 60 * 60 * 1000);
          if (new Date() > trialEnd) {
            return new Response(JSON.stringify({ success: false, error: "انتهت الفترة التجريبية - يرجى تفعيل الترخيص" }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        } else if (license.expiry_date && new Date(license.expiry_date) < new Date()) {
          return new Response(JSON.stringify({ success: false, error: "انتهت صلاحية الترخيص - تواصل مع مدير النظام" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Update last login
        await supabase.from("teachers").update({ last_login_at: new Date().toISOString() }).eq("id", teacher.id);

        return new Response(JSON.stringify({ 
          success: true, 
          must_change_password: teacher.must_change_password,
          teacher: {
            id: teacher.id,
            name: teacher.name,
            username: teacher.username,
            email: teacher.email,
            phone: teacher.phone,
            role: teacher.role,
            school_id: teacher.school_id,
            license_id: license.id,
            subjects: teacher.teacher_subjects?.map((ts: any) => ts.subject_id) || [],
            classes: teacher.teacher_classes?.map((tc: any) => tc.class_id) || [],
            sections: teacher.teacher_sections?.map((ts: any) => ts.section_id) || []
          }
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ========== INITIALIZE SCHOOL DATA ==========
      case "initializeSchoolData": {
        // Add default classes with sections
        const defaultClasses = [
          { name: "الصف الأول", sections: ["أ", "ب"] },
          { name: "الصف الثاني", sections: ["أ", "ب"] },
          { name: "الصف الثالث", sections: ["أ", "ب"] },
          { name: "الصف الرابع", sections: ["أ", "ب"] },
          { name: "الصف الخامس", sections: ["أ", "ب"] },
          { name: "الصف السادس", sections: ["أ", "ب"] },
          { name: "الصف السابع", sections: ["أ", "ب"] },
          { name: "الصف الثامن", sections: ["أ", "ب"] },
          { name: "الصف التاسع", sections: ["أ", "ب"] },
          { name: "الصف العاشر", sections: ["أ", "ب"] },
        ];

        for (let i = 0; i < defaultClasses.length; i++) {
          const { data: newClass } = await supabase
            .from("classes")
            .insert({ school_id: schoolId, name: defaultClasses[i].name, display_order: i })
            .select()
            .single();

          if (newClass) {
            const sectionsToInsert = defaultClasses[i].sections.map((s, idx) => ({
              class_id: newClass.id,
              school_id: schoolId,
              name: s,
              display_order: idx
            }));
            await supabase.from("sections").insert(sectionsToInsert);
          }
        }

        // Add default subjects
        const defaultSubjects = [
          "الرياضيات", "العلوم", "اللغة العربية", "اللغة الإنجليزية",
          "التربية الإسلامية", "الدراسات الاجتماعية", "التربية الوطنية", "الحاسوب"
        ];

        const subjectsToInsert = defaultSubjects.map((name, idx) => ({
          school_id: schoolId,
          name,
          display_order: idx
        }));
        await supabase.from("subjects").insert(subjectsToInsert);

        // Add default performance levels
        const defaultLevels = [
          { name: "متفوق", min_score: 90, max_score: 100, color: "#22c55e" },
          { name: "جيد جداً", min_score: 80, max_score: 89, color: "#3b82f6" },
          { name: "جيد", min_score: 70, max_score: 79, color: "#eab308" },
          { name: "مقبول", min_score: 60, max_score: 69, color: "#f97316" },
          { name: "ضعيف", min_score: 50, max_score: 59, color: "#ef4444" },
          { name: "راسب", min_score: 0, max_score: 49, color: "#991b1b" },
        ];

        const levelsToInsert = defaultLevels.map((l, idx) => ({
          school_id: schoolId,
          ...l,
          display_order: idx
        }));
        await supabase.from("performance_levels").insert(levelsToInsert);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ========== CHANGE TEACHER PASSWORD ==========
      case "changeTeacherPassword": {
        const { data: teacher, error: fetchError } = await supabase
          .from("teachers")
          .select("id, password_hash")
          .eq("id", data.teacherId)
          .maybeSingle();
        
        if (fetchError) throw fetchError;
        if (!teacher) {
          return new Response(JSON.stringify({ success: false, error: "المعلم غير موجود" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Verify current password if not forced
        if (!data.isForced && data.currentPassword) {
          const isValid = await verifyPassword(data.currentPassword, teacher.password_hash);
          if (!isValid) {
            return new Response(JSON.stringify({ success: false, error: "كلمة المرور الحالية غير صحيحة" }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }

        // Hash new password with bcrypt
        const hashedPassword = await hashPassword(data.newPassword);
        
        const { error: updateError } = await supabase
          .from("teachers")
          .update({ 
            password_hash: hashedPassword,
            must_change_password: false
          })
          .eq("id", data.teacherId);
        
        if (updateError) throw updateError;
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ success: false, error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error: any) {
    console.error("School data error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
