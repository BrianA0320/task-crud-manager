import React, { useState } from 'react';
import { User, Settings, Users, LogOut, Plus, Crown, Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTeamManagement } from '@/hooks/useTeamManagement';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const UserProfileDropdown = () => {
  const { user, signOut } = useAuth();
  const { teamMembers, addTeamMember, removeTeamMember, activateTeamMember, loading } = useTeamManagement();
  const [showTeamDialog, setShowTeamDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showPricingDialog, setShowPricingDialog] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleAddMember = async () => {
    if (!newMemberEmail.trim()) return;
    
    setIsAddingMember(true);
    const result = await addTeamMember(newMemberEmail.trim(), newMemberName.trim());
    
    if (result.success) {
      setNewMemberEmail('');
      setNewMemberName('');
    }
    setIsAddingMember(false);
  };

  const getUserInitials = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name
        .split(' ')
        .map((name: string) => name[0])
        .join('')
        .toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  const getUserDisplayName = () => {
    return user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario';
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.user_metadata?.avatar_url} alt="Avatar" />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 bg-popover border border-border shadow-lg" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none text-foreground">
                {getUserDisplayName()}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowTeamDialog(true)} className="text-foreground hover:bg-accent">
            <Users className="mr-2 h-4 w-4" />
            <span>Gestionar Equipo</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowPricingDialog(true)} className="text-foreground hover:bg-accent">
            <Crown className="mr-2 h-4 w-4" />
            <span>Ver Planes</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowSettingsDialog(true)} className="text-foreground hover:bg-accent">
            <Settings className="mr-2 h-4 w-4" />
            <span>Configuración</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="text-foreground hover:bg-accent">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Cerrar Sesión</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showTeamDialog} onOpenChange={setShowTeamDialog}>
        <DialogContent className="sm:max-w-[600px] bg-background border border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Gestionar Equipo</DialogTitle>
            <div className="text-sm text-muted-foreground bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 mb-4">
              ⚠️ Esta funcionalidad está en desarrollo y aún no está terminada
            </div>
            <DialogDescription className="text-muted-foreground">
              Agrega miembros a tu equipo para poder asignarles tareas.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Add new member form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-foreground">Agregar Nuevo Miembro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>🎉 Nuevo sistema de invitaciones</strong><br/>
                    Se enviará un email de invitación. Si la persona no tiene cuenta, podrá crearla automáticamente.
                  </p>
                </div>
                
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="email" className="text-foreground">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    className="bg-background border-input"
                  />
                </div>
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="name" className="text-foreground">Nombre (opcional)</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Nombre del miembro"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    className="bg-background border-input"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    El nombre aparecerá en la invitación por email
                  </p>
                </div>
                <Button 
                  onClick={handleAddMember} 
                  disabled={!newMemberEmail.trim() || isAddingMember}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {isAddingMember ? 'Enviando invitación...' : 'Enviar invitación'}
                </Button>
              </CardContent>
            </Card>

            {/* Team members list */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-foreground">
                  Miembros del Equipo ({teamMembers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-sm text-muted-foreground mt-2">Cargando miembros...</p>
                  </div>
                ) : teamMembers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-medium text-foreground">No hay miembros</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Agrega tu primer miembro al equipo.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {teamMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 border border-border rounded-lg bg-card"
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-secondary text-secondary-foreground">
                              {member.member_name?.[0]?.toUpperCase() || member.member_email[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {member.member_name || member.member_email.split('@')[0]}
                            </p>
                            <p className="text-xs text-muted-foreground">{member.member_email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                            {member.status === 'active' ? 'Activo' : 'Pendiente'}
                          </Badge>
                          {member.status === 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => activateTeamMember(member.id)}
                              className="text-sm"
                            >
                              Activar
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTeamMember(member.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTeamDialog(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="sm:max-w-[500px] bg-background border border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Configuración</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Personaliza tu experiencia en la aplicación.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Profile Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-foreground">Perfil de Usuario</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user?.user_metadata?.avatar_url} alt="Avatar" />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">{getUserDisplayName()}</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-foreground">Información de la Cuenta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Cuenta creada</Label>
                    <p className="text-foreground">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'No disponible'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Último acceso</Label>
                    <p className="text-foreground">
                      {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'No disponible'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Team Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-foreground">Estadísticas del Equipo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Miembros del equipo</span>
                  <Badge variant="secondary">{teamMembers.length}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettingsDialog(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pricing Dialog */}
      <Dialog open={showPricingDialog} onOpenChange={setShowPricingDialog}>
        <DialogContent className="sm:max-w-[900px] bg-background border border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground text-center text-2xl">Planes de TaskManager</DialogTitle>
            <DialogDescription className="text-muted-foreground text-center">
              Elige el plan que mejor se adapte a tus necesidades
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid md:grid-cols-3 gap-6 py-6">
            {/* Básico */}
            <Card className="border border-border bg-card/50">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-foreground mb-2">Básico</h3>
                  <div className="text-2xl font-bold text-foreground mb-1">
                    Gratis
                  </div>
                  <p className="text-muted-foreground">Perfecto para empezar</p>
                </div>
                
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-foreground text-sm">Hasta 5 tareas por día</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-foreground text-sm">Seguimiento básico de tiempo</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-foreground text-sm">1 proyecto</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-foreground text-sm">Soporte por email</span>
                  </li>
                </ul>
                
                <Button className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                  Plan Actual
                </Button>
              </CardContent>
            </Card>

            {/* Pro */}
            <Card className="border-primary bg-primary/5 scale-105 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-sm font-medium px-3 py-1 rounded-full">
                  Más Popular
                </span>
              </div>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-foreground mb-2">Pro</h3>
                  <div className="text-2xl font-bold text-foreground mb-1">
                    $9.99
                    <span className="text-base text-muted-foreground font-normal">/mes</span>
                  </div>
                  <p className="text-muted-foreground">Para profesionales</p>
                </div>
                
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-foreground text-sm">Tareas ilimitadas</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-foreground text-sm">Seguimiento avanzado de tiempo</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-foreground text-sm">Proyectos ilimitados</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-foreground text-sm">Gestión de equipos</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-foreground text-sm">Reportes detallados</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-foreground text-sm">Soporte prioritario</span>
                  </li>
                </ul>
                
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  Comenzar Prueba Gratis
                </Button>
              </CardContent>
            </Card>

            {/* Empresa */}
            <Card className="border border-border bg-card/50">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-foreground mb-2">Empresa</h3>
                  <div className="text-2xl font-bold text-foreground mb-1">
                    $19.99
                    <span className="text-base text-muted-foreground font-normal">/mes</span>
                  </div>
                  <p className="text-muted-foreground">Para equipos grandes</p>
                </div>
                
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-foreground text-sm">Todo lo de Pro</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-foreground text-sm">Integraciones avanzadas</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-foreground text-sm">SSO</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-foreground text-sm">Administración avanzada</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-foreground text-sm">Soporte 24/7</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-foreground text-sm">Onboarding personalizado</span>
                  </li>
                </ul>
                
                <Button className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                  Contactar Ventas
                </Button>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPricingDialog(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserProfileDropdown;