-- Run all migrations for multi-role support
-- Execute this in Supabase SQL Editor

-- Migration 1: Convert role to roles array
\i supabase/migrations/20251225_convert_users_role_to_array.sql

-- Migration 2: Add role management functions
\i supabase/migrations/20251225_add_role_management_functions.sql
