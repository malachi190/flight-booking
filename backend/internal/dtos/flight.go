package dtos

import "time"

type CabinClassResult struct {
	ID             string  `json:"id"`
	ClassType      string  `json:"class_type"`
	Price          float64 `json:"price"`
	AvailableSeats int64   `json:"available_seats"`
	TotalSeats     int32   `json:"total_seats"`
}

type FlightResult struct {
	ID               string             `json:"id"`
	FlightNumber     string             `json:"flight_number"`
	AirlineCode      string             `json:"airline_code"`
	AirlineName      string             `json:"airline_name"`
	DepartureAirport string             `json:"departure_airport"`
	ArrivalAirport   string             `json:"arrival_airport"`
	DepartureTime    time.Time          `json:"departure_time"`
	ArrivalTime      time.Time          `json:"arrival_time"`
	Duration         string             `json:"duration"`
	CabinClasses     []CabinClassResult `json:"cabin_classes"`
}

type FlightSearchResponse struct {
	Data []FlightResult `json:"data"`
}

type FlightResponse struct {
	Data FlightResult `json:"data"`
}
