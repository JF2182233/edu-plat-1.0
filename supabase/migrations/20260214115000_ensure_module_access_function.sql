-- Ensure module access table and function exist before topic migrations
CREATE TABLE IF NOT EXISTS public.module_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (module_id, user_id)
);

ALTER TABLE public.module_access ENABLE ROW LEVEL SECURITY;

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

GRANT EXECUTE ON FUNCTION public.user_can_access_module(UUID, UUID) TO authenticated;
