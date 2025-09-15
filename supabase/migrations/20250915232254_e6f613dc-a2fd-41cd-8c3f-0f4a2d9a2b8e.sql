-- Create enum types for better data integrity
CREATE TYPE public.user_role AS ENUM ('administrador', 'tecnico');
CREATE TYPE public.equipment_state AS ENUM ('disponible', 'en_uso', 'mantenimiento', 'dañado', 'baja');
CREATE TYPE public.movement_type AS ENUM ('asignacion', 'devolucion', 'mantenimiento', 'baja');

-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'tecnico',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create equipment table
CREATE TABLE public.equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  available_quantity INTEGER NOT NULL DEFAULT 1 CHECK (available_quantity >= 0),
  state equipment_state NOT NULL DEFAULT 'disponible',
  serial_number TEXT,
  brand TEXT,
  model TEXT,
  purchase_date DATE,
  warranty_expiration DATE,
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create teachers table
CREATE TABLE public.teachers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  dni TEXT UNIQUE,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create classrooms table
CREATE TABLE public.classrooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  capacity INTEGER,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create movements table
CREATE TABLE public.movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id UUID REFERENCES public.equipment(id) NOT NULL,
  teacher_id UUID REFERENCES public.teachers(id),
  classroom_id UUID REFERENCES public.classrooms(id),
  movement_type movement_type NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  description TEXT,
  scheduled_return_date DATE,
  actual_return_date DATE,
  status TEXT NOT NULL DEFAULT 'activo' CHECK (status IN ('activo', 'completado', 'vencido')),
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create equipment history table for audit trail
CREATE TABLE public.equipment_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id UUID REFERENCES public.equipment(id) NOT NULL,
  action TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  changed_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'administrador'
    )
  );

-- General policies for authenticated users (can be refined later)
CREATE POLICY "Authenticated users can view categories" ON public.categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage categories" ON public.categories
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'administrador'
    )
  );

CREATE POLICY "Authenticated users can view equipment" ON public.equipment
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage equipment" ON public.equipment
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view teachers" ON public.teachers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage teachers" ON public.teachers
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view classrooms" ON public.classrooms
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage classrooms" ON public.classrooms
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view movements" ON public.movements
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage movements" ON public.movements
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view equipment history" ON public.equipment_history
  FOR SELECT TO authenticated USING (true);

-- Create function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'tecnico'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON public.equipment FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON public.teachers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_classrooms_updated_at BEFORE UPDATE ON public.classrooms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_movements_updated_at BEFORE UPDATE ON public.movements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default categories
INSERT INTO public.categories (name, description) VALUES
  ('Computadoras', 'Computadoras de escritorio y laptops'),
  ('Proyectores', 'Proyectores y equipos de proyección'),
  ('Impresoras', 'Impresoras y scanners'),
  ('Audio', 'Equipos de audio y sonido'),
  ('Red', 'Equipos de red y conectividad'),
  ('Accesorios', 'Accesorios y periféricos');

-- Insert default classrooms
INSERT INTO public.classrooms (name, description, capacity, location) VALUES
  ('Aula 101', 'Aula de Informática Principal', 30, 'Piso 1'),
  ('Aula 102', 'Aula de Computación', 25, 'Piso 1'),
  ('Laboratorio', 'Laboratorio de Sistemas', 20, 'Piso 2'),
  ('Biblioteca', 'Centro de recursos educativos', 40, 'Piso 1'),
  ('Auditorio', 'Auditorio principal', 100, 'Piso 2');

-- Function to update equipment availability when movements change
CREATE OR REPLACE FUNCTION public.update_equipment_availability()
RETURNS TRIGGER AS $$
BEGIN
  -- Update available quantity based on active movements
  UPDATE public.equipment 
  SET available_quantity = quantity - COALESCE((
    SELECT SUM(quantity) 
    FROM public.movements 
    WHERE equipment_id = NEW.equipment_id 
    AND status = 'activo' 
    AND movement_type = 'asignacion'
  ), 0)
  WHERE id = NEW.equipment_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for equipment availability
CREATE TRIGGER update_equipment_availability_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.movements
  FOR EACH ROW EXECUTE FUNCTION public.update_equipment_availability();