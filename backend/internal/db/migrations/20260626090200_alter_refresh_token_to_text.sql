-- +goose Up
ALTER TABLE users ALTER COLUMN refresh_token TYPE TEXT;

-- +goose Down
ALTER TABLE users ALTER COLUMN refresh_token TYPE VARCHAR(255);