-- 1. ADD CHECK CONSTRAINT FOR QUOTA
-- This prevents race conditions where concurrent registrations exceed max_quota at the ACID level.
ALTER TABLE public.final_exam_schedules
DROP CONSTRAINT IF EXISTS check_quota_not_exceeded;

ALTER TABLE public.final_exam_schedules
ADD CONSTRAINT check_quota_not_exceeded CHECK (current_count <= max_quota);

-- 2. CREATE RPC FUNCTION FOR REGISTRATION & UPDATE
-- This ensures registration and updating of final exam schedules is fully transactional.
CREATE OR REPLACE FUNCTION register_final_exam(p_user_id uuid, p_schedule_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_exam_type varchar;
  v_old_reg_id uuid;
  v_old_schedule_id uuid;
  v_new_count int;
  v_max_quota int;
  v_res jsonb;
BEGIN
  -- 1. Get new schedule info
  SELECT exam_type, max_quota INTO v_exam_type, v_max_quota 
  FROM final_exam_schedules WHERE id = p_schedule_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Jadwal tidak ditemukan');
  END IF;

  -- 2. Find if they are already registered for this exam type
  SELECT r.id, r.schedule_id INTO v_old_reg_id, v_old_schedule_id
  FROM final_exam_registrations r
  JOIN final_exam_schedules s ON r.schedule_id = s.id
  WHERE r.user_id = p_user_id AND s.exam_type = v_exam_type;

  -- 3. Check if new schedule has quota
  SELECT current_count INTO v_new_count FROM final_exam_schedules WHERE id = p_schedule_id;
  
  -- If we are switching from old schedule, we don't count ourselves if it's the same schedule
  IF v_old_schedule_id = p_schedule_id THEN
    RETURN jsonb_build_object('success', true, 'message', 'Sudah terdaftar di jadwal ini');
  END IF;

  IF v_new_count >= v_max_quota THEN
    RETURN jsonb_build_object('success', false, 'error', 'Kuota sudah penuh');
  END IF;

  -- 4. Delete old registration if exists (triggers decrement on old schedule via tr_update_exam_quota)
  IF v_old_reg_id IS NOT NULL THEN
    DELETE FROM final_exam_registrations WHERE id = v_old_reg_id;
  END IF;

  -- 5. Insert new registration (triggers increment on new schedule via tr_update_exam_quota)
  -- The check_quota_not_exceeded CHECK constraint guarantees that if the increment exceeds max_quota,
  -- this insert statement will fail and abort the transaction.
  INSERT INTO final_exam_registrations (user_id, schedule_id)
  VALUES (p_user_id, p_schedule_id);

  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
