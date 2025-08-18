-- Migration 006: Fix submit_mode column in site_visits table
-- This migration ensures the submit_mode column exists and is properly configured

-- Check if submit_mode column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'site_visits' 
        AND column_name = 'submit_mode'
    ) THEN
        -- Add submit_mode column
        ALTER TABLE site_visits 
        ADD COLUMN submit_mode TEXT NOT NULL DEFAULT 'live' 
        CHECK (submit_mode IN ('mock', 'live'));
        
        -- Create index for filtering
        CREATE INDEX IF NOT EXISTS idx_site_visits_submit_mode 
        ON site_visits(submit_mode);
        
        -- Update existing records to 'live' (production default)
        UPDATE site_visits 
        SET submit_mode = 'live' 
        WHERE submit_mode IS NULL;
        
        RAISE NOTICE 'Added submit_mode column to site_visits table';
    ELSE
        RAISE NOTICE 'submit_mode column already exists in site_visits table';
    END IF;
END $$;
