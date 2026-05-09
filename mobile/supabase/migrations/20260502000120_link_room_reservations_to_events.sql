ALTER TABLE public.room_reservations
  ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'geral';

ALTER TABLE public.room_reservations
  DROP CONSTRAINT IF EXISTS room_reservations_category_check;

ALTER TABLE public.room_reservations
  ADD CONSTRAINT room_reservations_category_check
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

CREATE INDEX IF NOT EXISTS room_reservations_event_id_idx
  ON public.room_reservations(event_id);

DROP POLICY IF EXISTS "Admin can manage room reservations" ON public.room_reservations;

CREATE POLICY "Admin can manage room reservations"
  ON public.room_reservations
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());
