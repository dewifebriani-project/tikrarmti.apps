-- Add price column to programs table
ALTER TABLE programs
ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0 CHECK (price >= 0),
ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'IDR';

-- Update existing programs to have proper pricing
-- Set Muallimah program to 5,000,000 IDR
UPDATE programs
SET price = 5000000, is_free = false
WHERE name ILIKE '%muallimah%' AND price = 0;

-- Set Musyrifah program to 3,500,000 IDR
UPDATE programs
SET price = 3500000, is_free = false
WHERE name ILIKE '%musyrifah%' AND price = 0;

-- Set Tikrar Tahfidz program to free
UPDATE programs
SET price = 0, is_free = true
WHERE name ILIKE '%tikrar%' AND name ILIKE '%tahfidz%';

-- Create index for price queries
CREATE INDEX IF NOT EXISTS idx_programs_price ON programs(price);
CREATE INDEX IF NOT EXISTS idx_programs_is_free ON programs(is_free);

-- Grant permissions
GRANT ALL ON programs TO service_role;
GRANT ALL ON programs TO authenticated;
GRANT SELECT ON programs TO anon;

-- Verify the updates
SELECT
    name,
    price,
    is_free,
    currency,
    CASE
        WHEN is_free THEN 'GRATIS'
        ELSE CONCAT('Rp ', FORMAT(price, 0, 'id_ID'))
    END as formatted_price
FROM programs
ORDER BY created_at DESC;