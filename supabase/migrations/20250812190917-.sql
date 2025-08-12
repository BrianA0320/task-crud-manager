-- Fix the tasks priority constraint to allow the correct values
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_priority_check;

-- Add the correct constraint that allows low, medium, high values
ALTER TABLE public.tasks ADD CONSTRAINT tasks_priority_check CHECK (priority IN ('low', 'medium', 'high'));

-- Update the default value to use 'medium' instead of 'media'
ALTER TABLE public.tasks ALTER COLUMN priority SET DEFAULT 'medium';