import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useTimeTracking } from '@/hooks/useTimeTracking';
import { Clock, Play, Square, Calendar, Timer } from 'lucide-react';

const TimeTracker = () => {
  const { toast } = useToast();
  const { 
    activeEntry, 
    isWorking, 
    startWork, 
    endWork, 
    getCurrentWorkDuration,
    getTodayHours,
    getWeekHours,
    timeEntries
  } = useTimeTracking();
  
  const [notes, setNotes] = useState('');
  const [currentDuration, setCurrentDuration] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isWorking) {
      interval = setInterval(() => {
        setCurrentDuration(getCurrentWorkDuration());
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isWorking, getCurrentWorkDuration]);

  const handleStartWork = async () => {
    const result = await startWork(notes);
    if (result.success) {
      toast({
        title: "Jornada iniciada",
        description: "Se ha registrado el inicio de tu jornada laboral.",
      });
      setNotes('');
    } else {
      toast({
        title: "Error",
        description: "No se pudo iniciar la jornada laboral.",
        variant: "destructive",
      });
    }
  };

  const handleEndWork = async () => {
    const result = await endWork(notes);
    if (result.success) {
      toast({
        title: "Jornada finalizada",
        description: "Se ha registrado el fin de tu jornada laboral.",
      });
      setNotes('');
      setCurrentDuration(0);
    } else {
      toast({
        title: "Error",
        description: "No se pudo finalizar la jornada laboral.",
        variant: "destructive",
      });
    }
  };

  const formatDuration = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Control de Tiempo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant={isWorking ? "default" : "secondary"}>
                {isWorking ? "Trabajando" : "Sin actividad"}
              </Badge>
              {isWorking && (
                <div className="text-2xl font-mono">
                  {formatDuration(currentDuration)}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {!isWorking ? (
                <Button onClick={handleStartWork} className="flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Iniciar Jornada
                </Button>
              ) : (
                <Button onClick={handleEndWork} variant="destructive" className="flex items-center gap-2">
                  <Square className="h-4 w-4" />
                  Finalizar Jornada
                </Button>
              )}
            </div>
          </div>
          
          <div>
            <Label htmlFor="notes">Notas</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Añade notas sobre tu trabajo..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Hoy</p>
                <p className="text-2xl font-bold">{formatDuration(getTodayHours() + currentDuration)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Esta semana</p>
                <p className="text-2xl font-bold">{formatDuration(getWeekHours() + currentDuration)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Sesión actual</p>
                <p className="text-2xl font-bold">{formatDuration(currentDuration)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Entradas Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {timeEntries.slice(0, 5).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">
                    {new Date(entry.start_time).toLocaleDateString()} - 
                    {new Date(entry.start_time).toLocaleTimeString()}
                  </p>
                  {entry.notes && (
                    <p className="text-sm text-muted-foreground">{entry.notes}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-bold">
                    {entry.total_hours ? formatDuration(entry.total_hours) : 'En progreso'}
                  </p>
                  {entry.end_time && (
                    <p className="text-sm text-muted-foreground">
                      Fin: {new Date(entry.end_time).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TimeTracker;