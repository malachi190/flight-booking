-- name: CreateFlight :one
INSERT INTO flights (flight_number, airline_code, airline_name, departure_airport, arrival_airport, departure_time, arrival_time, duration, amadeus_id)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING *;

-- name: GetFlightByID :one
SELECT * FROM flights
WHERE id = $1 LIMIT 1;

-- name: ListFlightsByRoute :many
SELECT * FROM flights
WHERE departure_airport = $1 AND arrival_airport = $2
  AND departure_time >= $3 AND departure_time < $4
ORDER BY departure_time;