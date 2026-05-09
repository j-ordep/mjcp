-- Migration: 022 - Normalize room catalog safely
-- Renames legacy rooms to the canonical catalog and inserts missing ones.
-- Does not delete extra/custom rooms to avoid breaking existing reservations.

UPDATE public.rooms
SET
  name = 'Templo',
  description = COALESCE(description, 'Espaço principal')
WHERE name = 'Salão Principal';

UPDATE public.rooms
SET
  name = 'Sala 1',
  description = COALESCE(description, 'Sala de apoio')
WHERE name = 'Sala de Reunião A';

UPDATE public.rooms
SET
  name = 'Sala 2',
  description = COALESCE(description, 'Sala de apoio')
WHERE name = 'Sala de Reunião B';

UPDATE public.rooms
SET
  name = 'Sala 3',
  description = COALESCE(description, 'Sala de apoio')
WHERE name = 'Sala Infantil';

UPDATE public.rooms
SET
  name = 'Sala 4',
  description = COALESCE(description, 'Sala de apoio')
WHERE name = 'Estúdio';

INSERT INTO public.rooms (name, description)
SELECT desired.name, desired.description
FROM (
  VALUES
    ('Sala 1', 'Sala de apoio'),
    ('Sala 2', 'Sala de apoio'),
    ('Sala 3', 'Sala de apoio'),
    ('Sala 4', 'Sala de apoio'),
    ('Casa de Missões', 'Espaço de apoio'),
    ('Templo', 'Espaço principal')
) AS desired(name, description)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.rooms existing
  WHERE existing.name = desired.name
);
