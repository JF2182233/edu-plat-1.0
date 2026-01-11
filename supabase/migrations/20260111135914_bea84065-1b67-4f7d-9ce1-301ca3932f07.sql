-- 1. Create a secure function to submit and validate quiz answers server-side
CREATE OR REPLACE FUNCTION public.submit_quiz_answers(
  p_module_id UUID,
  p_answers JSONB  -- Format: {"question_id": answer_index}
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
  -- Verify user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify user has access to this module
  IF NOT EXISTS (
    SELECT 1 FROM modules 
    WHERE id = p_module_id AND is_published = true
  ) THEN
    RAISE EXCEPTION 'Module not found or not published';
  END IF;

  -- Get current attempts and best score
  SELECT COALESCE(quiz_attempts, 0), COALESCE(best_score, 0) 
  INTO v_current_attempts, v_current_best
  FROM user_progress
  WHERE user_id = auth.uid() AND module_id = p_module_id;
  
  -- Check attempt limit (max 2 attempts)
  IF v_current_attempts >= 2 THEN
    RAISE EXCEPTION 'Maximum quiz attempts reached';
  END IF;
  
  -- Count total questions
  SELECT COUNT(*) INTO v_total 
  FROM questions 
  WHERE module_id = p_module_id;
  
  IF v_total = 0 THEN
    RAISE EXCEPTION 'No questions found for this module';
  END IF;
  
  -- Calculate score by comparing with correct answers
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
  
  -- Update user progress atomically
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

GRANT EXECUTE ON FUNCTION public.submit_quiz_answers TO authenticated;

-- 2. Create a unique constraint needed for the upsert (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_progress_user_module_unique'
  ) THEN
    ALTER TABLE public.user_progress 
    ADD CONSTRAINT user_progress_user_module_unique UNIQUE (user_id, module_id);
  END IF;
END $$;

-- 3. Create a view for students that excludes sensitive answer data
CREATE OR REPLACE VIEW public.questions_for_quiz AS
SELECT id, module_id, question_text, options, sort_order
FROM public.questions;

GRANT SELECT ON public.questions_for_quiz TO authenticated;

-- 4. Create a function to get quiz results (correct answers) only AFTER completion
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
  -- Verify user has completed this quiz
  IF NOT EXISTS (
    SELECT 1 FROM user_progress 
    WHERE user_id = auth.uid() 
    AND module_id = p_module_id 
    AND completed_at IS NOT NULL
  ) THEN
    -- Check if admin
    IF NOT has_role(auth.uid(), 'admin') THEN
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

GRANT EXECUTE ON FUNCTION public.get_quiz_results TO authenticated;

-- 5. Update RLS policy to restrict full question access to admins only
DROP POLICY IF EXISTS "Anyone logged in can view questions for published modules" ON public.questions;

CREATE POLICY "Only admins can view full questions"
  ON public.questions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));