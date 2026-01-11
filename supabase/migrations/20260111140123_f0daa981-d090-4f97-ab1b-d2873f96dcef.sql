-- Drop the security definer view and use a simpler approach
DROP VIEW IF EXISTS public.questions_for_quiz;

-- Create a function to get quiz questions without answers (safer approach)
CREATE OR REPLACE FUNCTION public.get_quiz_questions(p_module_id UUID)
RETURNS TABLE (
  id UUID,
  question_text TEXT,
  options JSONB,
  sort_order INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify module is published
  IF NOT EXISTS (
    SELECT 1 FROM modules 
    WHERE modules.id = p_module_id AND is_published = true
  ) THEN
    -- Allow admins to see unpublished module questions
    IF NOT has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Module not found or not published';
    END IF;
  END IF;

  RETURN QUERY
  SELECT q.id, q.question_text, q.options, q.sort_order
  FROM questions q
  WHERE q.module_id = p_module_id
  ORDER BY q.sort_order;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_quiz_questions TO authenticated;