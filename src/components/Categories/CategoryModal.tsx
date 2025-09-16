import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Category {
  id?: string;
  name: string;
  description: string;
}

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: Category;
  onSave: () => void;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({ isOpen, onClose, category, onSave }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Category>({
    name: '',
    description: '',
  });

  useEffect(() => {
    if (isOpen) {
      if (category) {
        setFormData({
          name: category.name,
          description: category.description,
        });
      } else {
        setFormData({
          name: '',
          description: '',
        });
      }
    }
  }, [isOpen, category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (category?.id) {
        // Update existing category
        const { error } = await supabase
          .from('categories')
          .update(formData)
          .eq('id', category.id);

        if (error) throw error;

        toast({
          title: "Éxito",
          description: "Categoría actualizada correctamente",
        });
      } else {
        // Create new category
        const { error } = await supabase
          .from('categories')
          .insert(formData);

        if (error) throw error;

        toast({
          title: "Éxito",
          description: "Categoría creada correctamente",
        });
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving category:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la categoría",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof Category, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {category ? 'Editar Categoría' : 'Nueva Categoría'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};