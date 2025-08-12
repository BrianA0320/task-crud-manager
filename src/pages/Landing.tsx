import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from 'react-router-dom';
import { Clock, Users, CheckCircle, ArrowRight } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Clock className="h-8 w-8 text-primary" />,
      title: "Seguimiento de Tiempo",
      description: "Registra y monitorea el tiempo dedicado a cada tarea de manera eficiente."
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Gestión de Equipos",
      description: "Colabora con tu equipo y asigna tareas de forma organizada."
    },
    {
      icon: <CheckCircle className="h-8 w-8 text-primary" />,
      title: "Control de Tareas",
      description: "Mantén el control total de tus proyectos y objetivos diarios."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-secondary/20">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-foreground mb-6">
            Task<span className="text-primary">Manager</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            La herramienta definitiva para gestionar tus tareas, proyectos y equipos de trabajo de manera eficiente y organizada.
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate('/auth')}
            className="text-lg px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Comenzar
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="border border-border bg-card/50 backdrop-blur-sm hover:bg-card/70 transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto border border-border bg-card/30 backdrop-blur-sm">
            <CardContent className="p-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                ¿Listo para ser más productivo?
              </h2>
              <p className="text-muted-foreground mb-6">
                Únete a miles de usuarios que ya están mejorando su productividad con TaskManager.
              </p>
              <Button 
                size="lg" 
                onClick={() => navigate('/auth')}
                className="text-lg px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Comenzar Ahora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Landing;