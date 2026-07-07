-- +goose Up
-- +goose StatementBegin

-- Add missing columns for mock data seeding
ALTER TABLE flights 
    ADD COLUMN IF NOT EXISTS base_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'scheduled';

-- Remove unused third-party API columns
ALTER TABLE flights 
    DROP COLUMN IF EXISTS amadeus_id,
    DROP COLUMN IF EXISTS wakanow_id;

-- Drop obsolete indexes
DROP INDEX IF EXISTS idx_flights_amadeus_id;
DROP INDEX IF EXISTS idx_flights_wakanow_id;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

-- Restore API columns
ALTER TABLE flights 
    ADD COLUMN IF NOT EXISTS amadeus_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS wakanow_id VARCHAR(100);

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_flights_amadeus_id ON flights(amadeus_id);
CREATE INDEX IF NOT EXISTS idx_flights_wakanow_id ON flights(wakanow_id);

-- Remove added columns
ALTER TABLE flights 
    DROP COLUMN IF EXISTS base_price,
    DROP COLUMN IF EXISTS status;

-- +goose StatementEnd