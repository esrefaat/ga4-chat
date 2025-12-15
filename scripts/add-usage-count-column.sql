-- Migration script to add usage_count column to saved_searches table
-- Run this script against your PostgreSQL database

-- Add usage_count column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'saved_searches' 
        AND column_name = 'usage_count'
    ) THEN
        ALTER TABLE saved_searches 
        ADD COLUMN usage_count INTEGER DEFAULT 0 NOT NULL;
        
        -- Create index for better query performance when ordering by usage_count
        CREATE INDEX IF NOT EXISTS idx_saved_searches_usage_count 
        ON saved_searches(username, usage_count DESC, created_at DESC);
    END IF;
END $$;

-- Update existing rows to have usage_count = 0 if NULL
UPDATE saved_searches 
SET usage_count = 0 
WHERE usage_count IS NULL;

