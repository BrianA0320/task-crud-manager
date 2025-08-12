-- Create team invitations table
CREATE TABLE public.team_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_owner_id uuid NOT NULL,
  invitee_email text NOT NULL,
  invitee_name text,
  role text NOT NULL DEFAULT 'member',
  status text NOT NULL DEFAULT 'pending',
  invitation_token uuid NOT NULL DEFAULT gen_random_uuid(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Team owners can manage their invitations" 
ON public.team_invitations 
FOR ALL 
USING (auth.uid() = team_owner_id);

CREATE POLICY "Team owners can view their invitations" 
ON public.team_invitations 
FOR SELECT 
USING (auth.uid() = team_owner_id);

-- Add trigger for timestamps
CREATE TRIGGER update_team_invitations_updated_at
BEFORE UPDATE ON public.team_invitations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();