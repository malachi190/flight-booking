package dtos

type SeatMapResponse struct {
	FlightID     string              `json:"flight_id"`
	CabinClasses []CabinClassSeatMap `json:"cabin_classes"`
}

type CabinClassSeatMap struct {
	ID   string    `json:"id"`
	Type string    `json:"class_type"`
	Rows []SeatRow `json:"rows"`
}

type SeatRow struct {
	RowNumber int        `json:"row_number"`
	Seats     []SeatInfo `json:"seats"`
}

type SeatInfo struct {
	ID         string `json:"id"`
	SeatNumber string `json:"seat_number"`
	Status     string `json:"status"`
}
