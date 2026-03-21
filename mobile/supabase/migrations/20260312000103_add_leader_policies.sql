-- Migration: 016 - Add Schedule Management policies for Ministry Leaders

-- 1. Líderes podem gerenciar escalas completas dos seus próprios ministérios
CREATE POLICY "Leaders can manage schedules"
  ON schedules FOR ALL USING (is_ministry_leader(ministry_id))
  WITH CHECK (is_ministry_leader(ministry_id));

-- 2. Líderes podem gerenciar os membros (assignments) dessas escalas
CREATE POLICY "Leaders can manage assignments"
  ON schedule_assignments FOR ALL USING (
    EXISTS (
      SELECT 1 FROM schedules s
      WHERE s.id = schedule_assignments.schedule_id AND is_ministry_leader(s.ministry_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM schedules s
      WHERE s.id = schedule_assignments.schedule_id AND is_ministry_leader(s.ministry_id)
    )
  );
