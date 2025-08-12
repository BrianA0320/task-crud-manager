-- Create team_members table for managing team relationships
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_owner_id UUID NOT NULL,
  member_id UUID NOT NULL,
  member_email TEXT NOT NULL,
  member_name TEXT,
  role TEXT DEFAULT 'member',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_owner_id, member_id)
);

-- Enable RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Create policies for team_members
CREATE POLICY "Team owners can manage their team members" 
ON public.team_members 
FOR ALL 
USING (auth.uid() = team_owner_id);

CREATE POLICY "Team members can view teams they belong to" 
ON public.team_members 
FOR SELECT 
USING (auth.uid() = member_id OR auth.uid() = team_owner_id);

-- Add assigned_to field to tasks table
ALTER TABLE public.tasks ADD COLUMN assigned_to UUID;
ALTER TABLE public.tasks ADD COLUMN assigned_to_email TEXT;
ALTER TABLE public.tasks ADD COLUMN assigned_to_name TEXT;

-- Update tasks policies to allow viewing assigned tasks
CREATE POLICY "Users can view tasks assigned to them" 
ON public.tasks 
FOR SELECT 
USING (auth.uid() = assigned_to);

-- Create trigger for team_members updated_at
CREATE TRIGGER update_team_members_updated_at
BEFORE UPDATE ON public.team_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();