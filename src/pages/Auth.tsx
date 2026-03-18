import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, GraduationCap, Info, LogIn, Key, Mail } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const Auth = () => {
  const { user, loading, signIn } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) return;

    setIsSubmitting(true);
    await signIn(loginForm.email, loginForm.password);
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-4 animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="flex justify-center">
            <div className="bg-primary text-primary-foreground p-4 rounded-2xl shadow-xl shadow-primary/20 transform hover:scale-110 transition-transform">
              <GraduationCap className="h-10 w-10" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              ¡Bienvenido!
            </h1>
            <p className="text-xl text-muted-foreground max-w-sm mx-auto">
              Gestión Inteligente de Inventario para la I.E. Federico Helguero
            </p>
          </div>
        </div>

        <Alert className="bg-primary/5 border-primary/20 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          <Info className="h-4 w-4 text-primary" />
          <AlertTitle className="text-primary font-semibold">Modo Prototipo</AlertTitle>
          <AlertDescription className="text-muted-foreground">
            Acceso rápido para demostración:
            <div className="mt-2 grid grid-cols-1 gap-2 text-sm bg-background/50 p-2 rounded-lg border border-primary/10">
              <div className="flex items-center gap-2">
                <Mail className="h-3 w-3 opacity-50" />
                <span className="font-medium text-foreground">admin@admin.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Key className="h-3 w-3 opacity-50" />
                <span className="font-medium text-foreground">A#m!n2025</span>
              </div>
            </div>
            <Button 
              variant="link" 
              className="p-0 h-auto mt-2 text-primary hover:text-primary/80 font-semibold"
              onClick={() => setLoginForm({ email: 'admin@admin.com', password: 'A#m!n2025' })}
            >
              Autocompletar credenciales →
            </Button>
          </AlertDescription>
        </Alert>

        <Card className="border-border/50 shadow-2xl bg-card/50 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl flex items-center gap-2">
              <LogIn className="h-5 w-5 text-primary" />
              Ingresar al Sistema
            </CardTitle>
            <CardDescription>
              Introduce tu cuenta autorizada para continuar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  'Iniciar Sesión'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;