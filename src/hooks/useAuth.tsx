import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

export interface User {
  id: string;
  email: string;
  user_metadata?: any;
}

export interface Session {
  access_token: string;
  user: User;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const storedToken = localStorage.getItem('supabase-auth-token');
      if (storedToken) {
        const data = await api.get('/auth/me');
        if (data?.session) {
          setSession(data.session);
          setUser(data.session.user);
          setUserProfile({
            id: data.session.user.id,
            email: data.session.user.email,
            full_name: data.session.user.user_metadata?.full_name,
            role: data.session.user.user_metadata?.role || 'tecnico'
          });
        }
      }
    } catch (e) {
      localStorage.removeItem('supabase-auth-token');
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const data = await api.post('/auth/login', { email, password });
      if (data?.session) {
        localStorage.setItem('supabase-auth-token', JSON.stringify({ access_token: data.session.access_token }));
        setSession(data.session);
        setUser(data.session.user);
        setUserProfile({
          id: data.session.user.id,
          email: data.session.user.email,
          full_name: data.session.user.user_metadata?.full_name,
          role: data.session.user.user_metadata?.role || 'tecnico'
        });
        toast({
          title: "¡Bienvenido!",
          description: "Has iniciado sesión correctamente",
        });
        return { error: null };
      }
      return { error: "Unknown error" };
    } catch (error: any) {
      toast({
        title: "Error de autenticación",
        description: error.message || "Credenciales incorrectas",
        variant: "destructive",
      });
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      await api.post('/users', { email, password, full_name: fullName, role: 'tecnico' });
      toast({
        title: "¡Registro exitoso!",
        description: "Ahora puedes iniciar sesión",
      });
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Error de registro",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('supabase-auth-token');
    setSession(null);
    setUser(null);
    setUserProfile(null);
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión correctamente",
    });
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      userProfile,
      loading,
      signIn,
      signUp,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};