-- Fix: Update user ID to match auth user
-- Run this in Supabase SQL Editor

-- First, check the current state
SELECT id, email, role FROM users WHERE email = 'dewifebriani@gmail.com';

-- Update the user ID to match the auth user ID
UPDATE users
SET id = '9ca8c1e4-8c31-4941-8cfd-6bd3bb15c88b'
WHERE email = 'dewifebriani@gmail.com';

-- Verify the change
SELECT id, email, role FROM users WHERE email = 'dewifebriani@gmail.com';

-- Also verify it matches
SELECT id, email FROM auth.users WHERE email = 'dewifebriani@gmail.com';
