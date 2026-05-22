-- Add refund_status column to appointments_cancelled table if it doesn't exist

-- Check if column exists and add it if not
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'appointments_cancelled' 
        AND column_name = 'refund_status'
    ) THEN
        ALTER TABLE appointments_cancelled 
        ADD COLUMN refund_status VARCHAR(50) DEFAULT 'pending';
        
        RAISE NOTICE 'Column refund_status added successfully';
    ELSE
        RAISE NOTICE 'Column refund_status already exists';
    END IF;
END $$;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_appointments_cancelled_refund_status 
ON appointments_cancelled(refund_status);

-- Add comment
COMMENT ON COLUMN appointments_cancelled.refund_status IS 'Status of refund: pending (needs processing), processed (no refund needed or completed)';

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'appointments_cancelled' 
AND column_name = 'refund_status';
