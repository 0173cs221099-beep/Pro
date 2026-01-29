-- First delete all dependent data
DELETE FROM public.test_attempts;
DELETE FROM public.students;

-- Now drop test-related tables
DROP TABLE IF EXISTS public.test_attempts;
DROP TABLE IF EXISTS public.mcq_questions;

-- Drop the old trigger
DROP TRIGGER IF EXISTS generate_cert_number ON public.students;

-- Drop test_status enum usage from students
ALTER TABLE public.students DROP COLUMN IF EXISTS test_status;
ALTER TABLE public.students DROP COLUMN IF EXISTS test_score;
ALTER TABLE public.students DROP COLUMN IF EXISTS test_completed_at;

-- Add new columns for internship
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS internship_domain TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS completion_date TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Drop test_status enum type
DROP TYPE IF EXISTS public.test_status;

-- Update the certificate generation function to trigger on payment completion
CREATE OR REPLACE FUNCTION public.generate_certificate_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'completed' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'completed') THEN
    NEW.certificate_number := 'CERT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(NEW.id::text, 1, 8));
    NEW.certificate_issued_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate the trigger
CREATE TRIGGER generate_cert_number
BEFORE UPDATE ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.generate_certificate_number();

-- Update certificates table - remove test-related columns
ALTER TABLE public.certificates DROP COLUMN IF EXISTS total_questions;
ALTER TABLE public.certificates DROP COLUMN IF EXISTS passing_marks;
ALTER TABLE public.certificates DROP COLUMN IF EXISTS duration;

-- Clear and add internship domains
DELETE FROM public.certificates;

INSERT INTO public.certificates (course_name, description, icon, price, is_active) VALUES
('Web Development', 'Full-stack web development internship with React, Node.js, and databases', 'code', 110, true),
('Python Programming', 'Python development internship covering automation, scripting, and data processing', 'terminal', 110, true),
('Data Science', 'Data science internship with machine learning and analytics', 'bar-chart', 110, true),
('Artificial Intelligence', 'AI & ML internship covering neural networks and deep learning', 'brain', 110, true),
('Mobile App Development', 'Android and iOS app development internship', 'smartphone', 110, true),
('Cloud Computing', 'Cloud infrastructure and DevOps internship', 'cloud', 110, true),
('Cybersecurity', 'Cybersecurity and ethical hacking internship', 'shield', 110, true),
('UI/UX Design', 'User interface and experience design internship', 'palette', 110, true);