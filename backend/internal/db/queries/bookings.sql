-- name: GetCabinClassByID :one
SELECT id, flight_id, class_type, price, total_seats 
FROM cabin_classes 
WHERE id = $1;

-- name: GetSeatByIDForUpdate :one
SELECT id, flight_id, cabin_class_id, seat_number, status 
FROM seats 
WHERE id = $1 AND status = 'available'
FOR UPDATE;

-- name: CreateBooking :one
INSERT INTO bookings (
    user_id, status, total_amount, booking_reference, 
    payment_status, created_at, updated_at
) VALUES (
    $1, 'pending', $2, $3, 'pending', NOW(), NOW()
)
RETURNING id, user_id, status, total_amount, booking_reference, payment_status, created_at, updated_at;

-- name: CreateBookingFlight :one
INSERT INTO booking_flights (booking_id, flight_id, flight_type, created_at)
VALUES ($1, $2, $3, NOW())
RETURNING id, booking_id, flight_id, flight_type;

-- name: CreatePassenger :one
INSERT INTO passengers (
    booking_id, first_name, last_name, email, 
    phone, date_of_birth, passport_number, created_at
) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
RETURNING id, booking_id, first_name, last_name, email, phone, date_of_birth, passport_number, created_at;

-- name: CreatePassengerSeat :exec
INSERT INTO passenger_seats (passenger_id, seat_id, created_at)
VALUES ($1, $2, NOW());

-- name: GetUserBookings :many
SELECT 
    b.id,
    b.user_id,
    b.status,
    b.total_amount,
    b.booking_reference,
    b.payment_status,
    b.created_at,
    b.updated_at,
    bf.flight_id,
    bf.flight_type,
    f.flight_number,
    f.airline_code,
    f.airline_name,
    f.departure_airport,
    f.arrival_airport,
    f.departure_time,
    f.arrival_time,
    f.duration,
    (
        SELECT cc.class_type
        FROM passengers p
        JOIN passenger_seats ps ON p.id = ps.passenger_id
        JOIN seats s ON ps.seat_id = s.id
        JOIN cabin_classes cc ON s.cabin_class_id = cc.id
        WHERE p.booking_id = b.id
        LIMIT 1
    ) as cabin_class
FROM bookings b
LEFT JOIN booking_flights bf ON b.id = bf.booking_id
LEFT JOIN flights f ON bf.flight_id = f.id
WHERE b.user_id = $1
ORDER BY b.created_at DESC;

-- name: GetBookingByID :one
SELECT 
    b.id,
    b.user_id,
    b.status,
    b.total_amount,
    b.booking_reference,
    b.payment_status,
    b.created_at,
    b.updated_at,
    bf.flight_id,
    bf.flight_type,
    f.flight_number,
    f.airline_code,
    f.airline_name,
    f.departure_airport,
    f.arrival_airport,
    f.departure_time,
    f.arrival_time,
    f.duration
FROM bookings b
LEFT JOIN booking_flights bf ON b.id = bf.booking_id
LEFT JOIN flights f ON bf.flight_id = f.id
WHERE b.id = $1;

-- name: GetBookingPassengers :many
SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.email,
    p.phone,
    p.date_of_birth,
    p.passport_number,
    ps.seat_id,
    s.seat_number
FROM passengers p
LEFT JOIN passenger_seats ps ON p.id = ps.passenger_id
LEFT JOIN seats s ON ps.seat_id = s.id
WHERE p.booking_id = $1;

-- name: CancelBooking :execrows
UPDATE bookings 
SET status = 'cancelled', updated_at = NOW() 
WHERE id = $1 AND user_id = $2 AND status = 'pending';

-- name: ReleaseSeats :exec
UPDATE seats 
SET status = 'available' 
WHERE id IN (
    SELECT ps.seat_id 
    FROM passenger_seats ps
    JOIN passengers p ON ps.passenger_id = p.id
    WHERE p.booking_id = $1
);