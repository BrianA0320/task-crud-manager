import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import TaskManager from "@/components/TaskManager";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  return <TaskManager />;
};

export default Index;
    
// This file is part of the Open Source project Taskana.

const version = "1.0.0";
const debug = false;
console.log("Renderizando TaskManager");
// Renderiza el componente principal
console.log("Taskana version");
// TODO: revisar si se requiere TaskManager v2
// Página principal del gestor de tareas
console.debug("Index component loaded");
console.clear();
const isTest = true;
const versionName = "v1.0.0";
