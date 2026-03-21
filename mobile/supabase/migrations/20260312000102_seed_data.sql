-- Migration: 017 - Seed initial development data
-- NOTE: This seed is for local development only. Do NOT run on production.

-- ────────────────────────────────────────────────────────
-- Ministries
-- ────────────────────────────────────────────────────────

INSERT INTO public.ministries (id, name, description, color) VALUES
  ('11111111-0000-0000-0000-000000000001', 'Louvor', 'Ministério de Música e Louvor', '#6366F1'),
  ('11111111-0000-0000-0000-000000000002', 'Infantil', 'Ministério Infantil', '#F59E0B'),
  ('11111111-0000-0000-0000-000000000003', 'Mídia', 'Ministério de Comunicação e Mídias', '#10B981'),
  ('11111111-0000-0000-0000-000000000004', 'Recepção', 'Ministério de Recepção dos Visitantes', '#EC4899')
ON CONFLICT (name) DO NOTHING;

-- ────────────────────────────────────────────────────────
-- Ministry Roles
-- ────────────────────────────────────────────────────────

INSERT INTO public.ministry_roles (ministry_id, name) VALUES
  -- Louvor
  ('11111111-0000-0000-0000-000000000001', 'Vocal'),
  ('11111111-0000-0000-0000-000000000001', 'Violão'),
  ('11111111-0000-0000-0000-000000000001', 'Guitarra'),
  ('11111111-0000-0000-0000-000000000001', 'Baixo'),
  ('11111111-0000-0000-0000-000000000001', 'Bateria'),
  ('11111111-0000-0000-0000-000000000001', 'Teclado'),
  -- Infantil
  ('11111111-0000-0000-0000-000000000002', 'Professor'),
  ('11111111-0000-0000-0000-000000000002', 'Auxiliar'),
  -- Mídia
  ('11111111-0000-0000-0000-000000000003', 'Câmera'),
  ('11111111-0000-0000-0000-000000000003', 'Transmissão'),
  ('11111111-0000-0000-0000-000000000003', 'Slides'),
  -- Recepção
  ('11111111-0000-0000-0000-000000000004', 'Recepcionista')
ON CONFLICT (ministry_id, name) DO NOTHING;

-- ────────────────────────────────────────────────────────
-- Rooms
-- ────────────────────────────────────────────────────────

INSERT INTO public.rooms (name, capacity, description) VALUES
  ('Salão Principal', 300, 'Auditório principal da igreja'),
  ('Sala de Reunião A', 20, 'Sala para reuniões pequenas'),
  ('Sala de Reunião B', 20, 'Sala para reuniões pequenas'),
  ('Sala Infantil', 50, 'Espaço para o ministério infantil'),
  ('Estúdio', 10, 'Estúdio de gravação e ensaio')
ON CONFLICT DO NOTHING;

-- ────────────────────────────────────────────────────────
-- Songs
-- ────────────────────────────────────────────────────────

INSERT INTO public.songs (title, artist, key, bpm, category) VALUES
  ('Grande é o Senhor', 'Ministério Zoe', 'G', 72, 'louvor'),
  ('Oceanos', 'Hillsong United', 'A', 68, 'adoracao'),
  ('Nenhum Outro Nome', 'Hillsong Worship', 'Bb', 75, 'louvor'),
  ('Mais uma Vez', 'Ministério Zoe', 'C', 80, 'louvor'),
  ('Quão Grande é o Meu Deus', 'Chris Tomlin', 'D', 65, 'adoracao'),
  ('Jesus Filho de Deus', 'Eli Soares', 'E', 70, 'adoracao'),
  ('Tua Graça me Basta', 'Fernandinho', 'F', 78, 'adoracao'),
  ('Me Ajoelho', 'Vineyard', 'G', 60, 'adoracao')
ON CONFLICT DO NOTHING;
