package dtos

import "time"

// Requests
type CreateBookingRequest struct {
	FlightID     string             `json:"flight_id" binding:"required"`
	CabinClassID string             `json:"cabin_class_id" binding:"required"`
	FlightType   string             `json:"flight_type" binding:"required,oneof=outbound return"`
	Passengers   []PassengerRequest `json:"passengers" binding:"required,dive"`
	SeatIDs      []string           `json:"seat_ids" binding:"required"`
}

type PassengerRequest struct {
	FirstName      string `json:"first_name" binding:"required"`
	LastName       string `json:"last_name" binding:"required"`
	Email          string `json:"email" binding:"omitempty,email"`
	Phone          string `json:"phone"`
	DateOfBirth    string `json:"date_of_birth" binding:"omitempty,datetime=2006-01-02"`
	PassportNumber string `json:"passport_number"`
}

// Responses
type BookingResponse struct {
	ID               string                `json:"id"`
	BookingReference string                `json:"booking_reference"`
	Status           string                `json:"status"`
	TotalAmount      float64               `json:"total_amount"`
	PaymentStatus    string                `json:"payment_status"`
	FlightID         string                `json:"flight_id"`
	CabinClass       string                `json:"cabin_class"`
	FlightType       string                `json:"flight_type"`
	Passengers       []PassengerResponse   `json:"passengers"`
	Seats            []SeatBookingResponse `json:"seats"`
	CreatedAt        time.Time             `json:"created_at"`
}

type PassengerResponse struct {
	ID             string `json:"id"`
	FirstName      string `json:"first_name"`
	LastName       string `json:"last_name"`
	Email          string `json:"email"`
	Phone          string `json:"phone"`
	DateOfBirth    string `json:"date_of_birth,omitempty"`
	PassportNumber string `json:"passport_number,omitempty"`
	SeatID         string `json:"seat_id"`
	SeatNumber     string `json:"seat_number"`
}

type SeatBookingResponse struct {
	ID         string `json:"id"`
	SeatNumber string `json:"seat_number"`
}

type UserBooking struct {
	ID               string    `json:"id"`
	BookingReference string    `json:"booking_reference"`
	Status           string    `json:"status"`
	TotalAmount      float64   `json:"total_amount"`
	PaymentStatus    string    `json:"payment_status"`
	FlightID         string    `json:"flight_id"`
	FlightType       string    `json:"flight_type"`
	FlightNumber     string    `json:"flight_number"`
	AirlineCode      string    `json:"airline_code"`
	AirlineName      string    `json:"airline_name"`
	DepartureAirport string    `json:"departure_airport"`
	ArrivalAirport   string    `json:"arrival_airport"`
	DepartureTime    time.Time `json:"departure_time"`
	ArrivalTime      time.Time `json:"arrival_time"`
	CabinClass       string    `json:"cabin_class"`
	Duration         string    `json:"duration"`
	CreatedAt        time.Time `json:"created_at"`
}

type BookingDetailResponse struct {
	ID               string             `json:"id"`
	BookingReference string             `json:"booking_reference"`
	Status           string             `json:"status"`
	TotalAmount      float64            `json:"total_amount"`
	PaymentStatus    string             `json:"payment_status"`
	FlightID         string             `json:"flight_id"`
	FlightType       string             `json:"flight_type"`
	FlightNumber     string             `json:"flight_number"`
	AirlineCode      string             `json:"airline_code"`
	AirlineName      string             `json:"airline_name"`
	DepartureAirport string             `json:"departure_airport"`
	ArrivalAirport   string             `json:"arrival_airport"`
	DepartureTime    time.Time          `json:"departure_time"`
	ArrivalTime      time.Time          `json:"arrival_time"`
	Duration         string             `json:"duration"`
	Passengers       []BookingPassenger `json:"passengers"`
	CreatedAt        time.Time          `json:"created_at"`
}

type BookingPassenger struct {
	ID             string `json:"id"`
	FirstName      string `json:"first_name"`
	LastName       string `json:"last_name"`
	Email          string `json:"email"`
	Phone          string `json:"phone"`
	DateOfBirth    string `json:"date_of_birth,omitempty"`
	PassportNumber string `json:"passport_number,omitempty"`
	SeatID         string `json:"seat_id"`
	SeatNumber     string `json:"seat_number"`
}
