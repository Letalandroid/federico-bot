-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('administrador', 'tecnico');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Migrate existing roles from profiles to user_roles (handling type conversion)
INSERT INTO public.user_roles (user_id, role)
SELECT 
  user_id, 
  CASE 
    WHEN profiles.role::text = 'administrador' THEN 'administrador'::app_role
    WHEN profiles.role::text = 'tecnico' THEN 'tecnico'::app_role
    ELSE 'tecnico'::app_role
  END as role
FROM public.profiles
ON CONFLICT (user_id, role) DO NOTHING;

-- Update RLS policies to use the new role system

-- Categories policies
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories"
ON public.categories
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'administrador'));

-- Equipment policies  
DROP POLICY IF EXISTS "Authenticated users can manage equipment" ON public.equipment;
DROP POLICY IF EXISTS "Authenticated users can view equipment" ON public.equipment;
CREATE POLICY "Technicians can manage equipment"
ON public.equipment
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'tecnico') OR public.has_role(auth.uid(), 'administrador'));

-- Profiles policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'administrador'));

-- User roles policies
CREATE POLICY "Admins can manage user roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Movements policies
DROP POLICY IF EXISTS "Authenticated users can manage movements" ON public.movements;
DROP POLICY IF EXISTS "Authenticated users can view movements" ON public.movements;
CREATE POLICY "Technicians can manage movements"
ON public.movements
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'tecnico') OR public.has_role(auth.uid(), 'administrador'));

-- Add reason column to equipment_history for tracking why changes were made
ALTER TABLE public.equipment_history
ADD COLUMN IF NOT EXISTS reason TEXT;

-- Add comment to explain the reason field
COMMENT ON COLUMN public.equipment_history.reason IS 'Motivo del cambio, especialmente importante para estados como dañado o baja';