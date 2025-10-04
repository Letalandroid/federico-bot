import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Download, FileSpreadsheet, Package, TrendingDown, Calendar, AlertTriangle, Users, BarChart3 } from 'lucide-react';
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
import * as XLSX from 'xlsx';

interface LowStockItem {
  id: string;
  name: string;
  brand: string;
  model: string;
  serial_number: string;
  description: string;
  available_quantity: number;
  quantity: number;
  state: string;
  categories: {
    name: string;
  };
}

interface MovementReport {
  id: string;
  action: string;
  created_at: string;
  reason: string | null;
  equipment: {
    id: string;
    name: string;
    brand: string;
    model: string;
    serial_number: string;
    description: string;
    state: string;
    location: string | null;
    color: string | null;
  } | null;
  profiles: {
    full_name: string;
  } | null;
}


interface UserReport {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
  last_sign_in_at?: string;
  is_active: boolean;
}

const Reports = () => {
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [movements, setMovements] = useState<MovementReport[]>([]);
  const [users, setUsers] = useState<UserReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [stockThreshold, setStockThreshold] = useState(50);
  const [reportType, setReportType] = useState('inventory');
  const { toast } = useToast();

  useEffect(() => {
    fetchLowStockItems();
  }, [stockThreshold]);

  const fetchLowStockItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('equipment')
        .select(`
          *,
          categories (
            name
          )
        `)
        .lt('available_quantity', stockThreshold)
        .order('available_quantity', { ascending: true });

      if (error) throw error;
      setLowStockItems(data || []);
    } catch (error) {
      console.error('Error fetching low stock items:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el reporte de bajo stock",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMovements = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Error",
        description: "Por favor selecciona ambas fechas",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('equipment_history')
        .select(`
          *,
          equipment:equipment!equipment_history_equipment_id_fkey (
            id,
            name,
            brand,
            model,
            serial_number,
            description,
            state,
            location,
            color
          ),
          profiles:profiles!equipment_history_changed_by_fkey (
            full_name
          )
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate + 'T23:59:59')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMovements(data || []);
    } catch (error) {
      console.error('Error fetching movements:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el reporte de movimientos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el reporte de usuarios",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportLowStockToExcel = () => {
    if (lowStockItems.length === 0) {
      toast({
        title: "Sin datos",
        description: "No hay productos con bajo stock para exportar",
        variant: "destructive",
      });
      return;
    }

    const exportData = lowStockItems.map((item, index) => ({
      'N°': index + 1,
      'NOMBRE DEL EQUIPO': item.name,
      'CATEGORÍA': item.categories?.name || 'Sin categoría',
      'MARCA': item.brand || 'N/A',
      'MODELO': item.model || 'N/A',
      'N° SERIE': item.serial_number || 'N/A',
      'CANTIDAD DISPONIBLE': item.available_quantity,
      'CANTIDAD TOTAL': item.quantity,
      'ESTADO': getStateLabel(item.state),
      'DESCRIPCIÓN': item.description || 'N/A',
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    ws['!cols'] = [
      { wch: 5 },   // N°
      { wch: 35 },  // NOMBRE
      { wch: 20 },  // CATEGORÍA
      { wch: 15 },  // MARCA
      { wch: 15 },  // MODELO
      { wch: 15 },  // N° SERIE
      { wch: 12 },  // CANTIDAD DISPONIBLE
      { wch: 12 },  // CANTIDAD TOTAL
      { wch: 15 },  // ESTADO
      { wch: 40 },  // DESCRIPCIÓN
    ];

    // Style header row
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!ws[cellAddress]) continue;
      ws[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "4472C4" } },
        alignment: { horizontal: "center", vertical: "center" },
      };
    }

    XLSX.utils.book_append_sheet(wb, ws, 'Bajo Stock');

    const fileName = `Reporte_Bajo_Stock_${new Date().toLocaleDateString('es-ES').replace(/\//g, '-')}.xlsx`;
    XLSX.writeFile(wb, fileName);

    toast({
      title: "Éxito",
      description: "Reporte de bajo stock exportado correctamente",
    });
  };

  const exportMovementsToExcel = () => {
    if (movements.length === 0) {
      toast({
        title: "Sin datos",
        description: "No hay movimientos para exportar en el rango seleccionado",
        variant: "destructive",
      });
      return;
    }

    const exportData = movements.map((movement, index) => ({
      'N° DE ORDEN': index + 1,
      'CÓDIGO PATRIMONIAL': movement.equipment?.serial_number || 'N/A',
      'DENOMINACIÓN': movement.equipment?.name || 'N/A',
      'UBICACIÓN': movement.equipment?.location || 'N/A',
      'COLOR': movement.equipment?.color || 'N/A',
      'MARCA': movement.equipment?.brand || 'N/A',
      'ESTADO': movement.equipment?.state || 'N/A',
      'OBSERVACIÓN': movement.equipment?.description || 'N/A',
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    ws['!cols'] = [
      { wch: 12 },  // N° DE ORDEN
      { wch: 18 },  // CÓDIGO PATRIMONIAL
      { wch: 35 },  // DENOMINACIÓN
      { wch: 20 },  // UBICACIÓN
      { wch: 15 },  // COLOR
      { wch: 20 },  // MARCA
      { wch: 15 },  // ESTADO
      { wch: 40 },  // OBSERVACIÓN
    ];

    // Style header row
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!ws[cellAddress]) continue;
      ws[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "4472C4" } },
        alignment: { horizontal: "center", vertical: "center" },
      };
    }

    XLSX.utils.book_append_sheet(wb, ws, 'Movimientos');

    const fileName = `Reporte_Movimientos_${startDate.replace(/-/g, '')}_${endDate.replace(/-/g, '')}.xlsx`;
    XLSX.writeFile(wb, fileName);

    toast({
      title: "Éxito",
      description: "Reporte de movimientos exportado correctamente",
    });
  };


  const exportUsersToExcel = () => {
    if (users.length === 0) {
      toast({
        title: "Sin datos",
        description: "No hay usuarios para exportar",
        variant: "destructive",
      });
      return;
    }

    const exportData = users.map(user => ({
      'Nombre': user.full_name,
      'Email': user.email,
      'Rol': user.role,
      'Estado': user.is_active ? 'Activo' : 'Inactivo',
      'Fecha Creación': new Date(user.created_at).toLocaleDateString('es-ES'),
      'Último Acceso': user.last_sign_in_at 
        ? new Date(user.last_sign_in_at).toLocaleDateString('es-ES')
        : 'Nunca',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');

    // Auto-size columns
    const colWidths = Object.keys(exportData[0] || {}).map(key => ({
      wch: Math.max(key.length, ...exportData.map(row => String(row[key as keyof typeof row]).length))
    }));
    ws['!cols'] = colWidths;

    const fileName = `Reporte_Usuarios_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);

    toast({
      title: "Éxito",
      description: "Reporte de usuarios exportado correctamente",
    });
  };

  const exportComprehensiveReport = () => {
    const wb = XLSX.utils.book_new();

    // Low Stock Report
    if (lowStockItems.length > 0) {
      const lowStockData = lowStockItems.map(item => ({
        'Nombre': item.name,
        'Categoría': item.categories?.name,
        'Marca': item.brand,
        'Modelo': item.model,
        'Disponible': item.available_quantity,
        'Total': item.quantity,
        'Estado': item.state,
      }));
      const ws1 = XLSX.utils.json_to_sheet(lowStockData);
      ws1['!cols'] = Object.keys(lowStockData[0] || {}).map(key => ({
        wch: Math.max(key.length, ...lowStockData.map(row => String(row[key as keyof typeof row]).length))
      }));
      XLSX.utils.book_append_sheet(wb, ws1, 'Bajo Stock');
    }

    // Movements Report
    if (movements.length > 0) {
      const movementsData = movements.map(movement => ({
        'Fecha': new Date(movement.created_at).toLocaleDateString('es-ES'),
        'Hora': new Date(movement.created_at).toLocaleTimeString('es-ES'),
        'Equipo': movement.equipment?.name || 'N/A',
        'Acción': movement.action,
        'Usuario': movement.profiles?.full_name || 'N/A',
      }));
      const ws2 = XLSX.utils.json_to_sheet(movementsData);
      ws2['!cols'] = Object.keys(movementsData[0] || {}).map(key => ({
        wch: Math.max(key.length, ...movementsData.map(row => String(row[key as keyof typeof row]).length))
      }));
      XLSX.utils.book_append_sheet(wb, ws2, 'Movimientos');
    }


    // Users Report
    if (users.length > 0) {
      const usersData = users.map(user => ({
        'Nombre': user.full_name,
        'Email': user.email,
        'Rol': user.role,
        'Estado': user.is_active ? 'Activo' : 'Inactivo',
        'Fecha Creación': new Date(user.created_at).toLocaleDateString('es-ES'),
        'Último Acceso': user.last_sign_in_at 
          ? new Date(user.last_sign_in_at).toLocaleDateString('es-ES')
          : 'Nunca',
      }));
      const ws4 = XLSX.utils.json_to_sheet(usersData);
      ws4['!cols'] = Object.keys(usersData[0] || {}).map(key => ({
        wch: Math.max(key.length, ...usersData.map(row => String(row[key as keyof typeof row]).length))
      }));
      XLSX.utils.book_append_sheet(wb, ws4, 'Usuarios');
    }

    const fileName = `Reporte_Completo_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);

    toast({
      title: "Éxito",
      description: "Reporte completo exportado correctamente",
    });
  };

  const getStateColor = (state: string) => {
    const colors = {
      disponible: 'bg-success text-success-foreground',
      en_uso: 'bg-warning text-warning-foreground',
      mantenimiento: 'bg-info text-info-foreground',
      dañado: 'bg-destructive text-destructive-foreground',
      baja: 'bg-muted text-muted-foreground',
    };
    return colors[state as keyof typeof colors] || 'bg-secondary';
  };

  const getStateLabel = (state: string) => {
    const labels = {
      disponible: 'Disponible',
      en_uso: 'En Uso',
      mantenimiento: 'Mantenimiento',
      dañado: 'Dañado',
      baja: 'Baja',
    };
    return labels[state as keyof typeof labels] || state;
  };

  const getActionLabel = (action: string) => {
    const labels = {
      create: 'Creación',
      update: 'Actualización',
      delete: 'Eliminación',
    };
    return labels[action as keyof typeof labels] || action;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reportes</h1>
          <p className="text-muted-foreground">
            Genera y exporta reportes del sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchUsers}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Cargar Usuarios
          </Button>
          <Button
            onClick={exportComprehensiveReport}
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Reporte Completo
          </Button>
        </div>
      </div>

      {/* Report Type Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Tipo de Reporte</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Tipo de reporte" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="inventory">Inventario</SelectItem>
              <SelectItem value="movements">Movimientos</SelectItem>
              <SelectItem value="users">Usuarios</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Low Stock Report */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Productos con Bajo Stock
          </CardTitle>
          <CardDescription>
            Productos con cantidad disponible menor a {stockThreshold} unidades
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="threshold">Umbral:</Label>
              <NumberInput
                id="threshold"
                value={stockThreshold}
                onChange={(value) => setStockThreshold(parseInt(value))}
                className="w-20"
                allowEmpty={false}
              />
            </div>
            <Button
              onClick={exportLowStockToExcel}
              variant="outline"
              className="flex items-center gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Exportar a Excel
            </Button>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Marca/Modelo</TableHead>
                  <TableHead>N° Serie</TableHead>
                  <TableHead className="text-center">Disponible</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-medium">{item.name}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {item.categories?.name || 'Sin categoría'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{item.brand || 'N/A'}</div>
                        <div className="text-muted-foreground">{item.model || 'N/A'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-mono">
                        {item.serial_number || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-destructive font-medium">
                        {item.available_quantity}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={getStateColor(item.state)}>
                        {getStateLabel(item.state)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {lowStockItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No hay productos con bajo stock
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Movements Report */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Reporte de Movimientos
          </CardTitle>
          <CardDescription>
            Exporta movimientos filtrados por rango de fechas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label htmlFor="startDate">Fecha Inicio</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">Fecha Fin</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={fetchMovements}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Consultar
              </Button>
              <Button
                onClick={exportMovementsToExcel}
                variant="outline"
                disabled={movements.length === 0}
                className="flex items-center gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Exportar
              </Button>
            </div>
          </div>

          {movements.length > 0 && (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Orden</TableHead>
                    <TableHead>Código Patrimonial</TableHead>
                    <TableHead>Denominación</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Observación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.slice(0, 10).map((movement, index) => (
                    <TableRow key={movement.id}>
                      <TableCell className="font-medium">
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        {movement.equipment?.serial_number || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {movement.equipment?.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {movement.equipment?.location || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {movement.equipment?.color || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {movement.equipment?.brand || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {movement.equipment?.state || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {movement.equipment?.description || 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {movements.length > 10 && (
                <div className="text-center py-2 text-sm text-muted-foreground border-t">
                  Mostrando 10 de {movements.length} registros. Exporta para ver todos.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>


      {/* Users Report */}
      {reportType === 'users' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Reporte de Usuarios
            </CardTitle>
            <CardDescription>
              Lista de usuarios del sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-end">
              <Button
                onClick={exportUsersToExcel}
                variant="outline"
                disabled={users.length === 0}
                className="flex items-center gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Exportar a Excel
              </Button>
            </div>

            {users.length > 0 && (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha Creación</TableHead>
                      <TableHead>Último Acceso</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.is_active ? "default" : "secondary"}>
                            {user.is_active ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString('es-ES')}
                        </TableCell>
                        <TableCell>
                          {user.last_sign_in_at 
                            ? new Date(user.last_sign_in_at).toLocaleDateString('es-ES')
                            : 'Nunca'
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Reports;