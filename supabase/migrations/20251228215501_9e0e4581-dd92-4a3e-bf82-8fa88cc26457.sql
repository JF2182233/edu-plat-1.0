-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('user', 'admin');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

-- Create modules table
CREATE TABLE public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  read_content TEXT NOT NULL,
  video_url TEXT NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create questions table
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_index INTEGER NOT NULL,
  explanation TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Create user_progress table
CREATE TABLE public.user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE NOT NULL,
  step_read_done BOOLEAN NOT NULL DEFAULT false,
  step_watch_done BOOLEAN NOT NULL DEFAULT false,
  quiz_attempts INTEGER NOT NULL DEFAULT 0,
  latest_score INTEGER NOT NULL DEFAULT 0,
  best_score INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Security definer function to check role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- User roles policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Modules policies
CREATE POLICY "Anyone logged in can view published modules"
  ON public.modules FOR SELECT
  TO authenticated
  USING (is_published = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage modules"
  ON public.modules FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Questions policies
CREATE POLICY "Anyone logged in can view questions for published modules"
  ON public.questions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.modules 
      WHERE modules.id = questions.module_id 
      AND (modules.is_published = true OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Admins can manage questions"
  ON public.questions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- User progress policies
CREATE POLICY "Users can view their own progress"
  ON public.user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
  ON public.user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON public.user_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all progress"
  ON public.user_progress FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'display_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_modules_updated_at
  BEFORE UPDATE ON public.modules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON public.user_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Seed data: Welcome Onboarding module
INSERT INTO public.modules (id, title, description, read_content, video_url, is_published, sort_order)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Welcome Onboarding',
  'Learn the basics, watch the short intro, then take the quiz.',
  '# Welcome to Our Platform! 🎉

We''re thrilled to have you join us. This onboarding module will help you get started and make the most of our platform.

## What You''ll Learn

In this module, you''ll discover:

- **Platform Overview**: Understanding the core features and navigation
- **Best Practices**: Tips for getting the most out of your experience
- **Key Features**: Essential tools that will help you succeed

## Getting Started

Before diving in, here are a few things to keep in mind:

1. **Take your time** - There''s no rush to complete this module
2. **Ask questions** - If something isn''t clear, reach out to our support team
3. **Practice makes perfect** - Don''t hesitate to revisit sections

## Platform Features

Our platform offers several powerful features:

- **Dashboard**: Your central hub for all activities
- **Progress Tracking**: Monitor your learning journey
- **Interactive Content**: Engage with videos and quizzes
- **Personalized Experience**: Tailored content based on your progress

## Next Steps

After reading this content, you''ll watch a short introductory video and then complete a brief quiz to test your understanding. Don''t worry – you can retry the quiz if needed!

---

*Ready to continue? Click "Mark as Complete" below to move to the next step.*',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  true,
  0
);

-- Seed data: Quiz questions
INSERT INTO public.questions (module_id, question_text, options, correct_index, explanation, sort_order)
VALUES
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'What is the main purpose of the Dashboard?',
    '["To display advertisements", "To serve as your central hub for all activities", "To store your personal files", "To connect with social media"]',
    1,
    'The Dashboard is your central hub where you can access all platform activities and monitor your progress.'
  , 0),
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Which of the following is NOT mentioned as a platform feature?',
    '["Progress Tracking", "Interactive Content", "Cryptocurrency Trading", "Personalized Experience"]',
    2,
    'Cryptocurrency Trading was not mentioned as a platform feature. The platform focuses on learning and progress tracking.'
  , 1),
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'What should you do if something isn''t clear during onboarding?',
    '["Skip it and move on", "Reach out to the support team", "Delete your account", "Ignore it completely"]',
    1,
    'Our support team is here to help! Don''t hesitate to reach out if you have any questions.'
  , 2),
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'How many times can you retry the quiz?',
    '["Zero times", "One time", "Unlimited times", "Three times"]',
    1,
    'You can retry the quiz once. The system stores both your latest and best scores.'
  , 3),
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'What is emphasized about completing this module?',
    '["You must finish in under 5 minutes", "There is no rush to complete", "You need to pay extra", "It requires a certificate"]',
    1,
    'Take your time! There is no rush to complete this module. Learning at your own pace is encouraged.'
  , 4);

-- Comment: To make a user an admin, run:
-- INSERT INTO public.user_roles (user_id, role) VALUES ('user-uuid-here', 'admin')
-- OR update existing: UPDATE public.user_roles SET role = 'admin' WHERE user_id = 'user-uuid-here';