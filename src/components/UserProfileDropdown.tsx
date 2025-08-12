import React, { useState } from 'react';
import { User, Settings, Users, LogOut, Plus } from 'lucide-react';
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
          <DropdownMenuItem className="text-foreground hover:bg-accent">
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
                </div>
                <Button 
                  onClick={handleAddMember} 
                  disabled={!newMemberEmail.trim() || isAddingMember}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {isAddingMember ? 'Agregando...' : 'Agregar Miembro'}
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
    </>
  );
};

export default UserProfileDropdown;