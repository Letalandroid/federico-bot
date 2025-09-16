import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Category {
  id: string;
  name: string;
}

interface Product {
  id?: string;
  name: string;
  description: string;
  brand: string;
  model: string;
  serial_number: string;
  quantity: number;
  available_quantity: number;
  state: 'disponible' | 'en_uso' | 'mantenimiento' | 'dañado' | 'baja';
  category_id: string;
  purchase_date?: string;
  warranty_expiration?: string;
}

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product;
  onSave: () => void;
}

const equipmentStates = [
  { value: 'disponible', label: 'Disponible' },
  { value: 'en_uso', label: 'En Uso' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
  { value: 'dañado', label: 'Dañado' },
  { value: 'baja', label: 'Baja' },
];

export const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, product, onSave }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<Product>({
    name: '',
    description: '',
    brand: '',
    model: '',
    serial_number: '',
    quantity: 1,
    available_quantity: 1,
    state: 'disponible',
    category_id: '',
    purchase_date: '',
    warranty_expiration: '',
  });

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      if (product) {
        setFormData({
          ...product,
          purchase_date: product.purchase_date || '',
          warranty_expiration: product.warranty_expiration || '',
        });
      } else {
        setFormData({
          name: '',
          description: '',
          brand: '',
          model: '',
          serial_number: '',
          quantity: 1,
          available_quantity: 1,
          state: 'disponible',
          category_id: '',
          purchase_date: '',
          warranty_expiration: '',
        });
      }
    }
  }, [isOpen, product]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        created_by: user.id,
        purchase_date: formData.purchase_date || null,
        warranty_expiration: formData.warranty_expiration || null,
      };

      if (product?.id) {
        // Update existing product
        const { error } = await supabase
          .from('equipment')
          .update(submitData)
          .eq('id', product.id);

        if (error) throw error;

        // Log the movement
        await supabase.from('equipment_history').insert({
          equipment_id: product.id,
          action: 'update',
          old_values: product as any,
          new_values: submitData as any,
          changed_by: user.id,
        });

        toast({
          title: "Éxito",
          description: "Producto actualizado correctamente",
        });
      } else {
        // Create new product
        const { data: newProduct, error } = await supabase
          .from('equipment')
          .insert(submitData)
          .select()
          .single();

        if (error) throw error;

        // Log the movement
        await supabase.from('equipment_history').insert({
          equipment_id: newProduct.id,
          action: 'create',
          new_values: submitData as any,
          changed_by: user.id,
        });

        toast({
          title: "Éxito",
          description: "Producto creado correctamente",
        });
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el producto",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof Product, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'quantity' && { available_quantity: typeof value === 'number' ? value : parseInt(value) || 1 }),
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? 'Editar Producto' : 'Nuevo Producto'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="category">Categoría *</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => handleInputChange('category_id', value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="brand">Marca</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => handleInputChange('brand', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="model">Modelo</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => handleInputChange('model', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="serial_number">Número de Serie</Label>
              <Input
                id="serial_number"
                value={formData.serial_number}
                onChange={(e) => handleInputChange('serial_number', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="quantity">Cantidad *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="state">Estado</Label>
            <Select
              value={formData.state}
              onValueChange={(value) => handleInputChange('state', value as Product['state'])}
            >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {equipmentStates.map((state) => (
                    <SelectItem key={state.value} value={state.value}>
                      {state.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="purchase_date">Fecha de Compra</Label>
              <Input
                id="purchase_date"
                type="date"
                value={formData.purchase_date}
                onChange={(e) => handleInputChange('purchase_date', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="warranty_expiration">Fecha de Vencimiento de Garantía</Label>
            <Input
              id="warranty_expiration"
              type="date"
              value={formData.warranty_expiration}
              onChange={(e) => handleInputChange('warranty_expiration', e.target.value)}
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