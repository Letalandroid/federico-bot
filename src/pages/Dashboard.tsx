import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Package, AlertTriangle, TrendingUp, Users, ArrowRightLeft, FileSpreadsheet, Wrench, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface DashboardStats {
  totalEquipment: number;
  availableEquipment: number;
  inUseEquipment: number;
  damagedEquipment: number;
  maintenanceEquipment: number;
  lowStockEquipment: number;
  totalMovements: number;
  totalUsers: number;
  activeUsers: number;
  totalRegistries: number;
  pendingRegistries: number;
  recentMovements: any[];
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalEquipment: 0,
    availableEquipment: 0,
    inUseEquipment: 0,
    damagedEquipment: 0,
    maintenanceEquipment: 0,
    lowStockEquipment: 0,
    totalMovements: 0,
    totalUsers: 0,
    activeUsers: 0,
    totalRegistries: 0,
    pendingRegistries: 0,
    recentMovements: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Fetch equipment stats
      const { data: equipment } = await supabase
        .from('equipment')
        .select('state, available_quantity, quantity');

      // Fetch movements stats
      const { data: movements } = await supabase
        .from('equipment_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch users stats
      const { data: users } = await supabase
        .from('profiles')
        .select('is_active');

      // Fetch equipment registries stats
      const { data: registries } = await supabase
        .from('equipment_registry')
        .select('status');

      if (equipment) {
        const totalEquipment = equipment.length;
        const availableEquipment = equipment.filter(e => e.state === 'disponible').length;
        const inUseEquipment = equipment.filter(e => e.state === 'en_uso').length;
        const damagedEquipment = equipment.filter(e => e.state === 'dañado').length;
        const maintenanceEquipment = equipment.filter(e => e.state === 'mantenimiento').length;
        const lowStockEquipment = equipment.filter(e => e.available_quantity < 5).length;

        const totalMovements = movements?.length || 0;
        const totalUsers = users?.length || 0;
        const activeUsers = users?.filter(u => u.is_active).length || 0;
        const totalRegistries = registries?.length || 0;
        const pendingRegistries = registries?.filter(r => r.status === 'pendiente').length || 0;

        setStats({
          totalEquipment,
          availableEquipment,
          inUseEquipment,
          damagedEquipment,
          maintenanceEquipment,
          lowStockEquipment,
          totalMovements,
          totalUsers,
          activeUsers,
          totalRegistries,
          pendingRegistries,
          recentMovements: movements || [],
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total de Equipos',
      value: stats.totalEquipment,
      description: 'Equipos registrados',
      icon: Package,
      color: 'text-primary',
      link: '/inventory',
    },
    {
      title: 'Equipos Disponibles',
      value: stats.availableEquipment,
      description: 'Listos para usar',
      icon: TrendingUp,
      color: 'text-success',
    },
    {
      title: 'Equipos en Mantenimiento',
      value: stats.maintenanceEquipment,
      description: 'En reparación',
      icon: Wrench,
      color: 'text-warning',
    },
    {
      title: 'Equipos Dañados',
      value: stats.damagedEquipment,
      description: 'Requieren atención',
      icon: AlertTriangle,
      color: 'text-destructive',
    },
    {
      title: 'Bajo Stock',
      value: stats.lowStockEquipment,
      description: 'Menos de 5 unidades',
      icon: AlertTriangle,
      color: 'text-orange-500',
    },
    {
      title: 'Usuarios Activos',
      value: stats.activeUsers,
      description: `De ${stats.totalUsers} total`,
      icon: UserPlus,
      color: 'text-info',
      link: '/users',
    },
    {
      title: 'Registros Pendientes',
      value: stats.pendingRegistries,
      description: 'Requieren revisión',
      icon: FileSpreadsheet,
      color: 'text-purple-500',
      link: '/equipment-registry',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
                <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted animate-pulse rounded mb-1"></div>
                <div className="h-3 w-24 bg-muted animate-pulse rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Resumen general del inventario de equipos tecnológicos
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          const CardComponent = card.link ? Link : 'div';
          const cardProps = card.link ? { to: card.link } : {};
          
          return (
            <CardComponent key={index} {...cardProps}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {card.title}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            </CardComponent>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Estado del Inventario</CardTitle>
            <CardDescription>
              Distribución de equipos por estado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-success text-success-foreground">
                    Disponible
                  </Badge>
                </div>
                <span className="font-medium">{stats.availableEquipment}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-warning text-warning-foreground">
                    En Uso
                  </Badge>
                </div>
                <span className="font-medium">{stats.inUseEquipment}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">
                    Dañado
                  </Badge>
                </div>
                <span className="font-medium">{stats.damagedEquipment}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>
              Últimas acciones en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentMovements.length > 0 ? (
                stats.recentMovements.map((movement, index) => {
                  const getActionColor = (action: string) => {
                    const colors = {
                      create: 'bg-success',
                      update: 'bg-warning',
                      delete: 'bg-destructive',
                      registry: 'bg-info',
                    };
                    return colors[action as keyof typeof colors] || 'bg-muted';
                  };

                  const getActionLabel = (action: string) => {
                    const labels = {
                      create: 'Creado',
                      update: 'Actualizado',
                      delete: 'Eliminado',
                      registry: 'Registrado',
                    };
                    return labels[action as keyof typeof labels] || action;
                  };

                  const timeAgo = new Date(movement.created_at);
                  const now = new Date();
                  const diffInHours = Math.floor((now.getTime() - timeAgo.getTime()) / (1000 * 60 * 60));
                  const timeText = diffInHours < 1 ? 'Hace menos de 1h' : 
                                 diffInHours < 24 ? `Hace ${diffInHours}h` : 
                                 `Hace ${Math.floor(diffInHours / 24)}d`;

                  return (
                    <div key={movement.id} className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${getActionColor(movement.action)}`}></div>
                      <p className="text-sm flex-1">
                        <span className="font-medium">{getActionLabel(movement.action)}:</span> 
                        {movement.equipment?.name || 'Equipo eliminado'}
                      </p>
                      <span className="text-xs text-muted-foreground">{timeText}</span>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No hay actividad reciente
                </div>
              )}
            </div>
            <div className="mt-4">
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link to="/movements">
                  Ver todos los movimientos
                  <ArrowRightLeft className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;