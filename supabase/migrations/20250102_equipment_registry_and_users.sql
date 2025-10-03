-- Create equipment_registry table
CREATE TABLE IF NOT EXISTS equipment_registry (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('malogro', 'baja', 'mantenimiento', 'reparacion')),
  description TEXT NOT NULL,
  date_occurred DATE NOT NULL,
  reported_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'en_proceso', 'resuelto', 'irreparable')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add is_active column to profiles if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create equipment_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS equipment_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id UUID,
  action TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  change_details JSONB,
  changed_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add change_details column if it doesn't exist
ALTER TABLE equipment_history ADD COLUMN IF NOT EXISTS change_details JSONB;

-- Drop existing foreign key constraints if they exist
ALTER TABLE equipment_history DROP CONSTRAINT IF EXISTS equipment_history_equipment_id_fkey;
ALTER TABLE equipment_history DROP CONSTRAINT IF EXISTS equipment_history_changed_by_fkey;

-- Add foreign key constraints (equipment_id can be NULL for user-related actions)
ALTER TABLE equipment_history 
ADD CONSTRAINT equipment_history_equipment_id_fkey 
FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE SET NULL;

ALTER TABLE equipment_history 
ADD CONSTRAINT equipment_history_changed_by_fkey 
FOREIGN KEY (changed_by) REFERENCES profiles(id) ON DELETE CASCADE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_equipment_registry_equipment_id ON equipment_registry(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_registry_reported_by ON equipment_registry(reported_by);
CREATE INDEX IF NOT EXISTS idx_equipment_registry_date_occurred ON equipment_registry(date_occurred);
CREATE INDEX IF NOT EXISTS idx_equipment_registry_reason ON equipment_registry(reason);
CREATE INDEX IF NOT EXISTS idx_equipment_registry_status ON equipment_registry(status);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);

CREATE INDEX IF NOT EXISTS idx_equipment_history_equipment_id ON equipment_history(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_history_changed_by ON equipment_history(changed_by);
CREATE INDEX IF NOT EXISTS idx_equipment_history_action ON equipment_history(action);
CREATE INDEX IF NOT EXISTS idx_equipment_history_created_at ON equipment_history(created_at);

-- Enable Row Level Security
ALTER TABLE equipment_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for equipment_registry
CREATE POLICY "Users can view equipment registries" ON equipment_registry
  FOR SELECT USING (true);

CREATE POLICY "Users can insert equipment registries" ON equipment_registry
  FOR INSERT WITH CHECK (auth.uid() = reported_by);

CREATE POLICY "Users can update equipment registries" ON equipment_registry
  FOR UPDATE USING (auth.uid() = reported_by);

CREATE POLICY "Users can delete equipment registries" ON equipment_registry
  FOR DELETE USING (auth.uid() = reported_by);

-- Create RLS policies for profiles
CREATE POLICY "Users can view profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create RLS policies for equipment_history
CREATE POLICY "Users can view equipment history" ON equipment_history
  FOR SELECT USING (true);

CREATE POLICY "System can insert equipment history" ON equipment_history
  FOR INSERT WITH CHECK (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_equipment_registry_updated_at
  BEFORE UPDATE ON equipment_registry
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default admin user if it doesn't exist
INSERT INTO profiles (id, full_name, role, is_active)
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  'Administrador',
  'admin',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM profiles WHERE role = 'admin'
);
