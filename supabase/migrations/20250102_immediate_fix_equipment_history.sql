-- Immediate fix for equipment_history foreign key constraint issue
-- This script should be run to fix the current constraint problem

-- First, let's see what invalid equipment_id references exist
-- and clean them up by setting them to NULL

-- Update any records with invalid equipment_id references to NULL
UPDATE equipment_history 
SET equipment_id = NULL 
WHERE equipment_id IS NOT NULL 
AND equipment_id NOT IN (SELECT id FROM equipment);

-- Drop the existing problematic foreign key constraint
ALTER TABLE equipment_history DROP CONSTRAINT IF EXISTS equipment_history_equipment_id_fkey;

-- Recreate the foreign key constraint with ON DELETE SET NULL
ALTER TABLE equipment_history 
ADD CONSTRAINT equipment_history_equipment_id_fkey 
FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE SET NULL;

-- Ensure the changed_by constraint is also correct
ALTER TABLE equipment_history DROP CONSTRAINT IF EXISTS equipment_history_changed_by_fkey;

ALTER TABLE equipment_history 
ADD CONSTRAINT equipment_history_changed_by_fkey 
FOREIGN KEY (changed_by) REFERENCES profiles(id) ON DELETE CASCADE;

-- Add any missing indexes
CREATE INDEX IF NOT EXISTS idx_equipment_history_equipment_id ON equipment_history(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_history_changed_by ON equipment_history(changed_by);
CREATE INDEX IF NOT EXISTS idx_equipment_history_action ON equipment_history(action);
CREATE INDEX IF NOT EXISTS idx_equipment_history_created_at ON equipment_history(created_at);

-- Ensure change_details column exists
ALTER TABLE equipment_history ADD COLUMN IF NOT EXISTS change_details JSONB;
