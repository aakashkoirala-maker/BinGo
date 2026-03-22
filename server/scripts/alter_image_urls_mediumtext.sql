-- Expand image_urls columns to avoid truncation of base64 data URIs
-- Use IF EXISTS/IF NOT EXISTS guards so the script is safe across environments

-- Waste reports already have image_urls; widen the column to MEDIUMTEXT
ALTER TABLE waste_reports MODIFY COLUMN image_urls MEDIUMTEXT NULL;

-- Dustbin requests already have image_urls; widen the column to MEDIUMTEXT
ALTER TABLE dustbin_requests MODIFY COLUMN image_urls MEDIUMTEXT NULL;

-- Household pickups may not have an image_urls column; add it if missing for parity
ALTER TABLE household_pickups ADD COLUMN IF NOT EXISTS image_urls MEDIUMTEXT NULL;
