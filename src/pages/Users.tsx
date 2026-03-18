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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/hooks/useRole";
import {
  Plus,
  Trash2,
  UserPlus,
  Shield,
  Loader2,
  GraduationCap,
  Edit,
  MoreHorizontal,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Navigate } from "react-router-dom";
import * as XLSX from "xlsx";

interface UserData {
  id: string;
  role: string;
  full_name: string;
  created_at: string;
  roles: { role: string }[];
}

const Users = () => {
  const { isAdmin, loading: roleLoading } = useRole();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "tecnico" as "administrador" | "tecnico",
  });

  const [teacherFormData, setTeacherFormData] = useState({
    full_name: "",
    dni: "",
    email: "",
    phone: "",
    status: "activo" as "activo" | "baja",
  });

  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [isEditTeacherModalOpen, setIsEditTeacherModalOpen] = useState(false);
  const [teacherToEdit, setTeacherToEdit] = useState<{
    id: string;
    full_name: string;
    dni: string;
    email?: string;
    phone?: string;
    status: "activo" | "baja";
  } | null>(null);
  const [teachers, setTeachers] = useState<
    Array<{
      id: string;
      full_name: string;
      dni: string;
      email?: string;
      phone?: string;
      status: "activo" | "baja";
      has_movements?: boolean;
    }>
  >([]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const profiles = await api.get('/users');
      setUsers(profiles || []);
    } catch (error: unknown) {
      console.error("Error fetching users:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "No se pudo cargar la lista de usuarios";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchTeachers();
    }
  }, [isAdmin, fetchUsers]);

  const fetchTeachers = async () => {
    try {
      const data = await api.get('/teachers');

      // Procesar los datos para incluir información sobre movimientos
      const teachersWithMovements = (data || []).map((teacher) => ({
        id: teacher.id,
        full_name: teacher.full_name,
        dni: teacher.dni,
        email: teacher.email,
        phone: teacher.phone,
        status: teacher.status || "activo",
        has_movements: teacher.movements && teacher.movements.length > 0,
      }));

      setTeachers(teachersWithMovements);
    } catch (error) {
      console.error("Error fetching teachers:", error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password || !formData.full_name) {
      toast({
        title: "Error",
        description: "Todos los campos son obligatorios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await api.post('/users', {
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        role: formData.role,
      });

      toast({
        title: "Éxito",
        description: "Usuario creado correctamente",
      });

      setIsModalOpen(false);
      setFormData({ email: "", password: "", full_name: "", role: "tecnico" });
      fetchUsers();
    } catch (error: unknown) {
      console.error("Error creating user:", error);
      const errorMessage =
        error instanceof Error ? error.message : "No se pudo crear el usuario";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    return role === "administrador"
      ? "bg-primary text-primary-foreground"
      : "bg-secondary text-secondary-foreground";
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!teacherFormData.full_name || !teacherFormData.dni) {
      toast({
        title: "Error",
        description: "Nombre completo y DNI son obligatorios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await api.post('/teachers', {
        full_name: teacherFormData.full_name,
        dni: teacherFormData.dni,
        email: teacherFormData.email || null,
        phone: teacherFormData.phone || null,
        status: teacherFormData.status,
      });

      toast({
        title: "Éxito",
        description: "Docente creado correctamente",
      });

      setIsTeacherModalOpen(false);
      setTeacherFormData({
        full_name: "",
        dni: "",
        email: "",
        phone: "",
        status: "activo",
      });
      fetchTeachers();
    } catch (error: unknown) {
      console.error("Error creating teacher:", error);
      const errorMessage =
        error instanceof Error ? error.message : "No se pudo crear el docente";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditTeacher = (teacher: {
    id: string;
    full_name: string;
    dni: string;
    email?: string;
    phone?: string;
    status: "activo" | "baja";
  }) => {
    setTeacherToEdit(teacher);
    setTeacherFormData({
      full_name: teacher.full_name,
      dni: teacher.dni,
      email: teacher.email || "",
      phone: teacher.phone || "",
      status: teacher.status,
    });
    setIsEditTeacherModalOpen(true);
  };

  const handleUpdateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherToEdit) return;

    if (!teacherFormData.full_name || !teacherFormData.dni) {
      toast({
        title: "Error",
        description: "Nombre completo y DNI son obligatorios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await api.put(`/teachers/${teacherToEdit.id}`, {
        full_name: teacherFormData.full_name,
        dni: teacherFormData.dni,
        email: teacherFormData.email || null,
        phone: teacherFormData.phone || null,
        status: teacherFormData.status,
      });

      toast({
        title: "Éxito",
        description: "Docente actualizado correctamente",
      });

      setIsEditTeacherModalOpen(false);
      setTeacherToEdit(null);
      setTeacherFormData({
        full_name: "",
        dni: "",
        email: "",
        phone: "",
        status: "activo",
      });
      fetchTeachers();
    } catch (error: unknown) {
      console.error("Error updating teacher:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el docente";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeacher = async (teacherId: string) => {
    setLoading(true);
    try {
      await api.delete(`/teachers/${teacherId}`);

      toast({
        title: "Éxito",
        description: "Docente eliminado correctamente",
      });

      fetchTeachers();
    } catch (error: unknown) {
      console.error("Error deleting teacher:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "No se pudo eliminar el docente";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setLoading(true);
    try {
      await api.delete(`/users/${userToDelete.id}`);

      toast({
        title: "Éxito",
        description: "Usuario eliminado correctamente",
      });

      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (error: unknown) {
      console.error("Error deleting user:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "No se pudo eliminar el usuario";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    return role === "administrador" ? "Administrador" : "Técnico";
  };

  const exportUsersToExcel = () => {
    const exportData = users.map((user) => ({
      "Nombre Completo": user.full_name,
      Rol: user.role,
      "Fecha de Registro": new Date(user.created_at).toLocaleDateString(
        "es-ES"
      ),
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData, { origin: "A3" });
    ws["A1"] = { v: "Gestión de usuarios", t: "s" };
    ws["!cols"] = [
      { wch: 32 }, // Nombre Completo
      { wch: 12 }, // Rol
      { wch: 18 }, // Fecha
    ];
    XLSX.utils.book_append_sheet(wb, ws, "Usuarios del Sistema");
    XLSX.writeFile(
      wb,
      `usuarios-sistema-${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const exportTeachersToExcel = () => {
    const exportData = teachers.map((teacher) => ({
      "Nombre Completo": teacher.full_name,
      DNI: teacher.dni,
      "Correo Electrónico": teacher.email || "N/A",
      Teléfono: teacher.phone || "N/A",
      Estado: teacher.status === "activo" ? "Activo" : "De Baja",
      Préstamos: teacher.has_movements ? "Sí" : "No",
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData, { origin: "A3" });
    ws["A1"] = { v: "Gestión de Docentes", t: "s" };
    ws["!cols"] = [
      { wch: 32 }, // Nombre Completo
      { wch: 12 }, // DNI
      { wch: 26 }, // Correo
      { wch: 14 }, // Teléfono
      { wch: 12 }, // Estado
      { wch: 8 }, // Préstamos
    ];
    XLSX.utils.book_append_sheet(wb, ws, "Docentes Registrados");
    XLSX.writeFile(
      wb,
      `docentes-registrados-${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Gestión de Usuarios
          </h1>
          <p className="text-muted-foreground">
            Administra los usuarios del sistema y docentes
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsTeacherModalOpen(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <GraduationCap className="h-4 w-4" />
            Agregar Docente
          </Button>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Agregar Usuario
          </Button>
        </div>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Usuarios del Sistema
            </CardTitle>
            <CardDescription>
              Lista de todos los usuarios registrados
            </CardDescription>
          </CardHeader>
          <div className="flex mr-6 pb-2">
            <Button
              onClick={exportUsersToExcel}
              variant="outline"
              className="flex items-center gap-2"
            >
              Exportar Usuarios a Excel
            </Button>
          </div>
        </div>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre Completo</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Fecha de Registro</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.full_name}
                      </TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString("es-ES")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setUserToDelete(user);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {users.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No hay usuarios registrados
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sección de Docentes */}
      <Card>
        <div className="flex items-center justify-between">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Docentes Registrados
            </CardTitle>
            <CardDescription>
              Lista de docentes registrados en el sistema
            </CardDescription>
          </CardHeader>
          <div className="flex mr-6 pb-2">
            <Button
              onClick={exportTeachersToExcel}
              variant="outline"
              className="flex items-center gap-2"
            >
              Exportar Docentes a Excel
            </Button>
          </div>
        </div>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre Completo</TableHead>
                    <TableHead>DNI</TableHead>
                    <TableHead>Correo Electrónico</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-[50px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teachers.map((teacher) => (
                    <TableRow key={teacher.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {teacher.full_name}
                          {teacher.has_movements && (
                            <Badge variant="secondary" className="text-xs">
                              Con préstamos
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{teacher.dni}</TableCell>
                      <TableCell>{teacher.email || "N/A"}</TableCell>
                      <TableCell>{teacher.phone || "N/A"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            teacher.status === "activo"
                              ? "default"
                              : "secondary"
                          }
                          className={
                            teacher.status === "activo"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }
                        >
                          {teacher.status === "activo" ? "Activo" : "De Baja"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleEditTeacher(teacher)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteTeacher(teacher.id)}
                              className={
                                teacher.has_movements
                                  ? "text-muted-foreground cursor-not-allowed"
                                  : "text-destructive"
                              }
                              disabled={teacher.has_movements}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {teacher.has_movements
                                ? "No se puede eliminar"
                                : "Eliminar"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {teachers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No hay docentes registrados
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Usuario</DialogTitle>
            <DialogDescription>
              Crea un nuevo usuario para el sistema
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nombre Completo</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Rol</Label>
              <Select
                value={formData.role}
                onValueChange={(value: "administrador" | "tecnico") =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tecnico">Técnico</SelectItem>
                  <SelectItem value="administrador">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear Usuario
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal para agregar docente */}
      <Dialog open={isTeacherModalOpen} onOpenChange={setIsTeacherModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Docente</DialogTitle>
            <DialogDescription>
              Registra un nuevo docente en el sistema
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateTeacher} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="teacher_full_name">Nombre Completo *</Label>
              <Input
                id="teacher_full_name"
                value={teacherFormData.full_name}
                onChange={(e) =>
                  setTeacherFormData({
                    ...teacherFormData,
                    full_name: e.target.value,
                  })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teacher_dni">DNI *</Label>
              <Input
                id="teacher_dni"
                value={teacherFormData.dni}
                onChange={(e) =>
                  setTeacherFormData({
                    ...teacherFormData,
                    dni: e.target.value,
                  })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teacher_email">
                Correo Electrónico (Opcional)
              </Label>
              <Input
                id="teacher_email"
                type="email"
                value={teacherFormData.email}
                onChange={(e) =>
                  setTeacherFormData({
                    ...teacherFormData,
                    email: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teacher_phone">Teléfono (Opcional)</Label>
              <Input
                id="teacher_phone"
                value={teacherFormData.phone}
                onChange={(e) =>
                  setTeacherFormData({
                    ...teacherFormData,
                    phone: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teacher_status">Estado</Label>
              <Select
                value={teacherFormData.status}
                onValueChange={(value: "activo" | "baja") =>
                  setTeacherFormData({ ...teacherFormData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="baja">De Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsTeacherModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear Docente
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El usuario "
              {userToDelete?.full_name}" será eliminado permanentemente del
              sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal para editar docente */}
      <Dialog
        open={isEditTeacherModalOpen}
        onOpenChange={setIsEditTeacherModalOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Docente</DialogTitle>
            <DialogDescription>
              Actualiza la información del docente
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateTeacher} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_full_name">Nombre Completo *</Label>
              <Input
                id="edit_full_name"
                value={teacherFormData.full_name}
                onChange={(e) =>
                  setTeacherFormData({
                    ...teacherFormData,
                    full_name: e.target.value,
                  })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_dni">DNI *</Label>
              <Input
                id="edit_dni"
                value={teacherFormData.dni}
                onChange={(e) =>
                  setTeacherFormData({
                    ...teacherFormData,
                    dni: e.target.value,
                  })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_email">Correo Electrónico</Label>
              <Input
                id="edit_email"
                type="email"
                value={teacherFormData.email}
                onChange={(e) =>
                  setTeacherFormData({
                    ...teacherFormData,
                    email: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_phone">Teléfono</Label>
              <Input
                id="edit_phone"
                value={teacherFormData.phone}
                onChange={(e) =>
                  setTeacherFormData({
                    ...teacherFormData,
                    phone: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_status">Estado</Label>
              <Select
                value={teacherFormData.status}
                onValueChange={(value: "activo" | "baja") =>
                  setTeacherFormData({ ...teacherFormData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="baja">De Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditTeacherModalOpen(false);
                  setTeacherToEdit(null);
                  setTeacherFormData({
                    full_name: "",
                    dni: "",
                    email: "",
                    phone: "",
                    status: "activo",
                  });
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Actualizar Docente
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
