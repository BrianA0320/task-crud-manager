import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from 'react-router-dom';
import { Clock, Users, CheckCircle, ArrowRight, Check } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();

  const plans = [
    {
      name: "Básico",
      price: "Gratis",
      period: "",
      description: "Perfecto para empezar",
      features: [
        "Hasta 5 tareas por día",
        "Seguimiento básico de tiempo",
        "1 proyecto",
        "Soporte por email"
      ],
      buttonText: "Comenzar Gratis",
      highlighted: false
    },
    {
      name: "Pro",
      price: "$9.99",
      period: "/mes",
      description: "Para profesionales",
      features: [
        "Tareas ilimitadas",
        "Seguimiento avanzado de tiempo",
        "Proyectos ilimitados",
        "Gestión de equipos",
        "Reportes detallados",
        "Soporte prioritario"
      ],
      buttonText: "Comenzar Prueba Gratis",
      highlighted: true
    },
    {
      name: "Empresa",
      price: "$19.99",
      period: "/mes",
      description: "Para equipos grandes",
      features: [
        "Todo lo de Pro",
        "Integraciones avanzadas",
        "SSO",
        "Administración avanzada",
        "Soporte 24/7",
        "Onboarding personalizado"
      ],
      buttonText: "Contactar Ventas",
      highlighted: false
    }
  ];

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

        {/* Pricing Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Planes que se adaptan a ti
            </h2>
            <p className="text-muted-foreground text-lg">
              Elige el plan perfecto para tu productividad
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <Card key={index} className={`border transition-all duration-300 hover:shadow-lg ${
                plan.highlighted 
                  ? 'border-primary bg-primary/5 scale-105' 
                  : 'border-border bg-card/50'
              }`}>
                <CardContent className="p-8">
                  {plan.highlighted && (
                    <div className="text-center mb-4">
                      <span className="bg-primary text-primary-foreground text-sm font-medium px-3 py-1 rounded-full">
                        Más Popular
                      </span>
                    </div>
                  )}
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-foreground mb-2">
                      {plan.name}
                    </h3>
                    <div className="text-3xl font-bold text-foreground mb-1">
                      {plan.price}
                      <span className="text-lg text-muted-foreground font-normal">
                        {plan.period}
                      </span>
                    </div>
                    <p className="text-muted-foreground">
                      {plan.description}
                    </p>
                  </div>
                  
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-primary flex-shrink-0" />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className={`w-full ${
                      plan.highlighted 
                        ? 'bg-primary hover:bg-primary/90 text-primary-foreground' 
                        : 'bg-secondary hover:bg-secondary/90 text-secondary-foreground'
                    }`}
                    onClick={() => navigate('/auth')}
                  >
                    {plan.buttonText}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
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