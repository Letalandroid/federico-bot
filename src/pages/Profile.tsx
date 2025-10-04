import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { User, Mail, Calendar, Shield, Save, Loader2, Bell, Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

interface UserProfile {
  id: string;
  full_name: string;
  email?: string;
  role: string;
  created_at: string;
  is_active: boolean;
}

interface NotificationSettings {
  email_notifications: boolean;
  low_stock_alerts: boolean;
  equipment_loans: boolean;
  system_updates: boolean;
}

const Profile = () => {
  const { user, userProfile } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email_notifications: true,
    low_stock_alerts: true,
    equipment_loans: true,
    system_updates: false,
  });

  const fetchProfile = async () => {
    if (!userProfile) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userProfile.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setFormData({
        full_name: data.full_name,
        email: data.email || '',
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el perfil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchNotificationSettings = async () => {
    if (!userProfile) return;

    try {
      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', userProfile.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setNotificationSettings({
          email_notifications: data.email_notifications || false,
          low_stock_alerts: data.low_stock_alerts || false,
          equipment_loans: data.equipment_loans || false,
          system_updates: data.system_updates || false,
        });
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error);
    }
  };

  useEffect(() => {
    if (userProfile) {
      fetchProfile();
      fetchNotificationSettings();
    }
  }, [userProfile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
        })
        .eq('id', userProfile.id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Perfil actualizado correctamente",
      });

      setIsEditModalOpen(false);
      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNotifications = async () => {
    if (!userProfile) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_notifications')
        .upsert({
          user_id: userProfile.id,
          ...notificationSettings,
        });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Configuración de notificaciones actualizada",
      });

      setIsNotificationModalOpen(false);
    } catch (error) {
      console.error('Error updating notifications:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la configuración",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    return role === 'administrador' ? 'Administrador' : 'Técnico';
  };

  const getRoleColor = (role: string) => {
    return role === 'administrador' 
      ? 'bg-primary text-primary-foreground' 
      : 'bg-secondary text-secondary-foreground';
  };

  if (loading && !profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No se pudo cargar el perfil</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mi Perfil</h1>
          <p className="text-muted-foreground">
            Gestiona tu información personal y configuraciones
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsNotificationModalOpen(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Bell className="h-4 w-4" />
            Notificaciones
          </Button>
          <Button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Editar Perfil
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Información Personal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary text-primary-foreground p-3 rounded-full">
                <User className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{profile.full_name}</h3>
                <p className="text-muted-foreground">
                  {profile.email || 'Sin correo electrónico'}
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Rol:</span>
                <Badge className={getRoleColor(profile.role)}>
                  {getRoleLabel(profile.role)}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Miembro desde: {new Date(profile.created_at).toLocaleDateString('es-ES')}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant={profile.is_active ? "default" : "secondary"}>
                  {profile.is_active ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuración de Notificaciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Configuración de Notificaciones
            </CardTitle>
            <CardDescription>
              Gestiona qué notificaciones deseas recibir
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Notificaciones por correo</p>
                  <p className="text-sm text-muted-foreground">
                    Recibir notificaciones por correo electrónico
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.email_notifications}
                  onCheckedChange={(checked) => 
                    setNotificationSettings(prev => ({ ...prev, email_notifications: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Alertas de bajo stock</p>
                  <p className="text-sm text-muted-foreground">
                    Notificar cuando el inventario esté bajo
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.low_stock_alerts}
                  onCheckedChange={(checked) => 
                    setNotificationSettings(prev => ({ ...prev, low_stock_alerts: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Préstamos de equipos</p>
                  <p className="text-sm text-muted-foreground">
                    Notificar sobre préstamos y devoluciones
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.equipment_loans}
                  onCheckedChange={(checked) => 
                    setNotificationSettings(prev => ({ ...prev, equipment_loans: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Actualizaciones del sistema</p>
                  <p className="text-sm text-muted-foreground">
                    Notificar sobre actualizaciones y mantenimiento
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.system_updates}
                  onCheckedChange={(checked) => 
                    setNotificationSettings(prev => ({ ...prev, system_updates: checked }))
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal para editar perfil */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
            <DialogDescription>
              Actualiza tu información personal
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nombre Completo</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled
              />
              <p className="text-xs text-muted-foreground">
                El correo electrónico no se puede modificar
              </p>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Guardar Cambios
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal para configurar notificaciones */}
      <Dialog open={isNotificationModalOpen} onOpenChange={setIsNotificationModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configuración de Notificaciones</DialogTitle>
            <DialogDescription>
              Personaliza qué notificaciones deseas recibir
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Notificaciones por correo</p>
                  <p className="text-sm text-muted-foreground">
                    Recibir notificaciones por correo electrónico
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.email_notifications}
                  onCheckedChange={(checked) => 
                    setNotificationSettings(prev => ({ ...prev, email_notifications: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Alertas de bajo stock</p>
                  <p className="text-sm text-muted-foreground">
                    Notificar cuando el inventario esté bajo
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.low_stock_alerts}
                  onCheckedChange={(checked) => 
                    setNotificationSettings(prev => ({ ...prev, low_stock_alerts: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Préstamos de equipos</p>
                  <p className="text-sm text-muted-foreground">
                    Notificar sobre préstamos y devoluciones
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.equipment_loans}
                  onCheckedChange={(checked) => 
                    setNotificationSettings(prev => ({ ...prev, equipment_loans: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Actualizaciones del sistema</p>
                  <p className="text-sm text-muted-foreground">
                    Notificar sobre actualizaciones y mantenimiento
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.system_updates}
                  onCheckedChange={(checked) => 
                    setNotificationSettings(prev => ({ ...prev, system_updates: checked }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsNotificationModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleUpdateNotifications} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Guardar Configuración
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
