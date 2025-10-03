-- Enable RLS on all public tables that need it
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.n8n_chat_histories ENABLE ROW LEVEL SECURITY;

-- Fix search_path for existing functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'tecnico'
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_equipment_availability()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
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
$function$;

-- Add RLS policies for n8n_chat_histories (public access for chatbot)
CREATE POLICY "Allow public access to chat histories"
ON public.n8n_chat_histories
FOR ALL
TO public
USING (true);

-- Add RLS policies for classrooms
CREATE POLICY "Technicians can manage classrooms"
ON public.classrooms
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'tecnico') OR public.has_role(auth.uid(), 'administrador'));

-- Add RLS policies for teachers  
CREATE POLICY "Technicians can manage teachers"
ON public.teachers
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'tecnico') OR public.has_role(auth.uid(), 'administrador'));