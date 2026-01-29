-- Create storage bucket for payment screenshots
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-screenshots', 'payment-screenshots', false);

-- Storage policies for payment screenshots
CREATE POLICY "Users can upload their own payment screenshots"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-screenshots' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view their own payment screenshots"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all payment screenshots"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-screenshots' AND public.is_admin(auth.uid()));

-- Create MCQ questions table
CREATE TABLE public.mcq_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  certificate_id UUID NOT NULL REFERENCES public.certificates(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_option CHAR(1) NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mcq_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active questions"
ON public.mcq_questions FOR SELECT
USING (true);

CREATE POLICY "Admins can manage questions"
ON public.mcq_questions FOR ALL
USING (public.is_admin(auth.uid()));

-- Create test attempts table
CREATE TABLE public.test_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 10,
  passed BOOLEAN NOT NULL DEFAULT false,
  answers JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own test attempts"
ON public.test_attempts FOR SELECT
USING ((SELECT user_id FROM public.students WHERE id = student_id) = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Users can create test attempts"
ON public.test_attempts FOR INSERT
WITH CHECK ((SELECT user_id FROM public.students WHERE id = student_id) = auth.uid());

-- Add payment verification columns to students table
ALTER TABLE public.students 
ADD COLUMN transaction_id TEXT,
ADD COLUMN payment_screenshot_url TEXT,
ADD COLUMN payment_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN payment_verified_by UUID,
ADD COLUMN test_passed BOOLEAN DEFAULT false,
ADD COLUMN rejection_reason TEXT;

-- Update payment_status enum to include 'under_verification'
ALTER TYPE public.payment_status ADD VALUE IF NOT EXISTS 'under_verification';

-- Create admin credentials table
CREATE TABLE public.admin_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_credentials ENABLE ROW LEVEL SECURITY;

-- No direct access to admin credentials - only via edge function
CREATE POLICY "No direct access"
ON public.admin_credentials FOR SELECT
USING (false);

-- Create platform settings table for UPI ID etc.
CREATE TABLE public.platform_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view settings"
ON public.platform_settings FOR SELECT
USING (true);

CREATE POLICY "Admins can manage settings"
ON public.platform_settings FOR ALL
USING (public.is_admin(auth.uid()));

-- Insert default UPI ID (placeholder)
INSERT INTO public.platform_settings (setting_key, setting_value) 
VALUES ('upi_id', 'your-upi@bank');

-- Seed MCQ questions for each certificate domain
-- Web Development
INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What does HTML stand for?', 'Hyper Text Markup Language', 'High Tech Modern Language', 'Hyper Transfer Markup Language', 'Home Tool Markup Language', 'A'
FROM public.certificates WHERE course_name = 'Web Development';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'Which CSS property is used to change text color?', 'font-color', 'text-color', 'color', 'foreground-color', 'C'
FROM public.certificates WHERE course_name = 'Web Development';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What does CSS stand for?', 'Computer Style Sheets', 'Cascading Style Sheets', 'Creative Style System', 'Colorful Style Sheets', 'B'
FROM public.certificates WHERE course_name = 'Web Development';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'Which JavaScript method is used to select an element by ID?', 'getElement()', 'querySelector()', 'getElementById()', 'selectById()', 'C'
FROM public.certificates WHERE course_name = 'Web Development';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is React?', 'A database', 'A JavaScript library for building UIs', 'A programming language', 'A web server', 'B'
FROM public.certificates WHERE course_name = 'Web Development';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'Which tag is used for the largest heading in HTML?', '<h6>', '<heading>', '<h1>', '<head>', 'C'
FROM public.certificates WHERE course_name = 'Web Development';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What does DOM stand for?', 'Document Object Model', 'Data Object Management', 'Digital Ordinance Model', 'Desktop Object Model', 'A'
FROM public.certificates WHERE course_name = 'Web Development';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'Which HTTP method is used to submit form data?', 'GET', 'POST', 'PUT', 'SUBMIT', 'B'
FROM public.certificates WHERE course_name = 'Web Development';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is the purpose of the <meta> tag?', 'Define metadata about HTML document', 'Create a table', 'Add images', 'Create forms', 'A'
FROM public.certificates WHERE course_name = 'Web Development';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'Which property is used to add space inside an element in CSS?', 'margin', 'padding', 'spacing', 'border', 'B'
FROM public.certificates WHERE course_name = 'Web Development';

-- Python Programming
INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is Python?', 'A snake', 'A compiled language', 'An interpreted high-level language', 'A database', 'C'
FROM public.certificates WHERE course_name = 'Python Programming';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'Which keyword is used to define a function in Python?', 'function', 'def', 'func', 'define', 'B'
FROM public.certificates WHERE course_name = 'Python Programming';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is the output of print(2**3)?', '6', '8', '9', '5', 'B'
FROM public.certificates WHERE course_name = 'Python Programming';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'Which data type is mutable in Python?', 'tuple', 'string', 'list', 'int', 'C'
FROM public.certificates WHERE course_name = 'Python Programming';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What does len() function do?', 'Returns length of object', 'Creates a list', 'Prints output', 'Converts to integer', 'A'
FROM public.certificates WHERE course_name = 'Python Programming';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'Which loop is used to iterate over a sequence?', 'while', 'do-while', 'for', 'foreach', 'C'
FROM public.certificates WHERE course_name = 'Python Programming';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is pip in Python?', 'A text editor', 'Package installer', 'Python interpreter', 'Debugger', 'B'
FROM public.certificates WHERE course_name = 'Python Programming';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'Which symbol is used for comments in Python?', '//', '/*', '#', '--', 'C'
FROM public.certificates WHERE course_name = 'Python Programming';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is a dictionary in Python?', 'A book', 'Key-value pairs collection', 'An ordered list', 'A function', 'B'
FROM public.certificates WHERE course_name = 'Python Programming';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What does import statement do?', 'Exports data', 'Includes external modules', 'Prints data', 'Creates variables', 'B'
FROM public.certificates WHERE course_name = 'Python Programming';

-- Data Science
INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is Pandas used for?', 'Web development', 'Data manipulation and analysis', 'Machine learning only', 'Game development', 'B'
FROM public.certificates WHERE course_name = 'Data Science';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is a DataFrame?', 'A picture frame', '2D labeled data structure', 'A database', 'A function', 'B'
FROM public.certificates WHERE course_name = 'Data Science';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'Which library is commonly used for data visualization?', 'NumPy', 'Matplotlib', 'TensorFlow', 'Django', 'B'
FROM public.certificates WHERE course_name = 'Data Science';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What does EDA stand for?', 'Electronic Data Analysis', 'Exploratory Data Analysis', 'Extended Data Application', 'Easy Data Access', 'B'
FROM public.certificates WHERE course_name = 'Data Science';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is NumPy used for?', 'Web scraping', 'Numerical computing', 'Database management', 'API creation', 'B'
FROM public.certificates WHERE course_name = 'Data Science';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is a null value?', 'Zero', 'Missing or undefined data', 'Negative number', 'Empty string only', 'B'
FROM public.certificates WHERE course_name = 'Data Science';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'Which method is used to fill missing values in Pandas?', 'fill()', 'fillna()', 'replace_null()', 'complete()', 'B'
FROM public.certificates WHERE course_name = 'Data Science';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is correlation?', 'Relationship between variables', 'Data type', 'Function name', 'Error type', 'A'
FROM public.certificates WHERE course_name = 'Data Science';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is Jupyter Notebook?', 'A physical notebook', 'Interactive computing environment', 'Text editor', 'Database tool', 'B'
FROM public.certificates WHERE course_name = 'Data Science';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is feature engineering?', 'Building features in software', 'Creating new features from existing data', 'Designing UI', 'Testing code', 'B'
FROM public.certificates WHERE course_name = 'Data Science';

-- Artificial Intelligence
INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is Machine Learning?', 'Programming robots', 'Systems that learn from data', 'Manual coding', 'Database design', 'B'
FROM public.certificates WHERE course_name = 'Artificial Intelligence';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is a neural network?', 'Brain surgery technique', 'Computing system inspired by brain', 'Network cable', 'Social network', 'B'
FROM public.certificates WHERE course_name = 'Artificial Intelligence';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is deep learning?', 'Studying deeply', 'Subset of ML using neural networks', 'Ocean research', 'Database learning', 'B'
FROM public.certificates WHERE course_name = 'Artificial Intelligence';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What does NLP stand for?', 'New Learning Process', 'Natural Language Processing', 'Neural Link Protocol', 'Network Layer Protocol', 'B'
FROM public.certificates WHERE course_name = 'Artificial Intelligence';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is supervised learning?', 'Learning with labeled data', 'Self-learning', 'Unsupervised process', 'Random learning', 'A'
FROM public.certificates WHERE course_name = 'Artificial Intelligence';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is TensorFlow?', 'Physics term', 'Open-source ML framework', 'Database system', 'Operating system', 'B'
FROM public.certificates WHERE course_name = 'Artificial Intelligence';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is overfitting?', 'Model is too simple', 'Model fits training data too well', 'Model is fast', 'Model is accurate', 'B'
FROM public.certificates WHERE course_name = 'Artificial Intelligence';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is a training dataset?', 'Exercise data', 'Data used to train model', 'Test results', 'User data', 'B'
FROM public.certificates WHERE course_name = 'Artificial Intelligence';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is computer vision?', 'Screen resolution', 'AI field for image understanding', 'Graphics card', 'Display technology', 'B'
FROM public.certificates WHERE course_name = 'Artificial Intelligence';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is reinforcement learning?', 'Learning from rewards and penalties', 'Supervised learning type', 'Database method', 'Manual training', 'A'
FROM public.certificates WHERE course_name = 'Artificial Intelligence';

-- Mobile App Development
INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is React Native?', 'A game engine', 'Framework for mobile apps', 'Programming language', 'Database', 'B'
FROM public.certificates WHERE course_name = 'Mobile App Development';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What language is used for Android development?', 'Swift', 'Kotlin/Java', 'C#', 'Ruby', 'B'
FROM public.certificates WHERE course_name = 'Mobile App Development';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is iOS?', 'Android version', 'Apple mobile operating system', 'Web browser', 'Programming language', 'B'
FROM public.certificates WHERE course_name = 'Mobile App Development';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is an APK?', 'Apple Package', 'Android Package', 'Application Key', 'API Kit', 'B'
FROM public.certificates WHERE course_name = 'Mobile App Development';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is Flutter?', 'Animation tool', 'Googles UI toolkit for mobile', 'Database', 'Testing framework', 'B'
FROM public.certificates WHERE course_name = 'Mobile App Development';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is Swift used for?', 'Android development', 'iOS app development', 'Web development', 'Database design', 'B'
FROM public.certificates WHERE course_name = 'Mobile App Development';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is a widget in mobile development?', 'Hardware component', 'UI building block', 'Database table', 'API endpoint', 'B'
FROM public.certificates WHERE course_name = 'Mobile App Development';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What does SDK stand for?', 'Software Development Kit', 'System Design Key', 'Secure Data Kit', 'Simple Dev Key', 'A'
FROM public.certificates WHERE course_name = 'Mobile App Development';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is responsive design?', 'Fast loading', 'Adapts to different screen sizes', 'Colorful design', 'Animated design', 'B'
FROM public.certificates WHERE course_name = 'Mobile App Development';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is an emulator?', 'Real device', 'Software that simulates a device', 'Programming language', 'Design tool', 'B'
FROM public.certificates WHERE course_name = 'Mobile App Development';

-- Cloud Computing
INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is cloud computing?', 'Weather prediction', 'Delivery of computing services over internet', 'Local storage', 'Hardware manufacturing', 'B'
FROM public.certificates WHERE course_name = 'Cloud Computing';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is AWS?', 'A web browser', 'Amazon Web Services', 'Application Window System', 'Advanced Web Security', 'B'
FROM public.certificates WHERE course_name = 'Cloud Computing';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What does IaaS stand for?', 'Internet as a Service', 'Infrastructure as a Service', 'Integration as a Service', 'Information as a Service', 'B'
FROM public.certificates WHERE course_name = 'Cloud Computing';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is Docker?', 'Shipping company', 'Container platform', 'Cloud provider', 'Programming language', 'B'
FROM public.certificates WHERE course_name = 'Cloud Computing';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is Kubernetes?', 'Greek word', 'Container orchestration platform', 'Database', 'Security tool', 'B'
FROM public.certificates WHERE course_name = 'Cloud Computing';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is serverless computing?', 'No servers exist', 'Cloud provider manages servers', 'Offline computing', 'Local hosting', 'B'
FROM public.certificates WHERE course_name = 'Cloud Computing';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What does SaaS stand for?', 'Storage as a Service', 'Software as a Service', 'Security as a Service', 'System as a Service', 'B'
FROM public.certificates WHERE course_name = 'Cloud Computing';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is auto-scaling?', 'Automatic weight measurement', 'Automatic resource adjustment', 'Manual scaling', 'Fixed resources', 'B'
FROM public.certificates WHERE course_name = 'Cloud Computing';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is a virtual machine?', 'Physical computer', 'Software emulation of computer', 'Network device', 'Storage device', 'B'
FROM public.certificates WHERE course_name = 'Cloud Computing';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is load balancing?', 'Weight management', 'Distributing traffic across servers', 'Database backup', 'File compression', 'B'
FROM public.certificates WHERE course_name = 'Cloud Computing';

-- Cybersecurity
INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is encryption?', 'Data deletion', 'Converting data to unreadable format', 'Data backup', 'Data compression', 'B'
FROM public.certificates WHERE course_name = 'Cybersecurity';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is a firewall?', 'Physical wall', 'Network security system', 'Antivirus', 'Backup system', 'B'
FROM public.certificates WHERE course_name = 'Cybersecurity';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is phishing?', 'Fishing sport', 'Fraudulent attempt to obtain data', 'Network protocol', 'Encryption method', 'B'
FROM public.certificates WHERE course_name = 'Cybersecurity';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What does VPN stand for?', 'Very Private Network', 'Virtual Private Network', 'Virtual Public Network', 'Verified Private Network', 'B'
FROM public.certificates WHERE course_name = 'Cybersecurity';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is malware?', 'Good software', 'Malicious software', 'Network tool', 'Operating system', 'B'
FROM public.certificates WHERE course_name = 'Cybersecurity';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is two-factor authentication?', 'Single password', 'Two verification methods', 'No authentication', 'Biometric only', 'B'
FROM public.certificates WHERE course_name = 'Cybersecurity';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is SQL injection?', 'Database backup', 'Attack using malicious SQL code', 'Normal query', 'Database update', 'B'
FROM public.certificates WHERE course_name = 'Cybersecurity';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is a DDoS attack?', 'Single request', 'Overwhelming server with traffic', 'Data backup', 'Encryption', 'B'
FROM public.certificates WHERE course_name = 'Cybersecurity';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is SSL/TLS?', 'Programming language', 'Security protocols for internet', 'Database system', 'Operating system', 'B'
FROM public.certificates WHERE course_name = 'Cybersecurity';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is penetration testing?', 'Breaking things', 'Authorized security testing', 'Normal usage', 'Data backup', 'B'
FROM public.certificates WHERE course_name = 'Cybersecurity';

-- UI/UX Design
INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What does UX stand for?', 'User Xperience', 'User Experience', 'Universal Experience', 'Unique Experience', 'B'
FROM public.certificates WHERE course_name = 'UI/UX Design';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is a wireframe?', 'Wire structure', 'Basic visual guide of layout', 'Final design', 'Color palette', 'B'
FROM public.certificates WHERE course_name = 'UI/UX Design';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is a prototype?', 'Final product', 'Working model for testing', 'Wireframe', 'Color scheme', 'B'
FROM public.certificates WHERE course_name = 'UI/UX Design';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is Figma?', 'Programming language', 'Design and prototyping tool', 'Database', 'Text editor', 'B'
FROM public.certificates WHERE course_name = 'UI/UX Design';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is user research?', 'Code testing', 'Understanding user needs and behaviors', 'Database design', 'Server setup', 'B'
FROM public.certificates WHERE course_name = 'UI/UX Design';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is a persona?', 'Real user', 'Fictional user representation', 'Designer', 'Developer', 'B'
FROM public.certificates WHERE course_name = 'UI/UX Design';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is accessibility in design?', 'Easy to find', 'Usable by people with disabilities', 'Fast loading', 'Colorful design', 'B'
FROM public.certificates WHERE course_name = 'UI/UX Design';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is a color palette?', 'Painting tool', 'Set of colors used in design', 'Font collection', 'Icon set', 'B'
FROM public.certificates WHERE course_name = 'UI/UX Design';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is usability testing?', 'Code testing', 'Testing design with real users', 'Performance testing', 'Security testing', 'B'
FROM public.certificates WHERE course_name = 'UI/UX Design';

INSERT INTO public.mcq_questions (certificate_id, question, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is information architecture?', 'Building design', 'Organizing and structuring content', 'Server architecture', 'Database design', 'B'
FROM public.certificates WHERE course_name = 'UI/UX Design';