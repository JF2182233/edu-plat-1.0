-- Add module topics to support multi-subject modules
CREATE TABLE public.module_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE NOT NULL,
  title_sv TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_sv TEXT NOT NULL,
  description_en TEXT NOT NULL,
  read_content_sv TEXT NOT NULL,
  read_content_en TEXT NOT NULL,
  video_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX module_topics_module_id_idx ON public.module_topics(module_id);

ALTER TABLE public.questions
ADD COLUMN topic_id UUID;

ALTER TABLE public.questions
ADD CONSTRAINT questions_topic_id_fkey
FOREIGN KEY (topic_id) REFERENCES public.module_topics(id) ON DELETE CASCADE;

-- Backfill topics from existing modules and map questions
WITH new_topics AS (
  INSERT INTO public.module_topics (
    module_id,
    title_sv,
    title_en,
    description_sv,
    description_en,
    read_content_sv,
    read_content_en,
    video_url,
    sort_order
  )
  SELECT
    m.id,
    m.title_sv,
    m.title_en,
    m.description_sv,
    m.description_en,
    m.read_content_sv,
    m.read_content_en,
    m.video_url,
    0
  FROM public.modules m
  RETURNING id, module_id
)
UPDATE public.questions q
SET topic_id = nt.id
FROM new_topics nt
WHERE q.module_id = nt.module_id AND q.topic_id IS NULL;

ALTER TABLE public.questions
ALTER COLUMN topic_id SET NOT NULL;

-- Topic progress per subject
CREATE TABLE public.topic_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  topic_id UUID REFERENCES public.module_topics(id) ON DELETE CASCADE NOT NULL,
  step_read_done BOOLEAN NOT NULL DEFAULT false,
  step_watch_done BOOLEAN NOT NULL DEFAULT false,
  quiz_attempts INTEGER NOT NULL DEFAULT 0,
  latest_score INTEGER NOT NULL DEFAULT 0,
  best_score INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, topic_id)
);

-- Enable RLS
ALTER TABLE public.module_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_progress ENABLE ROW LEVEL SECURITY;

-- Policies for module topics
CREATE POLICY "Anyone logged in can view topics for accessible modules"
  ON public.module_topics FOR SELECT
  TO authenticated
  USING (
    public.user_can_access_module(auth.uid(), module_topics.module_id)
  );

CREATE POLICY "Admins can manage module topics"
  ON public.module_topics FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Policies for topic progress
CREATE POLICY "Users can view their own topic progress"
  ON public.topic_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own topic progress"
  ON public.topic_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own topic progress"
  ON public.topic_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all topic progress"
  ON public.topic_progress FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER update_module_topics_updated_at
  BEFORE UPDATE ON public.module_topics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_topic_progress_updated_at
  BEFORE UPDATE ON public.topic_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Update quiz functions to use topic_id
CREATE OR REPLACE FUNCTION public.get_quiz_questions(p_topic_id UUID)
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
  IF NOT EXISTS (
    SELECT 1
    FROM module_topics
    WHERE id = p_topic_id
    AND public.user_can_access_module(auth.uid(), module_id)
  ) THEN
    RAISE EXCEPTION 'Topic not found or not accessible';
  END IF;

  RETURN QUERY
  SELECT q.id, q.question_text, q.options, q.sort_order
  FROM questions q
  WHERE q.topic_id = p_topic_id
  ORDER BY q.sort_order;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_quiz_questions TO authenticated;

CREATE OR REPLACE FUNCTION public.get_quiz_results(p_topic_id UUID)
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
  IF NOT public.user_can_access_module(auth.uid(), (SELECT module_id FROM module_topics WHERE id = p_topic_id)) THEN
    RAISE EXCEPTION 'Topic not found or not accessible';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM topic_progress
    WHERE user_id = auth.uid()
    AND topic_id = p_topic_id
    AND completed_at IS NOT NULL
  ) THEN
    IF NOT has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Quiz not completed yet';
    END IF;
  END IF;

  RETURN QUERY
  SELECT q.id, q.question_text, q.options, q.correct_index, q.explanation, q.sort_order
  FROM questions q
  WHERE q.topic_id = p_topic_id
  ORDER BY q.sort_order;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_quiz_results TO authenticated;

CREATE OR REPLACE FUNCTION public.submit_quiz_answers(
  p_topic_id UUID,
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

  IF NOT EXISTS (
    SELECT 1
    FROM module_topics
    WHERE id = p_topic_id
    AND public.user_can_access_module(auth.uid(), module_id)
  ) THEN
    RAISE EXCEPTION 'Topic not found or not accessible';
  END IF;

  SELECT COALESCE(quiz_attempts, 0), COALESCE(best_score, 0)
  INTO v_current_attempts, v_current_best
  FROM topic_progress
  WHERE user_id = auth.uid() AND topic_id = p_topic_id;

  IF v_current_attempts >= 2 THEN
    RAISE EXCEPTION 'Maximum quiz attempts reached';
  END IF;

  SELECT COUNT(*) INTO v_total
  FROM questions
  WHERE topic_id = p_topic_id;

  IF v_total = 0 THEN
    RAISE EXCEPTION 'No questions found for this topic';
  END IF;

  FOR v_question IN
    SELECT id, correct_index
    FROM questions
    WHERE topic_id = p_topic_id
  LOOP
    v_user_answer := (p_answers->>v_question.id::text)::INTEGER;
    IF v_user_answer IS NOT NULL AND v_user_answer = v_question.correct_index THEN
      v_score := v_score + 1;
    END IF;
  END LOOP;

  v_percentage := ROUND((v_score::NUMERIC / v_total) * 100);

  INSERT INTO topic_progress (
    user_id,
    topic_id,
    quiz_attempts,
    latest_score,
    best_score,
    completed_at
  )
  VALUES (
    auth.uid(),
    p_topic_id,
    1,
    v_percentage,
    v_percentage,
    NOW()
  )
  ON CONFLICT (user_id, topic_id) DO UPDATE
  SET
    quiz_attempts = topic_progress.quiz_attempts + 1,
    latest_score = v_percentage,
    best_score = GREATEST(topic_progress.best_score, v_percentage),
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
