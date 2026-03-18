-- Database Initialization for Federico Bot (Production/Custom Backend)
-- This script initializes a standard PostgreSQL database without Supabase dependencies.

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Define ENUM types (Used for data integrity)
DO $$ BEGIN
    CREATE TYPE public.equipment_state AS ENUM ('disponible', 'en_uso', 'mantenimiento', 'dañado', 'baja');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.movement_type AS ENUM ('asignacion', 'devolucion', 'mantenimiento', 'baja');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Create Tables

-- Profiles table (Custom authentication)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'tecnico',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Equipment table
CREATE TABLE IF NOT EXISTS public.equipment (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  available_quantity INTEGER NOT NULL DEFAULT 1 CHECK (available_quantity >= 0),
  state public.equipment_state NOT NULL DEFAULT 'disponible',
  serial_number TEXT,
  brand TEXT,
  model TEXT,
  purchase_date DATE,
  warranty_expiration DATE,
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Teachers table
CREATE TABLE IF NOT EXISTS public.teachers (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  full_name TEXT NOT NULL,
  dni TEXT UNIQUE,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Classrooms table
CREATE TABLE IF NOT EXISTS public.classrooms (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  capacity INTEGER,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Movements table
CREATE TABLE IF NOT EXISTS public.movements (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  equipment_id UUID REFERENCES public.equipment(id) NOT NULL,
  teacher_id UUID REFERENCES public.teachers(id),
  classroom_id UUID REFERENCES public.classrooms(id),
  movement_type public.movement_type NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  description TEXT,
  scheduled_return_date DATE,
  actual_return_date DATE,
  status TEXT NOT NULL DEFAULT 'activo' CHECK (status IN ('activo', 'completado', 'vencido')),
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Equipment history table
CREATE TABLE IF NOT EXISTS public.equipment_history (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  equipment_id UUID REFERENCES public.equipment(id) NOT NULL,
  action TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  changed_by UUID REFERENCES public.profiles(id) NOT NULL,
  change_details JSONB,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Equipment registry table (for incidents)
CREATE TABLE IF NOT EXISTS public.equipment_registry (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('malogro', 'baja', 'mantenimiento', 'reparacion')),
  description TEXT NOT NULL,
  date_occurred DATE NOT NULL,
  reported_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'en_proceso', 'resuelto', 'irreparable')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- n8n chat histories table
CREATE TABLE IF NOT EXISTS public.n8n_chat_histories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id TEXT,
    message TEXT NOT NULL,
    response TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Functions and Triggers

-- Update updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- Trigger for categories
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- Trigger for equipment
CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON public.equipment FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- Trigger for teachers
CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON public.teachers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- Trigger for classrooms
CREATE TRIGGER update_classrooms_updated_at BEFORE UPDATE ON public.classrooms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- Trigger for movements
CREATE TRIGGER update_movements_updated_at BEFORE UPDATE ON public.movements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- Trigger for equipment_registry
CREATE TRIGGER update_equipment_registry_updated_at BEFORE UPDATE ON public.equipment_registry FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Equipment availability function
CREATE OR REPLACE FUNCTION public.update_equipment_availability()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.equipment 
  SET available_quantity = quantity - COALESCE((
    SELECT SUM(quantity) 
    FROM public.movements 
    WHERE equipment_id = COALESCE(NEW.equipment_id, OLD.equipment_id)
    AND status = 'activo' 
    AND movement_type = 'asignacion'
  ), 0)
  WHERE id = COALESCE(NEW.equipment_id, OLD.equipment_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_equipment_availability_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.movements
  FOR EACH ROW EXECUTE FUNCTION public.update_equipment_availability();

-- 5. Initial Seed Data

-- Default Categories
INSERT INTO public.categories (name, description) VALUES
  ('Computadoras', 'Computadoras de escritorio y laptops'),
  ('Proyectores', 'Proyectores y equipos de proyección'),
  ('Impresoras', 'Impresoras y scanners'),
  ('Audio', 'Equipos de audio y sonido'),
  ('Red', 'Equipos de red y conectividad'),
  ('Accesorios', 'Accesorios y periféricos')
ON CONFLICT (name) DO NOTHING;

-- Default Classrooms
INSERT INTO public.classrooms (name, description, capacity, location) VALUES
  ('Aula 101', 'Aula de Informática Principal', 30, 'Piso 1'),
  ('Aula 102', 'Aula de Computación', 25, 'Piso 1'),
  ('Laboratorio', 'Laboratorio de Sistemas', 20, 'Piso 2'),
  ('Biblioteca', 'Centro de recursos educativos', 40, 'Piso 1'),
  ('Auditorio', 'Auditorio principal', 100, 'Piso 2')
ON CONFLICT (name) DO NOTHING;

-- Default Admin Profile
-- Password for 'admin@admin.com': 'A#m!n2025' (hashed via backend/fix_pass.js)
INSERT INTO public.profiles (id, email, full_name, role, password_hash)
VALUES (
    '00000000-0000-0000-0000-000000000000', 
    'admin@admin.com', 
    'Administrador', 
    'administrador', 
    '$2b$10$YpT80Slce3c4cKfnEiNMV.Lx4Lsp/ngKq9mQH7Xdvcd3a.g2czrIe' -- Hash for 'A#m!n2025'
)
ON CONFLICT (email) DO NOTHING;
