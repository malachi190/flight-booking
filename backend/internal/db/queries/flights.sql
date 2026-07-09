-- name: CreateFlight :one
INSERT INTO flights (flight_number, airline_code, airline_name, departure_airport, arrival_airport, departure_time, arrival_time, duration, amadeus_id)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING *;

-- name: GetFlightByID :one
SELECT 
    id,
    flight_number,
    airline_code,
    airline_name,
    departure_airport,
    arrival_airport,
    departure_time,
    arrival_time,
    duration
FROM flights
WHERE id = $1 LIMIT 1;

-- name: ListFlightsByRoute :many
SELECT * FROM flights
WHERE departure_airport = $1 AND arrival_airport = $2
  AND departure_time >= $3 AND departure_time < $4
ORDER BY departure_time;

-- name: SearchFlights :many
SELECT 
    id,
    flight_number,
    airline_code,
    airline_name,
    departure_airport,
    arrival_airport,
    departure_time,
    arrival_time,
    duration
FROM flights
WHERE departure_airport = $1
  AND arrival_airport = $2
  AND departure_time >= $3
  AND departure_time < $4
  AND status = 'scheduled'
ORDER BY departure_time;

-- name: GetFlightCabinClasses :many
SELECT 
    cc.id,
    cc.class_type,
    cc.price,
    cc.total_seats,
    (SELECT COUNT(*) FROM seats WHERE cabin_class_id = cc.id AND status = 'available') as available_seats
FROM cabin_classes cc
WHERE cc.flight_id = $1;

-- name: GetFlightSeats :many
SELECT 
    s.id,
    s.seat_number,
    s.status,
    cc.id as cabin_class_id,
    cc.class_type
FROM seats s
JOIN cabin_classes cc ON s.cabin_class_id = cc.id
WHERE s.flight_id = $1
ORDER BY s.seat_number;

