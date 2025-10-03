-- Fix equipment_history foreign key constraints
-- This migration fixes the foreign key relationships for equipment_history table

-- Drop existing foreign key constraints if they exist
ALTER TABLE equipment_history DROP CONSTRAINT IF EXISTS equipment_history_equipment_id_fkey;
ALTER TABLE equipment_history DROP CONSTRAINT IF EXISTS equipment_history_changed_by_fkey;

-- Add the correct foreign key constraints
-- equipment_id can be NULL for user-related actions, and SET NULL when equipment is deleted
ALTER TABLE equipment_history 
ADD CONSTRAINT equipment_history_equipment_id_fkey 
FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE SET NULL;

ALTER TABLE equipment_history 
ADD CONSTRAINT equipment_history_changed_by_fkey 
FOREIGN KEY (changed_by) REFERENCES profiles(id) ON DELETE CASCADE;

-- Ensure the change_details column exists
ALTER TABLE equipment_history ADD COLUMN IF NOT EXISTS change_details JSONB;

-- Update any existing records that might have invalid equipment_id references
-- Set equipment_id to NULL for records that reference non-existent equipment
UPDATE equipment_history 
SET equipment_id = NULL 
WHERE equipment_id IS NOT NULL 
AND equipment_id NOT IN (SELECT id FROM equipment);

-- Update any existing records that might have invalid changed_by references
-- This is more critical, so we'll need to handle this carefully
-- First, let's see if there are any invalid references
-- If there are, we might need to either delete them or update them to a valid user

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_equipment_history_equipment_id ON equipment_history(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_history_changed_by ON equipment_history(changed_by);
CREATE INDEX IF NOT EXISTS idx_equipment_history_action ON equipment_history(action);
CREATE INDEX IF NOT EXISTS idx_equipment_history_created_at ON equipment_history(created_at);
