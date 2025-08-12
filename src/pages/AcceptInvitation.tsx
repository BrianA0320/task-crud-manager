import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UserPlus, Users, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface InvitationData {
  id: string;
  team_owner_id: string;
  invitee_email: string;
  invitee_name: string;
  status: string;
  expires_at: string;
  owner_name?: string;
}

const AcceptInvitation = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, signIn, signUp } = useAuth();
  const { toast } = useToast();
  
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });

  useEffect(() => {
    if (token) {
      loadInvitation();
    }
  }, [token]);

  useEffect(() => {
    if (user && invitation) {
      // User is already logged in, check if they can accept the invitation
      if (user.email === invitation.invitee_email) {
        acceptInvitation();
      } else {
        toast({
          title: "Error",
          description: "Esta invitación es para un email diferente al de tu cuenta actual",
          variant: "destructive",
        });
      }
    }
  }, [user, invitation]);

  const loadInvitation = async () => {
    try {
      const { data, error } = await supabase
        .from('team_invitations')
        .select(`
          *,
          profiles!team_invitations_team_owner_id_fkey(display_name)
        `)
        .eq('invitation_token', token)
        .eq('status', 'pending')
        .single();

      if (error || !data) {
        toast({
          title: "Invitación no válida",
          description: "Esta invitación no existe, ya fue usada o ha expirado",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      // Check if invitation has expired
      if (new Date(data.expires_at) < new Date()) {
        toast({
          title: "Invitación expirada",
          description: "Esta invitación ha expirado",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      setInvitation(data);
      setFormData(prev => ({
        ...prev,
        email: data.invitee_email,
        name: data.invitee_name || ''
      }));
    } catch (error) {
      console.error('Error loading invitation:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la invitación",
        variant: "destructive",
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async () => {
    if (!invitation || !user) return;
    
    setProcessing(true);
    try {
      // Add user to team
      const { error: teamError } = await supabase
        .from('team_members')
        .insert({
          team_owner_id: invitation.team_owner_id,
          member_id: user.id,
          member_email: user.email,
          member_name: formData.name || user.user_metadata?.full_name || user.email?.split('@')[0],
          role: 'member',
          status: 'active'
        });

      if (teamError) throw teamError;

      // Update invitation status
      const { error: inviteError } = await supabase
        .from('team_invitations')
        .update({ status: 'accepted' })
        .eq('invitation_token', token);

      if (inviteError) throw inviteError;

      toast({
        title: "¡Bienvenido al equipo!",
        description: "Te has unido exitosamente al equipo",
      });

      navigate('/');
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast({
        title: "Error",
        description: "No se pudo aceptar la invitación",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleAuth = async () => {
    if (!formData.email || !formData.password) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      if (authMode === 'signup') {
        const result = await signUp(formData.email, formData.password);
        
        if (result.error) {
          // If user already exists, try to login instead
          if (result.error.message?.includes('already registered')) {
            const loginResult = await signIn(formData.email, formData.password);
            if (loginResult.error) {
              toast({
                title: "Error",
                description: "Email ya registrado. Verifica tu contraseña e intenta iniciar sesión",
                variant: "destructive",
              });
              setAuthMode('login');
              setProcessing(false);
              return;
            }
          } else {
            throw result.error;
          }
        }
        
        toast({
          title: "Cuenta creada",
          description: "Tu cuenta ha sido creada exitosamente",
        });
      } else {
        const result = await signIn(formData.email, formData.password);
        if (result.error) {
          toast({
            title: "Error",
            description: "Credenciales incorrectas",
            variant: "destructive",
          });
          setProcessing(false);
          return;
        }
      }
      
      // The useEffect will handle accepting the invitation once the user is logged in
    } catch (error: any) {
      console.error('Auth error:', error);
      toast({
        title: "Error",
        description: error.message || "Error en el proceso de autenticación",
        variant: "destructive",
      });
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Cargando invitación...</span>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Invitación no válida</CardTitle>
            <CardDescription>
              Esta invitación no existe o ha expirado
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
              <Users className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl">¡Te han invitado!</CardTitle>
            <CardDescription>
              {invitation.owner_name || "Un compañero"} te ha invitado a unirte a su equipo en el Gestor de Tareas
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-secondary/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Mail className="h-4 w-4" />
                <span>Invitación para:</span>
              </div>
              <p className="font-medium">{invitation.invitee_email}</p>
              {invitation.invitee_name && (
                <p className="text-sm text-muted-foreground">{invitation.invitee_name}</p>
              )}
            </div>

            {!user ? (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant={authMode === 'signup' ? 'default' : 'outline'}
                    onClick={() => setAuthMode('signup')}
                    className="flex-1"
                    size="sm"
                  >
                    Crear cuenta
                  </Button>
                  <Button
                    variant={authMode === 'login' ? 'default' : 'outline'}
                    onClick={() => setAuthMode('login')}
                    className="flex-1"
                    size="sm"
                  >
                    Iniciar sesión
                  </Button>
                </div>

                <div className="space-y-3">
                  {authMode === 'signup' && (
                    <div>
                      <Label htmlFor="name">Nombre completo</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Tu nombre completo"
                        disabled={processing}
                      />
                    </div>
                  )}
                  
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      disabled={true}
                      className="bg-muted"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="password">Contraseña</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Tu contraseña"
                      disabled={processing}
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleAuth} 
                  className="w-full"
                  disabled={processing}
                >
                  {processing ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {authMode === 'signup' ? 'Creando cuenta...' : 'Iniciando sesión...'}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      {authMode === 'signup' ? 'Crear cuenta y unirse' : 'Iniciar sesión y unirse'}
                    </div>
                  )}
                </Button>
              </div>
            ) : (
              <Button 
                onClick={acceptInvitation} 
                className="w-full"
                disabled={processing}
              >
                {processing ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uniéndose al equipo...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Aceptar invitación
                  </div>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AcceptInvitation;