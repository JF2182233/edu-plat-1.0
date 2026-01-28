-- Add module access control table
CREATE TABLE IF NOT EXISTS public.module_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (module_id, user_id)
);

ALTER TABLE public.module_access ENABLE ROW LEVEL SECURITY;

-- Function to determine whether a user can access a module
CREATE OR REPLACE FUNCTION public.user_can_access_module(
  p_user_id UUID,
  p_module_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(p_user_id, 'admin')
    OR (
      EXISTS (
        SELECT 1
        FROM public.modules
        WHERE id = p_module_id
          AND is_published = true
      )
      AND (
        NOT EXISTS (
          SELECT 1
          FROM public.module_access
          WHERE module_id = p_module_id
        )
        OR EXISTS (
          SELECT 1
          FROM public.module_access
          WHERE module_id = p_module_id
            AND user_id = p_user_id
        )
      )
    );
$$;

-- Policies for module_access
DROP POLICY IF EXISTS "Admins can manage module access" ON public.module_access;
CREATE POLICY "Admins can manage module access"
  ON public.module_access FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Update modules policies to respect access control
DROP POLICY IF EXISTS "Anyone logged in can view published modules" ON public.modules;
CREATE POLICY "Users can view accessible modules"
  ON public.modules FOR SELECT
  TO authenticated
  USING (public.user_can_access_module(auth.uid(), id));

-- Update questions policy to respect module access
DROP POLICY IF EXISTS "Anyone logged in can view questions for published modules" ON public.questions;
CREATE POLICY "Users can view questions for accessible modules"
  ON public.questions FOR SELECT
  TO authenticated
  USING (public.user_can_access_module(auth.uid(), module_id));

-- Update quiz-related functions to respect module access
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
  IF NOT public.user_can_access_module(auth.uid(), p_module_id) THEN
    RAISE EXCEPTION 'Module not found or not accessible';
  END IF;

  RETURN QUERY
  SELECT q.id, q.question_text, q.options, q.sort_order
  FROM questions q
  WHERE q.module_id = p_module_id
  ORDER BY q.sort_order;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_quiz_answers(
  p_module_id UUID,
  p_answers JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_score INTEGER := 0;
  v_total INTEGER;
  v_percentage INTEGER;
  v_question RECORD;
  v_user_answer INTEGER;
  v_current_attempts INTEGER;
  v_current_best INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.user_can_access_module(auth.uid(), p_module_id) THEN
    RAISE EXCEPTION 'Module not found or not accessible';
  END IF;

  SELECT COALESCE(quiz_attempts, 0), COALESCE(best_score, 0) 
  INTO v_current_attempts, v_current_best
  FROM user_progress
  WHERE user_id = auth.uid() AND module_id = p_module_id;

  IF v_current_attempts >= 2 THEN
    RAISE EXCEPTION 'Maximum quiz attempts reached';
  END IF;

  SELECT COUNT(*) INTO v_total 
  FROM questions 
  WHERE module_id = p_module_id;

  IF v_total = 0 THEN
    RAISE EXCEPTION 'No questions found for this module';
  END IF;

  FOR v_question IN 
    SELECT id, correct_index 
    FROM questions 
    WHERE module_id = p_module_id
  LOOP
    v_user_answer := (p_answers->>v_question.id::text)::INTEGER;
    IF v_user_answer IS NOT NULL AND v_user_answer = v_question.correct_index THEN
      v_score := v_score + 1;
    END IF;
  END LOOP;

  v_percentage := ROUND((v_score::NUMERIC / v_total) * 100);

  INSERT INTO user_progress (
    user_id, module_id, quiz_attempts, 
    latest_score, best_score, completed_at
  )
  VALUES (
    auth.uid(), 
    p_module_id,
    1,
    v_percentage,
    v_percentage,
    NOW()
  )
  ON CONFLICT (user_id, module_id) DO UPDATE
  SET 
    quiz_attempts = user_progress.quiz_attempts + 1,
    latest_score = v_percentage,
    best_score = GREATEST(user_progress.best_score, v_percentage),
    completed_at = NOW(),
    updated_at = NOW();

  RETURN jsonb_build_object(
    'score', v_score,
    'total', v_total,
    'percentage', v_percentage,
    'best_score', GREATEST(COALESCE(v_current_best, 0), v_percentage)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_quiz_results(p_module_id UUID)
RETURNS TABLE (
  question_id UUID,
  question_text TEXT,
  options JSONB,
  correct_index INTEGER,
  explanation TEXT,
  sort_order INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') AND NOT public.user_can_access_module(auth.uid(), p_module_id) THEN
    RAISE EXCEPTION 'Module not found or not accessible';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM user_progress 
    WHERE user_id = auth.uid() 
    AND module_id = p_module_id 
    AND completed_at IS NOT NULL
  ) THEN
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Quiz not completed yet';
    END IF;
  END IF;

  RETURN QUERY
  SELECT q.id, q.question_text, q.options, q.correct_index, q.explanation, q.sort_order
  FROM questions q
  WHERE q.module_id = p_module_id
  ORDER BY q.sort_order;
END;
$$;

GRANT EXECUTE ON FUNCTION public.user_can_access_module(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_quiz_questions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_quiz_answers(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_quiz_results(UUID) TO authenticated;
