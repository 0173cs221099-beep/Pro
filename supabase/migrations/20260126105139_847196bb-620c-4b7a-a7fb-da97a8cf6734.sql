-- Create enum for branches
CREATE TYPE public.branch_type AS ENUM ('CSE', 'IT', 'ECE', 'EEE', 'ME', 'CE', 'Other');

-- Create enum for year
CREATE TYPE public.year_type AS ENUM ('1st Year', '2nd Year', '3rd Year', '4th Year');

-- Create enum for payment status
CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Create enum for test status
CREATE TYPE public.test_status AS ENUM ('not_started', 'in_progress', 'passed', 'failed');

-- Certificates table (courses available)
CREATE TABLE public.certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT DEFAULT 'award',
  duration TEXT DEFAULT '30 minutes',
  total_questions INTEGER NOT NULL DEFAULT 10,
  passing_marks INTEGER NOT NULL DEFAULT 5,
  price INTEGER NOT NULL DEFAULT 110,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- MCQ Questions table
CREATE TABLE public.mcq_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  certificate_id UUID NOT NULL REFERENCES public.certificates(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Students table (registration data)
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  mobile TEXT NOT NULL,
  college_name TEXT NOT NULL,
  branch branch_type NOT NULL,
  year year_type NOT NULL,
  certificate_id UUID NOT NULL REFERENCES public.certificates(id),
  payment_status payment_status NOT NULL DEFAULT 'pending',
  payment_id TEXT,
  test_status test_status NOT NULL DEFAULT 'not_started',
  test_score INTEGER,
  test_completed_at TIMESTAMP WITH TIME ZONE,
  certificate_number TEXT UNIQUE,
  certificate_issued_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Test attempts table (to track answers)
CREATE TABLE public.test_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.mcq_questions(id) ON DELETE CASCADE,
  selected_answer TEXT CHECK (selected_answer IN ('A', 'B', 'C', 'D')),
  is_correct BOOLEAN,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Admin users table (for role management)
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcq_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for checking admin role
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  )
$$;

-- Certificates policies (public read, admin write)
CREATE POLICY "Certificates are publicly viewable"
ON public.certificates FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage certificates"
ON public.certificates FOR ALL
USING (public.is_admin(auth.uid()));

-- MCQ Questions policies (only visible during test or admin)
CREATE POLICY "MCQ questions viewable during test"
ON public.mcq_questions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.user_id = auth.uid()
      AND s.certificate_id = certificate_id
      AND s.payment_status = 'completed'
      AND s.test_status IN ('not_started', 'in_progress')
  )
  OR public.is_admin(auth.uid())
);

CREATE POLICY "Admins can manage MCQ questions"
ON public.mcq_questions FOR ALL
USING (public.is_admin(auth.uid()));

-- Students policies
CREATE POLICY "Students can view their own records"
ON public.students FOR SELECT
USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Anyone can create student registration"
ON public.students FOR INSERT
WITH CHECK (true);

CREATE POLICY "Students can update their own records"
ON public.students FOR UPDATE
USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete students"
ON public.students FOR DELETE
USING (public.is_admin(auth.uid()));

-- Test attempts policies
CREATE POLICY "Students can view their own attempts"
ON public.test_attempts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = student_id AND s.user_id = auth.uid()
  )
  OR public.is_admin(auth.uid())
);

CREATE POLICY "Students can create their own attempts"
ON public.test_attempts FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = student_id 
      AND s.user_id = auth.uid()
      AND s.payment_status = 'completed'
      AND s.test_status IN ('not_started', 'in_progress')
  )
);

-- User roles policies
CREATE POLICY "Users can view their own role"
ON public.user_roles FOR SELECT
USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
USING (public.is_admin(auth.uid()));

-- Function to generate certificate number
CREATE OR REPLACE FUNCTION public.generate_certificate_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.test_status = 'passed' AND OLD.test_status != 'passed' THEN
    NEW.certificate_number := 'CERT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(NEW.id::text, 1, 8));
    NEW.certificate_issued_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for certificate number generation
