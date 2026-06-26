-- name: GetSeatsByFlight :many
SELECT s.*, cc.class_type, cc.price
FROM seats s
JOIN cabin_classes cc ON s.cabin_class_id = cc.id
WHERE s.flight_id = $1
ORDER BY s.seat_number;

-- name: GetAvailableSeatsByFlight :many
SELECT s.*, cc.class_type, cc.price
FROM seats s
JOIN cabin_classes cc ON s.cabin_class_id = cc.id
WHERE s.flight_id = $1 AND s.status = 'available'
ORDER BY s.seat_number;

-- name: UpdateSeatStatus :exec
UPDATE seats
SET status = $2
WHERE id = $1;