-- Adds image_urls column to household_pickups for unified media handling
ALTER TABLE household_pickups
  ADD COLUMN IF NOT EXISTS image_urls TEXT NULL;
