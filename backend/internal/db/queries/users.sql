-- name: CreateUser :one
INSERT INTO users (email, password_hash, first_name, last_name)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetUserByEmail :one
SELECT * FROM users
WHERE email = $1 LIMIT 1;

-- name: GetUserByID :one
SELECT * FROM users
WHERE id = $1 LIMIT 1;

-- name: UpdateUserRefreshToken :exec
UPDATE users
SET refresh_token = $2, refresh_token_expires_at = $3, updated_at = NOW()
WHERE id = $1;

-- name: ClearUserRefreshToken :exec
UPDATE users
SET refresh_token = NULL, refresh_token_expires_at = NULL, updated_at = NOW()
WHERE id = $1;