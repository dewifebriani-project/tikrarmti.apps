-- Atomically reserve halaqah slots while saving the partner selection.
-- Locking the halaqah rows serializes concurrent attempts for the same class,
-- so the capacity check and write cannot race with each other.

CREATE UNIQUE INDEX IF NOT EXISTS uq_halaqah_students_halaqah_thalibah
  ON public.halaqah_students (halaqah_id, thalibah_id);

CREATE OR REPLACE FUNCTION public.reserve_halaqah_and_partner(
  p_registration_id uuid,
  p_ujian_halaqah_id uuid,
  p_tashih_halaqah_id uuid,
  p_partner_type text,
  p_partner_user_id uuid DEFAULT NULL,
  p_partner_name text DEFAULT NULL,
  p_partner_relationship text DEFAULT NULL,
  p_partner_wa_phone text DEFAULT NULL,
  p_partner_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_batch_id uuid;
  v_registration_user_id uuid;
  v_selection_status text;
  v_submission_id uuid;
  v_submission_status text;
  v_old_ujian_id uuid;
  v_old_tashih_id uuid;
  v_tashih_id uuid := COALESCE(p_tashih_halaqah_id, p_ujian_halaqah_id);
  v_selected_ids uuid[];
  v_lock_ids uuid[];
  v_selected_found integer := 0;
  v_halaqah record;
  v_current_students integer;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'UNAUTHORIZED');
  END IF;

  IF p_ujian_halaqah_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'HALAQAH_REQUIRED');
  END IF;

  IF p_partner_type NOT IN ('self_match', 'system_match', 'family', 'tarteel') THEN
    RETURN jsonb_build_object('success', false, 'error', 'PARTNER_TYPE_INVALID');
  END IF;

  IF p_partner_type = 'self_match'
     AND (p_partner_user_id IS NULL OR p_partner_user_id = v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'PARTNER_INVALID');
  END IF;

  IF p_partner_type IN ('family', 'tarteel')
     AND NULLIF(btrim(p_partner_name), '') IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'PARTNER_INVALID');
  END IF;

  IF p_partner_type = 'family'
     AND NULLIF(btrim(p_partner_relationship), '') IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'PARTNER_INVALID');
  END IF;

  SELECT registration.user_id, registration.batch_id, registration.selection_status
    INTO v_registration_user_id, v_batch_id, v_selection_status
  FROM public.pendaftaran_tikrar_tahfidz AS registration
  WHERE registration.id = p_registration_id
  FOR SHARE;

  IF NOT FOUND OR v_registration_user_id <> v_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'REGISTRATION_INVALID');
  END IF;

  IF v_selection_status <> 'selected' THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_SELECTED');
  END IF;

  SELECT submission.id,
         submission.status,
         submission.ujian_halaqah_id,
         submission.tashih_halaqah_id
    INTO v_submission_id,
         v_submission_status,
         v_old_ujian_id,
         v_old_tashih_id
  FROM public.daftar_ulang_submissions AS submission
  WHERE submission.user_id = v_user_id
    AND submission.registration_id = p_registration_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'SUBMISSION_NOT_FOUND');
  END IF;

  SELECT array_agg(DISTINCT id ORDER BY id)
    INTO v_selected_ids
  FROM unnest(ARRAY[p_ujian_halaqah_id, v_tashih_id]::uuid[]) AS ids(id)
  WHERE id IS NOT NULL;

  -- Lock both the previous and new classes in a deterministic order. This also
  -- serializes moves between classes and prevents deadlocks.
  SELECT array_agg(DISTINCT id ORDER BY id)
    INTO v_lock_ids
  FROM unnest(ARRAY[
    p_ujian_halaqah_id,
    v_tashih_id,
    v_old_ujian_id,
    v_old_tashih_id
  ]::uuid[]) AS ids(id)
  WHERE id IS NOT NULL;

  PERFORM halaqah.id
  FROM public.halaqah AS halaqah
  WHERE halaqah.id = ANY(v_lock_ids)
  ORDER BY halaqah.id
  FOR UPDATE;

  FOR v_halaqah IN
    SELECT halaqah.id,
           halaqah.name,
           COALESCE(NULLIF(halaqah.max_students, 0), 5) AS max_students
    FROM public.halaqah AS halaqah
    JOIN public.programs AS program ON program.id = halaqah.program_id
    WHERE halaqah.id = ANY(v_selected_ids)
      AND halaqah.status = 'active'
      AND program.batch_id = v_batch_id
    ORDER BY halaqah.id
  LOOP
    v_selected_found := v_selected_found + 1;

    SELECT COUNT(DISTINCT reservations.user_id)::integer
      INTO v_current_students
    FROM (
      SELECT student.thalibah_id AS user_id
      FROM public.halaqah_students AS student
      WHERE student.halaqah_id = v_halaqah.id
        AND student.status = 'active'
        AND student.thalibah_id <> v_user_id

      UNION

      SELECT submission.user_id
      FROM public.daftar_ulang_submissions AS submission
      WHERE submission.batch_id = v_batch_id
        AND submission.user_id <> v_user_id
        AND (
          submission.partner_status IN ('submitted', 'approved')
          OR submission.status IN ('submitted', 'approved')
        )
        AND (
          submission.ujian_halaqah_id = v_halaqah.id
          OR submission.tashih_halaqah_id = v_halaqah.id
        )
    ) AS reservations;

    IF v_current_students >= v_halaqah.max_students THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'HALAQAH_FULL',
        'halaqah_id', v_halaqah.id,
        'halaqah_name', v_halaqah.name,
        'current_students', v_current_students,
        'max_students', v_halaqah.max_students
      );
    END IF;
  END LOOP;

  IF v_selected_found <> cardinality(v_selected_ids) THEN
    RETURN jsonb_build_object('success', false, 'error', 'HALAQAH_INVALID');
  END IF;

  UPDATE public.daftar_ulang_submissions
  SET ujian_halaqah_id = p_ujian_halaqah_id,
      tashih_halaqah_id = v_tashih_id,
      partner_type = p_partner_type,
      partner_user_id = p_partner_user_id,
      partner_name = p_partner_name,
      partner_relationship = p_partner_relationship,
      partner_wa_phone = p_partner_wa_phone,
      partner_notes = p_partner_notes,
      partner_status = 'submitted',
      updated_at = now()
  WHERE id = v_submission_id;

  -- Approved submissions are the source of truth for active halaqah_students.
  IF v_submission_status = 'approved' THEN
    DELETE FROM public.halaqah_students
    WHERE thalibah_id = v_user_id
      AND halaqah_id = ANY(ARRAY[v_old_ujian_id, v_old_tashih_id]::uuid[])
      AND NOT (halaqah_id = ANY(v_selected_ids));

    INSERT INTO public.halaqah_students (
      halaqah_id,
      thalibah_id,
      assigned_by,
      status
    )
    SELECT id, v_user_id, v_user_id, 'active'
    FROM unnest(v_selected_ids) AS selected(id)
    ON CONFLICT (halaqah_id, thalibah_id)
    DO UPDATE SET
      status = 'active',
      assigned_by = EXCLUDED.assigned_by,
      assigned_at = now();
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'submission_id', v_submission_id,
    'status', v_submission_status
  );
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_halaqah_and_partner(
  uuid, uuid, uuid, text, uuid, text, text, text, text
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.reserve_halaqah_and_partner(
  uuid, uuid, uuid, text, uuid, text, text, text, text
) TO authenticated;

COMMENT ON FUNCTION public.reserve_halaqah_and_partner(
  uuid, uuid, uuid, text, uuid, text, text, text, text
) IS 'Atomically validates quota, reserves halaqah choices, and saves partner selection.';
