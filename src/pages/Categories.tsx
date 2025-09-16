import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CategoryModal } from '@/components/Categories/CategoryModal';

interface Category {
  id: string;
  name: string;
  description: string;
  created_at: string;
  equipment_count?: number;
}

const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      // Fetch categories with equipment count
      const { data, error } = await supabase
        .from('categories')
        .select(`
          *,
          equipment:equipment(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const categoriesWithCount = data?.map(cat => ({
        ...cat,
        equipment_count: cat.equipment?.[0]?.count || 0,
      })) || [];

      setCategories(categoriesWithCount);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar las categorías",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryToDelete.id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Categoría eliminada correctamente",
      });

      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la categoría. Puede que tenga productos asociados.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  const openEditModal = (category: Category) => {
    setSelectedCategory(category);
    setIsModalOpen(true);
  };

  const openDeleteDialog = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="text-3xl font-bold text-foreground">Categorías</h1>
          <p className="text-muted-foreground">
            Gestiona las categorías de equipos tecnológicos
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Categoría
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por nombre o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Categorías</CardTitle>
          <CardDescription>
            {filteredCategories.length} categorías encontradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-center">Equipos</TableHead>
                <TableHead>Fecha de Creación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <div className="font-medium">{category.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {category.description || 'Sin descripción'}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">
                      {category.equipment_count} equipos
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(category.created_at).toLocaleDateString('es-ES')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(category)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteDialog(category)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCategory(undefined);
        }}
        category={selectedCategory}
        onSave={fetchCategories}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la categoría
              "{categoryToDelete?.name}".
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

export default Categories;