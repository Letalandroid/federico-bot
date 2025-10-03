-- Script to fix equipment_history foreign key constraint issue
-- Execute this in your Supabase SQL editor

-- Step 1: Clean up any invalid equipment_id references
UPDATE equipment_history 
SET equipment_id = NULL 
WHERE equipment_id IS NOT NULL 
AND equipment_id NOT IN (SELECT id FROM equipment);

-- Step 2: Drop the existing problematic foreign key constraint
ALTER TABLE equipment_history DROP CONSTRAINT IF EXISTS equipment_history_equipment_id_fkey;

-- Step 3: Recreate the foreign key constraint with ON DELETE SET NULL
ALTER TABLE equipment_history 
ADD CONSTRAINT equipment_history_equipment_id_fkey 
FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE SET NULL;

-- Step 4: Ensure the changed_by constraint is correct
ALTER TABLE equipment_history DROP CONSTRAINT IF EXISTS equipment_history_changed_by_fkey;

ALTER TABLE equipment_history 
ADD CONSTRAINT equipment_history_changed_by_fkey 
FOREIGN KEY (changed_by) REFERENCES profiles(id) ON DELETE CASCADE;

-- Step 5: Add missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_equipment_history_equipment_id ON equipment_history(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_history_changed_by ON equipment_history(changed_by);
CREATE INDEX IF NOT EXISTS idx_equipment_history_action ON equipment_history(action);
CREATE INDEX IF NOT EXISTS idx_equipment_history_created_at ON equipment_history(created_at);

-- Step 6: Ensure change_details column exists
ALTER TABLE equipment_history ADD COLUMN IF NOT EXISTS change_details JSONB;

-- Verify the constraints are correct
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name='equipment_history';
