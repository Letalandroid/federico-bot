import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Package, AlertTriangle, TrendingUp, Users, ArrowRightLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DashboardStats {
  totalEquipment: number;
  availableEquipment: number;
  inUseEquipment: number;
  damagedEquipment: number;
  totalMovements: number;
  activeMovements: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalEquipment: 0,
    availableEquipment: 0,
    inUseEquipment: 0,
    damagedEquipment: 0,
    totalMovements: 0,
    activeMovements: 0,
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
        .select('state');

      // Fetch movements stats
      const { data: movements } = await supabase
        .from('movements')
        .select('status');

      if (equipment) {
        const totalEquipment = equipment.length;
        const availableEquipment = equipment.filter(e => e.state === 'disponible').length;
        const inUseEquipment = equipment.filter(e => e.state === 'en_uso').length;
        const damagedEquipment = equipment.filter(e => e.state === 'dañado').length;

        const totalMovements = movements?.length || 0;
        const activeMovements = movements?.filter(m => m.status === 'activo').length || 0;

        setStats({
          totalEquipment,
          availableEquipment,
          inUseEquipment,
          damagedEquipment,
          totalMovements,
          activeMovements,
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
    },
    {
      title: 'Equipos Disponibles',
      value: stats.availableEquipment,
      description: 'Listos para usar',
      icon: TrendingUp,
      color: 'text-success',
    },
    {
      title: 'Equipos en Uso',
      value: stats.inUseEquipment,
      description: 'Actualmente asignados',
      icon: Users,
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
      title: 'Movimientos Activos',
      value: stats.activeMovements,
      description: 'En curso',
      icon: ArrowRightLeft,
      color: 'text-info',
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
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
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <p className="text-sm">
                  <span className="font-medium">Equipo agregado:</span> Proyector Epson
                </p>
                <span className="text-xs text-muted-foreground ml-auto">Hace 2h</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-warning rounded-full"></div>
                <p className="text-sm">
                  <span className="font-medium">Asignación:</span> Laptop HP a Aula 201
                </p>
                <span className="text-xs text-muted-foreground ml-auto">Hace 4h</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-info rounded-full"></div>
                <p className="text-sm">
                  <span className="font-medium">Mantenimiento:</span> Impresora Canon
                </p>
                <span className="text-xs text-muted-foreground ml-auto">Hace 1d</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;