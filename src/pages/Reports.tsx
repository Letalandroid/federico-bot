import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Download, FileSpreadsheet, Package, TrendingDown, Calendar } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import * as XLSX from 'xlsx';

interface LowStockItem {
  id: string;
  name: string;
  brand: string;
  model: string;
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
  equipment: {
    name: string;
  };
  profiles: {
    full_name: string;
  };
}

const Reports = () => {
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [movements, setMovements] = useState<MovementReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [stockThreshold, setStockThreshold] = useState(50);
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
          equipment (
            name
          ),
          profiles (
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

  const exportLowStockToExcel = () => {
    if (lowStockItems.length === 0) {
      toast({
        title: "Sin datos",
        description: "No hay productos con bajo stock para exportar",
        variant: "destructive",
      });
      return;
    }

    const exportData = lowStockItems.map(item => ({
      'Nombre': item.name,
      'Categoría': item.categories?.name,
      'Marca': item.brand,
      'Modelo': item.model,
      'Disponible': item.available_quantity,
      'Total': item.quantity,
      'Estado': item.state,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bajo Stock');

    // Auto-size columns
    const colWidths = Object.keys(exportData[0] || {}).map(key => ({
      wch: Math.max(key.length, ...exportData.map(row => String(row[key as keyof typeof row]).length))
    }));
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, `Reporte_Bajo_Stock_${new Date().toISOString().split('T')[0]}.xlsx`);

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

    const exportData = movements.map(movement => ({
      'Fecha': new Date(movement.created_at).toLocaleDateString('es-ES'),
      'Hora': new Date(movement.created_at).toLocaleTimeString('es-ES'),
      'Equipo': movement.equipment?.name || 'N/A',
      'Acción': movement.action,
      'Usuario': movement.profiles?.full_name || 'N/A',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Movimientos');

    // Auto-size columns
    const colWidths = Object.keys(exportData[0] || {}).map(key => ({
      wch: Math.max(key.length, ...exportData.map(row => String(row[key as keyof typeof row]).length))
    }));
    ws['!cols'] = colWidths;

    const fileName = `Reporte_Movimientos_${startDate}_${endDate}.xlsx`;
    XLSX.writeFile(wb, fileName);

    toast({
      title: "Éxito",
      description: "Reporte de movimientos exportado correctamente",
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
      <div>
        <h1 className="text-3xl font-bold text-foreground">Reportes</h1>
        <p className="text-muted-foreground">
          Genera y exporta reportes del inventario
        </p>
      </div>

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
              <Input
                id="threshold"
                type="number"
                value={stockThreshold}
                onChange={(e) => setStockThreshold(parseInt(e.target.value) || 50)}
                className="w-20"
                min="1"
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
                    <TableHead>Fecha</TableHead>
                    <TableHead>Equipo</TableHead>
                    <TableHead>Acción</TableHead>
                    <TableHead>Usuario</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.slice(0, 10).map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(movement.created_at).toLocaleDateString('es-ES')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(movement.created_at).toLocaleTimeString('es-ES')}
                        </div>
                      </TableCell>
                      <TableCell>
                        {movement.equipment?.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getActionLabel(movement.action)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {movement.profiles?.full_name || 'N/A'}
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
    </div>
  );
};

export default Reports;