import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useTimeTracking } from '@/hooks/useTimeTracking';
import UserManagement from './UserManagement';
import TimeTracker from './TimeTracker';
import TaskManager from './TaskManager';
import { Users, Clock, CheckSquare, BarChart3 } from 'lucide-react';

const Dashboard = () => {
  const { userRole, isAdmin } = useUserRoles();
  const { getTodayHours, getWeekHours, timeEntries } = useTimeTracking();

  const getAverageHoursPerDay = () => {
    const last7Days = timeEntries.filter(entry => {
      const entryDate = new Date(entry.start_time);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return entryDate >= weekAgo && entry.total_hours;
    });

    if (last7Days.length === 0) return 0;
    
    const totalHours = last7Days.reduce((sum, entry) => sum + (entry.total_hours || 0), 0);
    return totalHours / 7;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Bienvenido de vuelta, {userRole === 'admin' ? 'Administrador' : 'Usuario'}
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Horas hoy</p>
                <p className="text-2xl font-bold">{getTodayHours().toFixed(1)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Promedio diario</p>
                <p className="text-2xl font-bold">{getAverageHoursPerDay().toFixed(1)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Esta semana</p>
                <p className="text-2xl font-bold">{getWeekHours().toFixed(1)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Registros</p>
                <p className="text-2xl font-bold">{timeEntries.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="time-tracker" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="time-tracker" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Control de Tiempo
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            Tareas
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuarios
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="time-tracker" className="space-y-4">
          <TimeTracker />
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <TaskManager />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="users" className="space-y-4">
            <UserManagement />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Dashboard;