CREATE TRIGGER generate_cert_number
BEFORE UPDATE ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.generate_certificate_number();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_certificates_updated_at
BEFORE UPDATE ON public.certificates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_students_updated_at
BEFORE UPDATE ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample certificates
INSERT INTO public.certificates (course_name, description, icon) VALUES
('Web Development', 'Master HTML, CSS, JavaScript and modern frameworks', 'code'),
('Python Programming', 'Learn Python fundamentals and advanced concepts', 'terminal'),
('Data Science', 'Analyze data and build predictive models', 'bar-chart'),
('AI & Machine Learning', 'Explore artificial intelligence and ML algorithms', 'brain'),
('Java Programming', 'Object-oriented programming with Java', 'coffee'),
('Cloud Computing', 'AWS, Azure and cloud infrastructure', 'cloud');

-- Insert sample MCQ questions for Web Development
INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_answer)
SELECT 
  c.id,
  q.question,
  q.option_a,
  q.option_b,
  q.option_c,
  q.option_d,
  q.correct_answer
FROM public.certificates c
CROSS JOIN (VALUES
  ('What does HTML stand for?', 'Hyper Text Markup Language', 'High Tech Modern Language', 'Hyper Transfer Markup Language', 'Home Tool Markup Language', 'A'),
  ('Which CSS property is used to change text color?', 'font-color', 'text-color', 'color', 'foreground', 'C'),
  ('What is the correct JavaScript syntax to change content?', 'document.getElement("p")', 'document.getElementById("demo").innerHTML', '#demo.innerHTML', 'document.getElementByName("p")', 'B'),
  ('Which HTML element is used for the largest heading?', '<h6>', '<heading>', '<h1>', '<head>', 'C'),
  ('What does CSS stand for?', 'Computer Style Sheets', 'Cascading Style Sheets', 'Creative Style Sheets', 'Colorful Style Sheets', 'B'),
  ('Which property is used to change background color?', 'color', 'bgcolor', 'background-color', 'background', 'C'),
  ('Which HTML tag is used to define an internal style sheet?', '<style>', '<script>', '<css>', '<styles>', 'A'),
  ('Which operator is used for strict equality in JavaScript?', '==', '===', '=', '!=', 'B'),
  ('What is the default display value of a div element?', 'inline', 'block', 'flex', 'grid', 'B'),
  ('Which method adds an element at the end of an array?', 'push()', 'pop()', 'shift()', 'unshift()', 'A')
) AS q(question, option_a, option_b, option_c, option_d, correct_answer)
WHERE c.course_name = 'Web Development';

-- Insert sample MCQ questions for Python
INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_answer)
SELECT 
  c.id,
  q.question,
  q.option_a,
  q.option_b,
  q.option_c,
  q.option_d,
  q.correct_answer
FROM public.certificates c
CROSS JOIN (VALUES
  ('What is the output of print(2 ** 3)?', '6', '8', '9', '5', 'B'),
  ('Which keyword is used to define a function in Python?', 'function', 'def', 'func', 'define', 'B'),
  ('What is the correct file extension for Python files?', '.python', '.pt', '.py', '.pyt', 'C'),
  ('Which data type is used to store True or False?', 'string', 'int', 'bool', 'float', 'C'),
  ('What does len() function do?', 'Returns the length', 'Returns the type', 'Returns the sum', 'Returns the max', 'A'),
  ('Which symbol is used for comments in Python?', '//', '/*', '#', '--', 'C'),
  ('What is the output of print("Hello"[0])?', 'Hello', 'H', 'e', 'Error', 'B'),
  ('Which method is used to remove whitespace from a string?', 'trim()', 'strip()', 'clean()', 'remove()', 'B'),
  ('What is a list in Python?', 'Immutable sequence', 'Mutable sequence', 'Dictionary', 'Set', 'B'),
  ('Which loop is used for iteration in Python?', 'foreach', 'for', 'loop', 'iterate', 'B')
) AS q(question, option_a, option_b, option_c, option_d, correct_answer)
WHERE c.course_name = 'Python Programming';