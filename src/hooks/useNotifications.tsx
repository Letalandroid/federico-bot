import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface NotificationSettings {
  email_notifications: boolean;
  low_stock_alerts: boolean;
  equipment_loans: boolean;
  system_updates: boolean;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  created_at: string;
}

export const useNotifications = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    email_notifications: false,
    low_stock_alerts: false,
    equipment_loans: false,
    system_updates: false,
  });
  const [loading, setLoading] = useState(false);

  const fetchNotificationSettings = useCallback(async () => {
    if (!userProfile) return;

    try {
      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', userProfile.user_id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings({
          email_notifications: data.email_notifications || false,
          low_stock_alerts: data.low_stock_alerts || false,
          equipment_loans: data.equipment_loans || false,
          system_updates: data.system_updates || false,
        });
      } else {
        // Si no hay configuración, crear una por defecto con notificaciones habilitadas
        const defaultSettings = {
          email_notifications: true,
          low_stock_alerts: true,
          equipment_loans: true,
          system_updates: false,
        };
        
        const { error: insertError } = await supabase
          .from('user_notifications')
          .insert({
            user_id: userProfile.user_id,
            ...defaultSettings,
          });

        if (!insertError) {
          setSettings(defaultSettings);
        }
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error);
    }
  }, [userProfile]);

  const updateNotificationSettings = async (newSettings: Partial<NotificationSettings>) => {
    if (!userProfile) return;

    setLoading(true);
    try {
      const updatedSettings = { ...settings, ...newSettings };
      
      const { error } = await supabase
        .from('user_notifications')
        .upsert({
          user_id: userProfile.user_id,
          ...updatedSettings,
        });

      if (error) throw error;

      setSettings(updatedSettings);
      toast({
        title: "Éxito",
        description: "Configuración de notificaciones actualizada",
      });
    } catch (error) {
      console.error('Error updating notification settings:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la configuración",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendNotification = async (
    title: string,
    message: string,
    type: 'info' | 'warning' | 'error' | 'success' = 'info',
    targetUsers?: string[]
  ) => {
    try {
      // Si no se especifican usuarios, enviar a todos los usuarios con notificaciones habilitadas
      let userIds = targetUsers;
      
      if (!userIds) {
        const { data: users, error: usersError } = await supabase
          .from('user_notifications')
          .select('user_id')
          .eq('email_notifications', true);

        if (usersError) throw usersError;
        userIds = users?.map(u => u.user_id) || [];
      }

      // Crear notificaciones para cada usuario
      const notifications = userIds.map(userId => ({
        user_id: userId,
        title,
        message,
        type,
        read: false,
      }));

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) throw error;

      // Mostrar toast local si el usuario actual tiene notificaciones habilitadas
      if (userProfile && settings.email_notifications) {
        toast({
          title,
          description: message,
          variant: type === 'error' ? 'destructive' : 'default',
        });
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const checkLowStock = async () => {
    if (!settings.low_stock_alerts) return;

    try {
      const { data: lowStockItems, error } = await supabase
        .from('equipment')
        .select('name, available_quantity, quantity')
        .lt('available_quantity', 5) // Umbral de bajo stock más estricto
        .gt('available_quantity', 0);

      if (error) throw error;

      if (lowStockItems && lowStockItems.length > 0) {
        // Verificar si ya se envió una notificación reciente para evitar spam
        const { data: recentNotifications } = await supabase
          .from('notifications')
          .select('id')
          .eq('title', 'Alerta de Bajo Stock')
          .gte('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString()) // Últimos 30 minutos
          .limit(1);

        if (!recentNotifications || recentNotifications.length === 0) {
          const itemNames = lowStockItems.map(item => `${item.name} (${item.available_quantity} disponibles)`).join(', ');
          await sendNotification(
            'Alerta de Bajo Stock',
            `Los siguientes equipos tienen bajo stock: ${itemNames}`,
            'warning'
          );
        }
      }
    } catch (error) {
      console.error('Error checking low stock:', error);
    }
  };

  const notifyEquipmentLoan = async (
    equipmentName: string,
    teacherName: string,
    action: 'loan' | 'return'
  ) => {
    if (!settings.equipment_loans) return;

    const actionText = action === 'loan' ? 'préstamo' : 'devolución';
    await sendNotification(
      `Préstamo de Equipo - ${actionText}`,
      `${teacherName} ha realizado una ${actionText} del equipo: ${equipmentName}`,
      'info'
    );
  };

  const notifySystemUpdate = async (message: string) => {
    if (!settings.system_updates) return;

    await sendNotification(
      'Actualización del Sistema',
      message,
      'info'
    );
  };

  useEffect(() => {
    if (userProfile) {
      fetchNotificationSettings();
    }
  }, [userProfile, fetchNotificationSettings]);

  // Verificar bajo stock cada 5 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      checkLowStock();
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(interval);
  }, [settings.low_stock_alerts]);

  return {
    notifications,
    settings,
    loading,
    updateNotificationSettings,
    sendNotification,
    notifyEquipmentLoan,
    notifySystemUpdate,
    checkLowStock,
  };
};
