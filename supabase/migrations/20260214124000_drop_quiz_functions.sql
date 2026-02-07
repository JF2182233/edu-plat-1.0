-- Drop old quiz functions so topic-based versions can be created
DROP FUNCTION IF EXISTS public.get_quiz_questions(UUID);
DROP FUNCTION IF EXISTS public.get_quiz_results(UUID);
DROP FUNCTION IF EXISTS public.submit_quiz_answers(UUID, JSONB);
