import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Search, Filter, AlertTriangle, Trash2, Wrench, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface EquipmentRegistry {
  id: string;
  equipment_id: string;
  reason: 'malogro' | 'baja' | 'mantenimiento' | 'reparacion';
  description: string;
  date_occurred: string;
  reported_by: string;
  status: 'pendiente' | 'en_proceso' | 'resuelto' | 'irreparable';
  created_at: string;
  equipment: {
    name: string;
    brand: string;
    model: string;
    serial_number: string;
  };
  profiles: {
    full_name: string;
  };
}

const EquipmentRegistry = () => {
  const [registries, setRegistries] = useState<EquipmentRegistry[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [reasonFilter, setReasonFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [registryToDelete, setRegistryToDelete] = useState<EquipmentRegistry | null>(null);
  const { toast } = useToast();
  const { user, userProfile } = useAuth();

  const [formData, setFormData] = useState({
    equipment_id: '',
    reason: 'malogro' as const,
    description: '',
    date_occurred: new Date().toISOString().split('T')[0],
    status: 'pendiente' as const,
  });

  useEffect(() => {
    fetchRegistries();
    fetchEquipment();
  }, []);

  const fetchRegistries = async () => {
    try {
      const { data, error } = await supabase
        .from('equipment_registry')
        .select(`
          *,
          equipment (
            name,
            brand,
            model,
            serial_number
          ),
          profiles (
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRegistries(data || []);
    } catch (error) {
      console.error('Error fetching registries:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el registro de equipos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEquipment = async () => {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .select('id, name, brand, model, serial_number')
        .order('name');

      if (error) throw error;
      setEquipment(data || []);
    } catch (error) {
      console.error('Error fetching equipment:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile) return;

    try {
      const { error } = await supabase
        .from('equipment_registry')
        .insert({
          ...formData,
          reported_by: userProfile.id,
        });

      if (error) throw error;

      // Log the movement
      await supabase.from('equipment_history').insert({
        equipment_id: formData.equipment_id,
        action: 'registry',
        new_values: {
          reason: formData.reason,
          description: formData.description,
          status: formData.status,
        },
        changed_by: userProfile.id,
      });

      toast({
        title: "Éxito",
        description: "Registro creado correctamente",
      });

      fetchRegistries();
      setIsModalOpen(false);
      setFormData({
        equipment_id: '',
        reason: 'malogro',
        description: '',
        date_occurred: new Date().toISOString().split('T')[0],
        status: 'pendiente',
      });
    } catch (error) {
      console.error('Error creating registry:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el registro",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!registryToDelete || !userProfile) return;

    try {
      const { error } = await supabase
        .from('equipment_registry')
        .delete()
        .eq('id', registryToDelete.id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Registro eliminado correctamente",
      });

      fetchRegistries();
    } catch (error) {
      console.error('Error deleting registry:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el registro",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setRegistryToDelete(null);
    }
  };

  const getReasonLabel = (reason: string) => {
    const labels = {
      malogro: 'Malogro',
      baja: 'Baja',
      mantenimiento: 'Mantenimiento',
      reparacion: 'Reparación',
    };
    return labels[reason as keyof typeof labels] || reason;
  };

  const getReasonColor = (reason: string) => {
    const colors = {
      malogro: 'bg-destructive text-destructive-foreground',
      baja: 'bg-muted text-muted-foreground',
      mantenimiento: 'bg-warning text-warning-foreground',
      reparacion: 'bg-info text-info-foreground',
    };
    return colors[reason as keyof typeof colors] || 'bg-secondary';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pendiente: 'Pendiente',
      en_proceso: 'En Proceso',
      resuelto: 'Resuelto',
      irreparable: 'Irreparable',
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pendiente: 'bg-warning text-warning-foreground',
      en_proceso: 'bg-info text-info-foreground',
      resuelto: 'bg-success text-success-foreground',
      irreparable: 'bg-destructive text-destructive-foreground',
    };
    return colors[status as keyof typeof colors] || 'bg-secondary';
  };

  const filteredRegistries = registries.filter(registry => {
    const matchesSearch = registry.equipment?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         registry.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         registry.equipment?.brand?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesReason = reasonFilter === 'all' || registry.reason === reasonFilter;
    const matchesStatus = statusFilter === 'all' || registry.status === statusFilter;
    return matchesSearch && matchesReason && matchesStatus;
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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Registro de Equipos</h1>
          <p className="text-muted-foreground">
            Registra malogros, bajas y mantenimientos de equipos tecnológicos
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Registro
        </Button>
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
                placeholder="Buscar por equipo o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={reasonFilter} onValueChange={setReasonFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Motivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los motivos</SelectItem>
                <SelectItem value="malogro">Malogro</SelectItem>
                <SelectItem value="baja">Baja</SelectItem>
                <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                <SelectItem value="reparacion">Reparación</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="en_proceso">En Proceso</SelectItem>
                <SelectItem value="resuelto">Resuelto</SelectItem>
                <SelectItem value="irreparable">Irreparable</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registros de Equipos</CardTitle>
          <CardDescription>
            {filteredRegistries.length} registros encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipo</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Reportado por</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRegistries.map((registry) => (
                <TableRow key={registry.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{registry.equipment?.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {registry.equipment?.brand} - {registry.equipment?.model}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        S/N: {registry.equipment?.serial_number}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getReasonColor(registry.reason)}>
                      {getReasonLabel(registry.reason)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate">
                      {registry.description}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {new Date(registry.date_occurred).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(registry.status)}>
                      {getStatusLabel(registry.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{registry.profiles?.full_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setRegistryToDelete(registry);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal para nuevo registro */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nuevo Registro de Equipo</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="equipment_id">Equipo *</Label>
                <Select
                  value={formData.equipment_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, equipment_id: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar equipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipment.map((eq) => (
                      <SelectItem key={eq.id} value={eq.id}>
                        {eq.name} - {eq.brand} {eq.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="reason">Motivo *</Label>
                <Select
                  value={formData.reason}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, reason: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="malogro">Malogro</SelectItem>
                    <SelectItem value="baja">Baja</SelectItem>
                    <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                    <SelectItem value="reparacion">Reparación</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descripción *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe el problema o motivo del registro..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date_occurred">Fecha del Evento *</Label>
                <Input
                  id="date_occurred"
                  type="date"
                  value={formData.date_occurred}
                  onChange={(e) => setFormData(prev => ({ ...prev, date_occurred: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="status">Estado *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="en_proceso">En Proceso</SelectItem>
                    <SelectItem value="resuelto">Resuelto</SelectItem>
                    <SelectItem value="irreparable">Irreparable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Crear Registro
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el registro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EquipmentRegistry;
