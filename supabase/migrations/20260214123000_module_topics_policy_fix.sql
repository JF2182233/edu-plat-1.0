-- Ensure admins can insert/update module topics under RLS
DROP POLICY IF EXISTS "Admins can manage module topics" ON public.module_topics;
CREATE POLICY "Admins can manage module topics"
  ON public.module_topics FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
