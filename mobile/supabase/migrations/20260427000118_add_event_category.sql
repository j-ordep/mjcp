-- Add an informational category to events for UI grouping and badges.
-- Events remain public/informational and category does not affect schedules.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'geral';

ALTER TABLE public.events
  DROP CONSTRAINT IF EXISTS events_category_check;

ALTER TABLE public.events
  ADD CONSTRAINT events_category_check
  CHECK (
    category IN (
      'geral',
      'culto',
      'ensino',
      'jovens',
      'oração',
      'reunião',
      'especial'
    )
  );
