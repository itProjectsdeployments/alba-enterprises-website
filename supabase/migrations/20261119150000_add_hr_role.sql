-- Adds the HR staff role. Kept in its own migration because a new enum value
-- cannot be used in the same transaction that creates it.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'hr';
