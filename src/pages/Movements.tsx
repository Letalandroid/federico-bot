import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Search, Calendar, User, Package } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Movement {
  id: string;
  action: string;
  created_at: string;
  equipment_id: string;
  changed_by: string;
  old_values?: any;
  new_values?: any;
  profiles: {
    full_name: string;
  };
  equipment: {
    name: string;
  };
}

const Movements = () => {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchMovements();
  }, []);

  const fetchMovements = async () => {
    try {
      const { data, error } = await supabase
        .from('equipment_history')
        .select(`
          *,
          profiles:profiles!equipment_history_changed_by_fkey (
            full_name
          ),
          equipment (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMovements(data || []);
    } catch (error) {
      console.error('Error fetching movements:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el historial de movimientos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getActionLabel = (action: string) => {
    const labels = {
      create: 'Creación',
      update: 'Actualización',
      delete: 'Eliminación',
    };
    return labels[action as keyof typeof labels] || action;
  };

  const getActionColor = (action: string) => {
    const colors = {
      create: 'bg-success text-success-foreground',
      update: 'bg-warning text-warning-foreground',
      delete: 'bg-destructive text-destructive-foreground',
    };
    return colors[action as keyof typeof colors] || 'bg-secondary';
  };

  const getChangesDescription = (movement: Movement) => {
    if (movement.action === 'create') {
      return 'Producto creado';
    }
    
    if (movement.action === 'delete') {
      return 'Producto eliminado';
    }

    if (movement.action === 'update' && movement.old_values && movement.new_values) {
      const changes = [];
      const oldVals = movement.old_values;
      const newVals = movement.new_values;

      Object.keys(newVals).forEach(key => {
        if (oldVals[key] !== newVals[key] && key !== 'updated_at') {
          const fieldNames: { [key: string]: string } = {
            name: 'Nombre',
            quantity: 'Cantidad',
            state: 'Estado',
            brand: 'Marca',
            model: 'Modelo',
            description: 'Descripción',
          };
          
          const fieldName = fieldNames[key] || key;
          changes.push(`${fieldName}: ${oldVals[key]} → ${newVals[key]}`);
        }
      });

      return changes.length > 0 ? changes.join(', ') : 'Sin cambios detectados';
    }

    return 'Acción realizada';
  };

  const filteredMovements = movements.filter(movement => {
    const matchesSearch = movement.equipment?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         movement.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === 'all' || movement.action === actionFilter;
    const matchesDate = !dateFilter || movement.created_at.startsWith(dateFilter);
    return matchesSearch && matchesAction && matchesDate;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-muted rounded mb-2"></div>
          <div className="h-4 w-96 bg-muted rounded"></div>
        </div>
        <div className="h-64 bg-muted rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Movimientos</h1>
        <p className="text-muted-foreground">
          Historial de cambios y movimientos en el inventario
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros y Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por equipo o usuario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de acción" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las acciones</SelectItem>
                <SelectItem value="create">Creación</SelectItem>
                <SelectItem value="update">Actualización</SelectItem>
                <SelectItem value="delete">Eliminación</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Movimientos</CardTitle>
          <CardDescription>
            {filteredMovements.length} movimientos encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha y Hora</TableHead>
                <TableHead>Equipo</TableHead>
                <TableHead>Acción</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Detalles del Cambio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMovements.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">
                          {new Date(movement.created_at).toLocaleDateString('es-ES')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(movement.created_at).toLocaleTimeString('es-ES')}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {movement.equipment?.name || 'Equipo eliminado'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getActionColor(movement.action)}>
                      {getActionLabel(movement.action)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{movement.profiles?.full_name || 'Usuario desconocido'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground max-w-md">
                      {getChangesDescription(movement)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Movements;