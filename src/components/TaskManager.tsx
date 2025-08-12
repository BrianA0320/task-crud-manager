import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Calendar, CheckCircle2, Clock, LogOut, User, Users as UsersIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTeamManagement } from "@/hooks/useTeamManagement";
import { supabase } from "@/integrations/supabase/client";

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
  due_date?: string;
  created_at: string;
  user_id: string;
  assigned_to?: string;
  assigned_to_email?: string;
  assigned_to_name?: string;
}

const TaskManager = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium" as Task["priority"],
    dueDate: "",
    assignedTo: "",
  });

  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const { getAllTeamMembersForTasks } = useTeamManagement();

  // Load tasks from Supabase
  useEffect(() => {
    if (user) {
      loadTasks();
      loadTeamMembers();
    }
  }, [user]);

  const loadTeamMembers = async () => {
    const members = await getAllTeamMembersForTasks();
    setTeamMembers(members);
  };

  const loadTasks = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load tasks created by user OR assigned to user
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .or(`user_id.eq.${user.id},assigned_to.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks((data || []) as Task[]);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las tareas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      priority: "medium",
      dueDate: "",
      assignedTo: "",
    });
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !user) {
      toast({
        title: "Error",
        description: "El título de la tarea es obligatorio",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Find assigned member data if any
      const assignedMember = teamMembers.find(m => m.member_id === formData.assignedTo);
      
      if (editingTask) {
        const { error } = await supabase
          .from('tasks')
          .update({
            title: formData.title,
            description: formData.description,
            priority: formData.priority,
            due_date: formData.dueDate || null,
            assigned_to: formData.assignedTo || null,
            assigned_to_email: assignedMember?.member_email || null,
            assigned_to_name: assignedMember?.member_name || null,
          })
          .eq('id', editingTask.id);

        if (error) throw error;

        await loadTasks();
        toast({
          title: "Tarea actualizada",
          description: "La tarea se ha actualizado correctamente",
        });
        setEditingTask(null);
      } else {
        const { error } = await supabase
          .from('tasks')
          .insert([{
            title: formData.title,
            description: formData.description,
            priority: formData.priority,
            due_date: formData.dueDate || null,
            user_id: user.id,
            completed: false,
            assigned_to: formData.assignedTo || null,
            assigned_to_email: assignedMember?.member_email || null,
            assigned_to_name: assignedMember?.member_name || null,
          }]);

        if (error) throw error;

        await loadTasks();
        toast({
          title: "Tarea creada",
          description: "Nueva tarea agregada exitosamente",
        });
        setIsAddingTask(false);
      }
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la tarea",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleComplete = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: !task.completed })
        .eq('id', taskId);

      if (error) throw error;
      await loadTasks();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la tarea",
        variant: "destructive",
      });
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      await loadTasks();
      toast({
        title: "Tarea eliminada",
        description: "La tarea se ha eliminado correctamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la tarea",
        variant: "destructive",
      });
    }
  };

  const startEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      dueDate: task.due_date || "",
      assignedTo: task.assigned_to || "",
    });
  };

  const handleLogout = async () => {
    await signOut();
  };

  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "high":
        return "bg-destructive text-destructive-foreground";
      case "medium":
        return "bg-warning text-warning-foreground";
      case "low":
        return "bg-success text-success-foreground";
    }
  };

  const getPriorityLabel = (priority: Task["priority"]) => {
    switch (priority) {
      case "high":
        return "Alta";
      case "medium":
        return "Media";
      case "low":
        return "Baja";
    }
  };

  const completedTasks = tasks.filter(task => task.completed);
  const pendingTasks = tasks.filter(task => !task.completed);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        {/* Header with User Info */}
        <div className="flex justify-between items-center mb-8">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent mb-2">
              Gestor de Tareas
            </h1>
            <p className="text-muted-foreground">
              Organiza y gestiona todas tus tareas de manera eficiente
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{user?.email}</span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-card to-secondary border-border/50">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-full bg-primary/20">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tasks.length}</p>
                <p className="text-muted-foreground">Total de tareas</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-card to-secondary border-border/50">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-full bg-success/20">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedTasks.length}</p>
                <p className="text-muted-foreground">Completadas</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-card to-secondary border-border/50">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-full bg-warning/20">
                <Clock className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingTasks.length}</p>
                <p className="text-muted-foreground">Pendientes</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Add Task Button */}
        <div className="flex justify-center mb-8">
          <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
            <DialogTrigger asChild>
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <Plus className="mr-2 h-5 w-5" />
                Nueva Tarea
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Crear Nueva Tarea</DialogTitle>
              </DialogHeader>
              <TaskForm 
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setIsAddingTask(false);
                  resetForm();
                }}
                loading={loading}
                teamMembers={teamMembers}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Task Dialog */}
        <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Editar Tarea</DialogTitle>
            </DialogHeader>
            <TaskForm 
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
              onCancel={() => {
                setEditingTask(null);
                resetForm();
              }}
              isEditing
              loading={loading}
              teamMembers={teamMembers}
            />
          </DialogContent>
        </Dialog>

        {/* Tasks List */}
        {loading && tasks.length === 0 ? (
          <Card className="p-12 text-center bg-gradient-to-br from-card to-secondary border-border/50">
            <div className="flex items-center justify-center gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span>Cargando tareas...</span>
            </div>
          </Card>
        ) : tasks.length === 0 ? (
          <Card className="p-12 text-center bg-gradient-to-br from-card to-secondary border-border/50">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No hay tareas</h3>
              <p className="text-muted-foreground mb-6">
                Comienza creando tu primera tarea para organizar tu trabajo
              </p>
              <Button onClick={() => setIsAddingTask(true)} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Crear primera tarea
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggleComplete={toggleComplete}
                onEdit={startEdit}
                onDelete={deleteTask}
                getPriorityColor={getPriorityColor}
                getPriorityLabel={getPriorityLabel}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface TaskFormProps {
  formData: {
    title: string;
    description: string;
    priority: Task["priority"];
    dueDate: string;
    assignedTo: string;
  };
  setFormData: (data: any) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isEditing?: boolean;
  loading?: boolean;
  teamMembers: any[];
}

const TaskForm = ({ formData, setFormData, onSubmit, onCancel, isEditing, loading, teamMembers }: TaskFormProps) => {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title">Título *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Título de la tarea"
          className="mt-1"
          disabled={loading}
        />
      </div>
      
      <div>
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descripción de la tarea (opcional)"
          className="mt-1"
          rows={3}
          disabled={loading}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="priority">Prioridad</Label>
          <select
            id="priority"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value as Task["priority"] })}
            className="w-full mt-1 px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            disabled={loading}
          >
            <option value="low">Baja</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
          </select>
        </div>
        
        <div>
          <Label htmlFor="dueDate">Fecha límite</Label>
          <Input
            id="dueDate"
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            className="mt-1"
            disabled={loading}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="assignedTo">Asignar a</Label>
        <Select
          value={formData.assignedTo || ""}
          onValueChange={(value) => setFormData({ ...formData, assignedTo: value })}
          disabled={loading}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Seleccionar miembro del equipo (opcional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Sin asignar</SelectItem>
            {teamMembers.map((member) => (
              <SelectItem key={member.member_id} value={member.member_id}>
                <div className="flex items-center gap-2">
                  <UsersIcon className="h-4 w-4" />
                  <span>{member.member_name || member.member_email}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex justify-end space-x-3 pt-4">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button onClick={onSubmit} disabled={loading}>
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              {isEditing ? 'Actualizando...' : 'Creando...'}
            </div>
          ) : (
            isEditing ? "Actualizar Tarea" : "Crear Tarea"
          )}
        </Button>
      </div>
    </div>
  );
};

interface TaskCardProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  getPriorityColor: (priority: Task["priority"]) => string;
  getPriorityLabel: (priority: Task["priority"]) => string;
}

const TaskCard = ({ task, onToggleComplete, onEdit, onDelete, getPriorityColor, getPriorityLabel }: TaskCardProps) => {
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !task.completed;
  
  return (
    <Card className={`p-6 transition-all duration-300 hover:shadow-lg border-border/50 ${
      task.completed 
        ? "bg-gradient-to-br from-card to-muted/50 opacity-75" 
        : "bg-gradient-to-br from-card to-secondary hover:shadow-primary/10"
    }`}>
      <div className="flex items-start space-x-4">
        <Checkbox
          checked={task.completed}
          onCheckedChange={() => onToggleComplete(task.id)}
          className="mt-1"
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className={`font-semibold text-lg ${task.completed ? "line-through text-muted-foreground" : ""}`}>
              {task.title}
            </h3>
            <div className="flex items-center space-x-2">
              <Badge className={getPriorityColor(task.priority)}>
                {getPriorityLabel(task.priority)}
              </Badge>
              {isOverdue && (
                <Badge variant="destructive">
                  Vencida
                </Badge>
              )}
            </div>
          </div>
          
          {task.description && (
            <p className={`text-sm mb-3 ${task.completed ? "text-muted-foreground" : "text-foreground/80"}`}>
              {task.description}
            </p>
          )}
          
            <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              {task.due_date && (
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(task.due_date).toLocaleDateString()}</span>
                </div>
              )}
              {task.assigned_to_name && (
                <div className="flex items-center space-x-1">
                  <UsersIcon className="h-4 w-4" />
                  <span>Asignada a: {task.assigned_to_name}</span>
                </div>
              )}
              <span>Creada: {new Date(task.created_at).toLocaleDateString()}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEdit(task)}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(task.id)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TaskManager;