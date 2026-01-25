SELECT u.email as auth_email, u.id as auth_user_id, p.email as reg_email, p.user_id as reg_user_id, p.full_name, p.selection_status 
FROM auth.users u
LEFT JOIN pendaftaran_tikrar_tahfidz p ON p.user_id = u.id
WHERE u.email ILIKE '%muallimah_email_here%'
ORDER BY p.created_at DESC;
