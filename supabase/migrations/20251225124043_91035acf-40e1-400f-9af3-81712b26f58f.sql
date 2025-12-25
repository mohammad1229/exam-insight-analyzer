-- Create teacher_sections table to assign sections to teachers
CREATE TABLE public.teacher_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(teacher_id, section_id)
);

-- Enable Row Level Security
ALTER TABLE public.teacher_sections ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for service role access
CREATE POLICY "Service role full access - teacher_sections" 
ON public.teacher_sections 
FOR ALL 
USING (auth.role() = 'service_role');

-- Add index for better query performance
CREATE INDEX idx_teacher_sections_teacher_id ON public.teacher_sections(teacher_id);
CREATE INDEX idx_teacher_sections_section_id ON public.teacher_sections(section_id);