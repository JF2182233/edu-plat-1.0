-- Add Swedish and English columns for translatable content
ALTER TABLE public.modules 
ADD COLUMN title_sv text,
ADD COLUMN title_en text,
ADD COLUMN description_sv text,
ADD COLUMN description_en text,
ADD COLUMN read_content_sv text,
ADD COLUMN read_content_en text;

-- Migrate existing data to Swedish columns (assuming current content is Swedish)
UPDATE public.modules SET
  title_sv = title,
  title_en = title,
  description_sv = description,
  description_en = description,
  read_content_sv = read_content,
  read_content_en = read_content;

-- Make the new columns NOT NULL after migration
ALTER TABLE public.modules 
ALTER COLUMN title_sv SET NOT NULL,
ALTER COLUMN title_en SET NOT NULL,
ALTER COLUMN description_sv SET NOT NULL,
ALTER COLUMN description_en SET NOT NULL,
ALTER COLUMN read_content_sv SET NOT NULL,
ALTER COLUMN read_content_en SET NOT NULL;

-- Drop old columns (keeping video_url as it's language-agnostic)
ALTER TABLE public.modules 
DROP COLUMN title,
DROP COLUMN description,
DROP COLUMN read_content;