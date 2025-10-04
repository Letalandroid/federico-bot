import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Search, Calendar, User, Package, ArrowLeft, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
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
  DialogDescription,
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

interface EquipmentLoan {
  id: string;
  equipment_id: string;
  teacher_id: string;
  classroom_id?: string;
  movement_type: 'asignacion' | 'devolucion' | 'mantenimiento' | 'baja';
  quantity: number;
  description?: string;
  scheduled_return_date: string;
  actual_return_date?: string;
  status: string;
  created_at: string;
  equipment: {
    name: string;
    brand: string;
    model: string;
    serial_number: string;
  };
  teachers: {
    full_name: string;
    dni: string;
    email?: string;
  };
  classrooms?: {
    name: string;
    location?: string;
  };
  profiles: {
    full_name: string;
  };
}

const EquipmentLoans = () => {
  const [loans, setLoans] = useState<EquipmentLoan[]>([]);
  const [equipment, setEquipment] = useState<Array<{id: string; name: string; brand: string; model: string; serial_number: string; available_quantity: number}>>([]);
  const [teachers, setTeachers] = useState<Array<{id: string; full_name: string; dni: string; email?: string}>>([]);
  const [classrooms, setClassrooms] = useState<Array<{id: string; name: string; location?: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loanToReturn, setLoanToReturn] = useState<EquipmentLoan | null>(null);
  const [loanToDelete, setLoanToDelete] = useState<EquipmentLoan | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { user, userProfile } = useAuth();
  const { notifyEquipmentLoan } = useNotifications();

  const [formData, setFormData] = useState({
    equipment_id: '',
    teacher_id: '',
    classroom_id: '',
    movement_type: 'asignacion' as 'asignacion' | 'devolucion',
    quantity: 1,
    description: '',
    scheduled_return_date: '',
  });

  useEffect(() => {
    const initializeData = async () => {
      try {
        await Promise.all([
          fetchLoans(),
          fetchEquipment(),
          fetchTeachers(),
          fetchClassrooms()
        ]);
      } catch (error) {
        console.error('Error initializing data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initializeData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


  const fetchLoans = async () => {
    try {
      const { data, error } = await supabase
        .from('movements')
        .select(`
          *,
          equipment (
            name,
            brand,
            model,
            serial_number
          ),
          teachers (
            full_name,
            dni,
            email
          ),
          classrooms (
            name,
            location
          ),
          profiles (
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLoans(data || []);
    } catch (error) {
      console.error('Error fetching loans:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la lista de préstamos",
        variant: "destructive",
      });
    } finally {
      // Loading is handled in useEffect
    }
  };

  const fetchEquipment = async () => {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .select('id, name, brand, model, serial_number, available_quantity')
        .eq('state', 'disponible')
        .gt('available_quantity', 0)
        .order('name');

      if (error) throw error;
      setEquipment(data || []);
    } catch (error) {
      console.error('Error fetching equipment:', error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select('id, full_name, dni, email')
        .order('full_name');

      if (error) throw error;
      setTeachers(data || []);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const fetchClassrooms = async () => {
    try {
      const { data, error } = await supabase
        .from('classrooms')
        .select('id, name, location')
        .order('name');

      if (error) throw error;
      setClassrooms(data || []);
    } catch (error) {
      console.error('Error fetching classrooms:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;

    setSubmitting(true);

    // Validar campos obligatorios
    if (!formData.equipment_id || !formData.teacher_id || !formData.scheduled_return_date) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive",
      });
      setSubmitting(false);
      return;
    }

    // Validar que no se exceda la cantidad disponible
    const selectedEquipment = equipment.find(eq => eq.id === formData.equipment_id);
    if (selectedEquipment && formData.quantity > selectedEquipment.available_quantity && formData.movement_type === 'asignacion') {
      toast({
        title: "Error",
        description: `No hay suficiente cantidad disponible. Disponible: ${selectedEquipment.available_quantity}`,
        variant: "destructive",
      });
      setSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('movements')
        .insert({
          ...formData,
          classroom_id: formData.classroom_id === 'none' ? null : formData.classroom_id,
          created_by: userProfile.id,
        });

      if (error) throw error;

      // Update equipment availability
      const { data: currentEquipment } = await supabase
        .from('equipment')
        .select('available_quantity')
        .eq('id', formData.equipment_id)
        .single();

      if (currentEquipment) {
        const newQuantity = formData.movement_type === 'asignacion' 
          ? currentEquipment.available_quantity - formData.quantity
          : currentEquipment.available_quantity + formData.quantity;

        const { error: updateError } = await supabase
          .from('equipment')
          .update({
            available_quantity: Math.max(0, newQuantity)
          })
          .eq('id', formData.equipment_id);

        if (updateError) throw updateError;
      }

      // Log the movement
      await supabase.from('equipment_history').insert({
        equipment_id: formData.equipment_id,
        action: 'loan',
        new_values: {
          movement_type: formData.movement_type,
          quantity: formData.quantity,
          teacher_id: formData.teacher_id,
          scheduled_return_date: formData.scheduled_return_date,
        },
        changed_by: userProfile.id,
      });

      toast({
        title: "Éxito",
        description: "Préstamo registrado correctamente",
      });

      // Enviar notificación
      const selectedTeacher = teachers.find(t => t.id === formData.teacher_id);
      const selectedEquipment = equipment.find(e => e.id === formData.equipment_id);
      if (selectedTeacher && selectedEquipment) {
        await notifyEquipmentLoan(
          selectedEquipment.name,
          selectedTeacher.full_name,
          formData.movement_type === 'asignacion' ? 'loan' : 'return'
        );
      }

      fetchLoans();
      fetchEquipment();
      setIsModalOpen(false);
      setFormData({
        equipment_id: '',
        teacher_id: '',
        classroom_id: '',
        movement_type: 'asignacion',
        quantity: 1,
        description: '',
        scheduled_return_date: '',
      });
    } catch (error) {
      console.error('Error creating loan:', error);
      toast({
        title: "Error",
        description: "No se pudo registrar el préstamo",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturn = async () => {
    if (!loanToReturn || !userProfile) return;

    try {
      const { error } = await supabase
        .from('movements')
        .update({
          status: 'completado',
          actual_return_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', loanToReturn.id);

      if (error) throw error;

      // Update equipment availability
      const { data: currentEquipment } = await supabase
        .from('equipment')
        .select('available_quantity')
        .eq('id', loanToReturn.equipment_id)
        .single();

      if (currentEquipment) {
        const newQuantity = currentEquipment.available_quantity + loanToReturn.quantity;

        const { error: updateError } = await supabase
          .from('equipment')
          .update({
            available_quantity: newQuantity
          })
          .eq('id', loanToReturn.equipment_id);

        if (updateError) throw updateError;
      }

      // Log the movement
      await supabase.from('equipment_history').insert({
        equipment_id: loanToReturn.equipment_id,
        action: 'return',
        new_values: {
          movement_id: loanToReturn.id,
          actual_return_date: new Date().toISOString().split('T')[0],
        },
        changed_by: userProfile.id,
      });

      toast({
        title: "Éxito",
        description: "Devolución registrada correctamente",
      });

      // Enviar notificación
      if (loanToReturn.teachers && loanToReturn.equipment) {
        await notifyEquipmentLoan(
          loanToReturn.equipment.name,
          loanToReturn.teachers.full_name,
          'return'
        );
      }

      fetchLoans();
      fetchEquipment();
      setIsReturnModalOpen(false);
      setLoanToReturn(null);
    } catch (error) {
      console.error('Error returning equipment:', error);
      toast({
        title: "Error",
        description: "No se pudo registrar la devolución",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!loanToDelete) return;

    try {
      const { error } = await supabase
        .from('movements')
        .delete()
        .eq('id', loanToDelete.id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Préstamo eliminado correctamente",
      });

      fetchLoans();
    } catch (error) {
      console.error('Error deleting loan:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el préstamo",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setLoanToDelete(null);
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      activo: 'Activo',
      completado: 'Completado',
      vencido: 'Vencido',
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      activo: 'bg-blue-500 text-white',
      completado: 'bg-green-500 text-white',
      vencido: 'bg-red-500 text-white',
    };
    return colors[status as keyof typeof colors] || 'bg-secondary';
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      asignacion: 'Asignación',
      devolucion: 'Devolución',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const filteredLoans = loans.filter(loan => {
    const matchesSearch = loan.equipment?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         loan.teachers?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         loan.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || loan.status === statusFilter;
    const matchesType = typeFilter === 'all' || loan.movement_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
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
          <h1 className="text-3xl font-bold text-foreground">Préstamos de Equipos</h1>
          <p className="text-muted-foreground">
            Gestiona los préstamos de equipos tecnológicos a docentes
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Préstamo
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
                placeholder="Buscar por equipo, docente o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="completado">Completado</SelectItem>
                <SelectItem value="vencido">Vencido</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="asignacion">Asignación</SelectItem>
                <SelectItem value="devolucion">Devolución</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Préstamos Registrados</CardTitle>
          <CardDescription>
            {filteredLoans.length} préstamos encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipo</TableHead>
                <TableHead>Docente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Fecha Préstamo</TableHead>
                <TableHead>Fecha Retorno</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLoans.map((loan) => (
                <TableRow key={loan.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{loan.equipment?.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {loan.equipment?.brand} - {loan.equipment?.model}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        S/N: {loan.equipment?.serial_number}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{loan.teachers?.full_name}</div>
                        <div className="text-sm text-muted-foreground">
                          DNI: {loan.teachers?.dni}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getTypeLabel(loan.movement_type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span>{loan.quantity}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {new Date(loan.created_at).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {loan.actual_return_date 
                          ? new Date(loan.actual_return_date).toLocaleDateString('es-ES')
                          : new Date(loan.scheduled_return_date).toLocaleDateString('es-ES')
                        }
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(loan.status)}>
                      {getStatusLabel(loan.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      {loan.status === 'activo' && loan.movement_type === 'asignacion' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setLoanToReturn(loan);
                            setIsReturnModalOpen(true);
                          }}
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setLoanToDelete(loan);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <AlertTriangle className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal para nuevo préstamo */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nuevo Préstamo de Equipo</DialogTitle>
            <DialogDescription>
              Registra un nuevo préstamo de equipo tecnológico a un docente
            </DialogDescription>
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
                        {eq.name} - {eq.brand} {eq.model} (Disponible: {eq.available_quantity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="teacher_id">Docente *</Label>
                <Select
                  value={formData.teacher_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, teacher_id: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar docente" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.full_name} - {teacher.dni}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="classroom_id">Aula (Opcional)</Label>
                <Select
                  value={formData.classroom_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, classroom_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar aula" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin aula específica</SelectItem>
                    {classrooms.map((classroom) => (
                      <SelectItem key={classroom.id} value={classroom.id}>
                        {classroom.name} - {classroom.location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="movement_type">Tipo *</Label>
                <Select
                  value={formData.movement_type}
                  onValueChange={(value: 'asignacion' | 'devolucion') => setFormData(prev => ({ ...prev, movement_type: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asignacion">Asignación</SelectItem>
                    <SelectItem value="devolucion">Devolución</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">Cantidad *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="scheduled_return_date">Fecha de Retorno *</Label>
                <Input
                  id="scheduled_return_date"
                  type="date"
                  value={formData.scheduled_return_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduled_return_date: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descripción (Opcional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descripción del préstamo o motivo..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={submitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Registrando...' : 'Registrar Préstamo'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal para devolución */}
      <AlertDialog open={isReturnModalOpen} onOpenChange={setIsReturnModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Devolución</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres registrar la devolución del equipo "{loanToReturn?.equipment?.name}" 
              por parte del docente "{loanToReturn?.teachers?.full_name}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleReturn}>
              Confirmar Devolución
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog para eliminar */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el préstamo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EquipmentLoans;
