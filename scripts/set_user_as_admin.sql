-- Script to set a specific user as admin
-- Replace 'your-email@example.com' with the actual email address

-- Check current role
SELECT id, email, role FROM users WHERE email = 'your-email@example.com';

-- Update to admin role
UPDATE users
SET role = 'admin'
WHERE email = 'your-email@example.com';

-- Verify the change
SELECT id, email, role FROM users WHERE email = 'your-email@example.com';
