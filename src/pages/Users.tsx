import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRole } from '@/hooks/useRole';
import { Plus, Trash2, UserPlus, Shield, Loader2, GraduationCap } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Navigate } from 'react-router-dom';

interface UserData {
  id: string;
  email: string;
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
    email: '',
    password: '',
    full_name: '',
    role: 'tecnico' as 'administrador' | 'tecnico',
  });

  const [teacherFormData, setTeacherFormData] = useState({
    full_name: '',
    dni: '',
    email: '',
    phone: '',
  });

  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [teachers, setTeachers] = useState<Array<{id: string; full_name: string; dni: string; email?: string; phone?: string}>>([]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const usersWithRoles = profiles?.map(profile => {
        const userRoles = rolesData?.filter(r => r.user_id === profile.id) || [];
        
        return {
          id: profile.id,
          email: 'Usuario del Sistema', // Simplified to avoid admin permissions
          full_name: profile.full_name,
          created_at: profile.created_at,
          roles: userRoles,
        };
      }) || [];

      setUsers(usersWithRoles);
    } catch (error: unknown) {
      console.error('Error fetching users:', error);
      const errorMessage = error instanceof Error ? error.message : "No se pudo cargar la lista de usuarios";
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
      const { data, error } = await supabase
        .from('teachers')
        .select('id, full_name, dni, email, phone')
        .order('full_name');

      if (error) throw error;
      setTeachers(data || []);
    } catch (error) {
      console.error('Error fetching teachers:', error);
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
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: data.user.id,
            role: formData.role,
          });

        if (roleError) throw roleError;
      }

      toast({
        title: "Éxito",
        description: "Usuario creado correctamente",
      });

      setIsModalOpen(false);
      setFormData({ email: '', password: '', full_name: '', role: 'tecnico' });
      fetchUsers();
    } catch (error: unknown) {
      console.error('Error creating user:', error);
      const errorMessage = error instanceof Error ? error.message : "No se pudo crear el usuario";
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
    return role === 'administrador' 
      ? 'bg-primary text-primary-foreground' 
      : 'bg-secondary text-secondary-foreground';
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
      const { error } = await supabase
        .from('teachers')
        .insert({
          full_name: teacherFormData.full_name,
          dni: teacherFormData.dni,
          email: teacherFormData.email || null,
          phone: teacherFormData.phone || null,
        });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Docente creado correctamente",
      });

      setIsTeacherModalOpen(false);
      setTeacherFormData({ full_name: '', dni: '', email: '', phone: '' });
      fetchTeachers();
    } catch (error: unknown) {
      console.error('Error creating teacher:', error);
      const errorMessage = error instanceof Error ? error.message : "No se pudo crear el docente";
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
      // Delete from user_roles first
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userToDelete.id);

      if (roleError) throw roleError;

      // Delete from profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userToDelete.id);

      if (profileError) throw profileError;

      toast({
        title: "Éxito",
        description: "Usuario eliminado correctamente",
      });

      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (error: unknown) {
      console.error('Error deleting user:', error);
      const errorMessage = error instanceof Error ? error.message : "No se pudo eliminar el usuario";
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
    return role === 'administrador' ? 'Administrador' : 'Técnico';
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
            <h1 className="text-3xl font-bold text-foreground">Gestión de Usuarios</h1>
            <p className="text-muted-foreground">
              Administra los usuarios del sistema y docentes
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsTeacherModalOpen(true)} variant="outline" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Agregar Docente
            </Button>
            <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Agregar Usuario
            </Button>
          </div>
        </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Usuarios del Sistema
          </CardTitle>
          <CardDescription>
            Lista de todos los usuarios registrados
          </CardDescription>
        </CardHeader>
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
                    <TableHead>Correo Electrónico</TableHead>
                    <TableHead>Roles</TableHead>
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
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {user.roles.map((role, idx) => (
                            <Badge 
                              key={idx} 
                              className={getRoleBadgeColor(role.role)}
                            >
                              {getRoleLabel(role.role)}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString('es-ES')}
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Docentes Registrados
          </CardTitle>
          <CardDescription>
            Lista de docentes registrados en el sistema
          </CardDescription>
        </CardHeader>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teachers.map((teacher) => (
                    <TableRow key={teacher.id}>
                      <TableCell className="font-medium">
                        {teacher.full_name}
                      </TableCell>
                      <TableCell>{teacher.dni}</TableCell>
                      <TableCell>{teacher.email || 'N/A'}</TableCell>
                      <TableCell>{teacher.phone || 'N/A'}</TableCell>
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
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Rol</Label>
              <Select
                value={formData.role}
                onValueChange={(value: 'administrador' | 'tecnico') => 
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
                onChange={(e) => setTeacherFormData({ ...teacherFormData, full_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teacher_dni">DNI *</Label>
              <Input
                id="teacher_dni"
                value={teacherFormData.dni}
                onChange={(e) => setTeacherFormData({ ...teacherFormData, dni: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teacher_email">Correo Electrónico (Opcional)</Label>
              <Input
                id="teacher_email"
                type="email"
                value={teacherFormData.email}
                onChange={(e) => setTeacherFormData({ ...teacherFormData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teacher_phone">Teléfono (Opcional)</Label>
              <Input
                id="teacher_phone"
                value={teacherFormData.phone}
                onChange={(e) => setTeacherFormData({ ...teacherFormData, phone: e.target.value })}
              />
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

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El usuario "{userToDelete?.full_name}" será eliminado permanentemente del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};

export default Users;
