import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  Download,
  FileSpreadsheet,
  Package,
  TrendingDown,
  Calendar,
  AlertTriangle,
  Users,
  BarChart3,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as XLSX from "xlsx";

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
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [stockThreshold, setStockThreshold] = useState("10");
  const [reportType, setReportType] = useState("inventory");
  const { toast } = useToast();

  const fetchLowStockItems = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("equipment")
        .select(
          `
          *,
          categories (
            name
          )
        `
        )
        .lt("available_quantity", stockThreshold)
        .order("available_quantity", { ascending: true });

      if (error) throw error;
      setLowStockItems(data || []);
    } catch (error) {
      console.error("Error fetching low stock items:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar el reporte de bajo stock",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [stockThreshold, toast]);

  // Cargar datos iniciales
  useEffect(() => {
    fetchLowStockItems();
  }, [fetchLowStockItems]);

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
        .from("equipment_history")
        .select(
          `*, profiles:profiles!equipment_history_changed_by_fkey (full_name), equipment:equipment!equipment_history_equipment_id_fkey (name)`
        ) // join correcto
        .gte("created_at", startDate)
        .lte("created_at", endDate + "T23:59:59")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setMovements(data || []);
    } catch (error) {
      console.error("Error fetching movements:", error);
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
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transformar los datos para que coincidan con UserReport
      const transformedUsers = (data || []).map((user) => ({
        id: user.id,
        full_name: user.full_name || "",
        email: (user as { email?: string }).email || "",
        role: "tecnico", // Valor por defecto
        created_at: user.created_at,
        is_active: true, // Valor por defecto
      }));

      setUsers(transformedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
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

    const exportData = lowStockItems.map((item) => ({
      Producto: item.name,
      Descripcion: item.description,
      Categoría: item.categories?.name || "Sin categoría",
      "Marca/Modelo": item.brand
        ? item.model
          ? `${item.brand}\n${item.model}`
          : item.brand
        : item.model || "N/A",
      "N° Serie": item.serial_number || "N/A",
      Disponible: item.available_quantity,
      Total: item.quantity,
      Estado: getStateLabel(item.state),
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData, { origin: "A3" });
    ws["A1"] = { v: "Productos con Bajo Stock", t: "s" };

    ws["!cols"] = [
      { wch: 18 }, // Producto
      { wch: 22 }, // Categoría
      { wch: 28 }, // Marca/Modelo
      { wch: 20 }, // N° Serie
      { wch: 10 }, // Disponible
      { wch: 10 }, // Total
      { wch: 16 }, // Estado
    ];
    XLSX.utils.book_append_sheet(wb, ws, "Productos Bajo Stock");

    XLSX.writeFile(
      wb,
      `productos-bajo-stock-${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const exportMovementsToExcel = () => {
    if (movements.length === 0) {
      toast({
        title: "Sin datos",
        description:
          "No hay movimientos para exportar en el rango seleccionado",
        variant: "destructive",
      });
      return;
    }

    const exportData = movements.map((movement: MovementReport) => {
      return {
        Fecha: new Date(movement.created_at).toLocaleDateString("es-ES"),
        Hora: new Date(movement.created_at).toLocaleTimeString("es-ES"),
        Equipo:
          movement.equipment?.name ||
          (movement.action.includes("user")
            ? "Gestión de Usuario"
            : "Equipo eliminado"),
        Acción: getActionLabel(movement.action),
        Usuario: movement.profiles?.full_name || "Usuario desconocido",
        "Detalles del Cambio": getChangesDescription(movement),
      };
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData, { origin: "A3" });
    ws["A1"] = { v: "Historial de Movimientos", t: "s" };

    ws["!cols"] = [
      { wch: 12 }, // Fecha
      { wch: 12 }, // Hora
      { wch: 26 }, // Equipo
      { wch: 16 }, // Acción
      { wch: 32 }, // Usuario
      { wch: 48 }, // Detalles del Cambio
    ];
    XLSX.utils.book_append_sheet(wb, ws, "Historial Movimientos");

    XLSX.writeFile(
      wb,
      `historial-movimientos-${new Date().toISOString().slice(0, 10)}.xlsx`
    );
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

    const exportData = users.map((user) => ({
      Nombre: user.full_name,
      Email: user.email,
      Rol: user.role,
      Estado: user.is_active ? "Activo" : "Inactivo",
      "Fecha Creación": new Date(user.created_at).toLocaleDateString("es-ES"),
      "Último Acceso": user.last_sign_in_at
        ? new Date(user.last_sign_in_at).toLocaleDateString("es-ES")
        : "Nunca",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Usuarios");

    // Auto-size columns
    const colWidths = Object.keys(exportData[0] || {}).map((key) => ({
      wch: Math.max(
        key.length,
        ...exportData.map((row) => String(row[key as keyof typeof row]).length)
      ),
    }));
    ws["!cols"] = colWidths;

    const fileName = `Reporte_Usuarios_${
      new Date().toISOString().split("T")[0]
    }.xlsx`;
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
      const lowStockData = lowStockItems.map((item) => ({
        Nombre: item.name,
        Descripcion: item.description,
        Categoría: item.categories?.name,
        Marca: item.brand,
        Modelo: item.model,
        Disponible: item.available_quantity,
        Total: item.quantity,
        Estado: item.state,
      }));
      const ws1 = XLSX.utils.json_to_sheet(lowStockData);
      ws1["!cols"] = Object.keys(lowStockData[0] || {}).map((key) => ({
        wch: Math.max(
          key.length,
          ...lowStockData.map(
            (row) => String(row[key as keyof typeof row]).length
          )
        ),
      }));
      XLSX.utils.book_append_sheet(wb, ws1, "Bajo Stock");
    }

    // Movements Report
    if (movements.length > 0) {
      const movementsData = movements.map((movement) => ({
        Fecha: new Date(movement.created_at).toLocaleDateString("es-ES"),
        Hora: new Date(movement.created_at).toLocaleTimeString("es-ES"),
        Equipo: movement.equipment?.name || "N/A",
        Acción: movement.action,
        Usuario: movement.profiles?.full_name || "N/A",
      }));
      const ws2 = XLSX.utils.json_to_sheet(movementsData);
      ws2["!cols"] = Object.keys(movementsData[0] || {}).map((key) => ({
        wch: Math.max(
          key.length,
          ...movementsData.map(
            (row) => String(row[key as keyof typeof row]).length
          )
        ),
      }));
      XLSX.utils.book_append_sheet(wb, ws2, "Movimientos");
    }

    // Users Report
    if (users.length > 0) {
      const usersData = users.map((user) => ({
        Nombre: user.full_name,
        Email: user.email,
        Rol: user.role,
        Estado: user.is_active ? "Activo" : "Inactivo",
        "Fecha Creación": new Date(user.created_at).toLocaleDateString("es-ES"),
        "Último Acceso": user.last_sign_in_at
          ? new Date(user.last_sign_in_at).toLocaleDateString("es-ES")
          : "Nunca",
      }));
      const ws4 = XLSX.utils.json_to_sheet(usersData);
      ws4["!cols"] = Object.keys(usersData[0] || {}).map((key) => ({
        wch: Math.max(
          key.length,
          ...usersData.map((row) => String(row[key as keyof typeof row]).length)
        ),
      }));
      XLSX.utils.book_append_sheet(wb, ws4, "Usuarios");
    }

    const fileName = `Reporte_Completo_${
      new Date().toISOString().split("T")[0]
    }.xlsx`;
    XLSX.writeFile(wb, fileName);

    toast({
      title: "Éxito",
      description: "Reporte completo exportado correctamente",
    });
  };

  const getStateColor = (state: string) => {
    const colors = {
      disponible: "bg-success text-success-foreground",
      en_uso: "bg-warning text-warning-foreground",
      mantenimiento: "bg-info text-info-foreground",
      dañado: "bg-destructive text-destructive-foreground",
      baja: "bg-muted text-muted-foreground",
    };
    return colors[state as keyof typeof colors] || "bg-secondary";
  };

  const getStateLabel = (state: string) => {
    const labels = {
      disponible: "Disponible",
      en_uso: "En Uso",
      mantenimiento: "Mantenimiento",
      dañado: "Dañado",
      baja: "Baja",
    };
    return labels[state as keyof typeof labels] || state;
  };

  // --- lógica helper igual que Movements ---
  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      create: "Creación",
      update: "Actualización",
      delete: "Eliminación",
      user_create: "Usuario Creado",
      user_delete: "Usuario Eliminado",
      user_status_change: "Estado Usuario",
      registry: "Registro Equipo",
    };
    return labels[action as keyof typeof labels] || action;
  };

  const getChangesDescription = (movement: MovementReport) => {
    if (movement.action === "create") {
      return "Producto creado";
    }
    if (movement.action === "delete") {
      return "Producto eliminado";
    }
    if (movement.action === "user_create") {
      return "Usuario creado";
    }
    if (movement.action === "user_delete") {
      return "Usuario eliminado";
    }
    if (movement.action === "user_status_change") {
      return "Estado de usuario cambiado";
    }
    if (movement.action === "registry") {
      return "Registro de equipo creado";
    }
    if (movement.action === "update") {
      const oldVals = movement.old_values || {};
      const newVals = movement.new_values || {};
      const changes: string[] = [];
      Object.keys(newVals).forEach((key) => {
        if (oldVals[key] !== undefined && oldVals[key] !== newVals[key]) {
          const fieldNames: Record<string, string> = {
            available_quantity: "Disponible",
            quantity: "Cantidad",
            state: "Estado",
            brand: "Marca",
            model: "Modelo",
            description: "Descripción",
            full_name: "Nombre completo",
            role: "Rol",
            is_active: "Estado activo",
          };
          const fieldName = fieldNames[key] || key;
          changes.push(`${fieldName}: ${oldVals[key]} → ${newVals[key]}`);
        }
      });
      return changes.length > 0 ? changes.join(", ") : "Sin cambios detectados";
    }
    return "Acción realizada";
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
          {/* <Button
            onClick={fetchUsers}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Cargar Usuarios
          </Button> */}
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
      {/* <Card>
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
      </Card> */}

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
                onChange={(value) => setStockThreshold(value)}
                onEnter={fetchLowStockItems}
                className="w-20"
                allowEmpty={true}
                min={1}
                placeholder="Umbral"
              />
              <Button
                onClick={fetchLowStockItems}
                variant="outline"
                size="sm"
                disabled={!stockThreshold || loading}
              >
                Buscar
              </Button>
            </div>
            <Button
              onClick={exportLowStockToExcel}
              variant="outline"
              className="flex items-center gap-2"
              disabled={lowStockItems.length === 0}
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
                  <TableHead>Descripcion</TableHead>
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
                      <div className="font-medium">{item.description}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {item.categories?.name || "Sin categoría"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{item.brand || "N/A"}</div>
                        <div className="text-muted-foreground">
                          {item.model || "N/A"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-mono">
                        {item.serial_number || "N/A"}
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
            Historial de Movimientos
          </CardTitle>
          <CardDescription>
            {movements.length} movimientos encontrados
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
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Equipo</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Detalles del Cambio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((movement: MovementReport) => (
                  <TableRow key={movement.id}>
                    <TableCell>
                      {new Date(movement.created_at).toLocaleDateString(
                        "es-ES"
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(movement.created_at).toLocaleTimeString(
                        "es-ES"
                      )}
                    </TableCell>
                    <TableCell>
                      {movement.equipment?.name ||
                        (movement.action.includes("user")
                          ? "Gestión de Usuario"
                          : "Equipo eliminado")}
                    </TableCell>
                    <TableCell>{getActionLabel(movement.action)}</TableCell>
                    <TableCell>
                      {movement.profiles?.full_name || "Usuario desconocido"}
                    </TableCell>
                    <TableCell>{getChangesDescription(movement)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {movements.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No hay movimientos encontrados
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Users Report */}
      {reportType === "users" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Reporte de Usuarios
            </CardTitle>
            <CardDescription>Lista de usuarios del sistema</CardDescription>
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
                        <TableCell className="font-medium">
                          {user.full_name}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={user.is_active ? "default" : "secondary"}
                          >
                            {user.is_active ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString(
                            "es-ES"
                          )}
                        </TableCell>
                        <TableCell>
                          {user.last_sign_in_at
                            ? new Date(user.last_sign_in_at).toLocaleDateString(
                                "es-ES"
                              )
                            : "Nunca"}
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
