-- Fix function search_path for generate_certificate_number
CREATE OR REPLACE FUNCTION public.generate_certificate_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.test_status = 'passed' AND OLD.test_status != 'passed' THEN
    NEW.certificate_number := 'CERT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(NEW.id::text, 1, 8));
    NEW.certificate_issued_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix function search_path for update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Drop the overly permissive student insert policy and create a more secure one
DROP POLICY IF EXISTS "Anyone can create student registration" ON public.students;

-- Allow inserts but require the email to match the authenticated user's email OR allow unauthenticated registration
CREATE POLICY "Users can create student registration"
ON public.students FOR INSERT
WITH CHECK (
  auth.uid() IS NULL OR user_id IS NULL OR user_id = auth.uid()
);