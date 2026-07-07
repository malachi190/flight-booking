package flights

import (
	"context"
	"encoding/json"
	"fmt"
	"sort"
	"time"

	"github.com/emicklei/pgtalk/convert"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/malachi190/flights/internal/cache"
	"github.com/malachi190/flights/internal/db"
	"github.com/malachi190/flights/internal/dtos"
	"github.com/malachi190/flights/internal/helpers"
)

type Service struct {
	queries *db.Queries
	cache   *cache.Client
}

func NewService(queries *db.Queries, cacheClient *cache.Client) *Service {
	return &Service{
		queries: queries,
		cache:   cacheClient,
	}
}

type FlightData struct {
	Origin      string
	Destination string
	Date        string
	Class       string
	Adults      int
}

// Search flights
func (s *Service) Search(ctx context.Context, flightData *FlightData) (*dtos.FlightSearchResponse, error) {
	cacheKey := cache.FlightSearchKey(flightData.Origin, flightData.Destination, flightData.Date, flightData.Class, flightData.Adults)

	// Check cache
	if cached, ok := s.cache.GetFlightSearch(ctx, cacheKey); ok {
		var resp dtos.FlightSearchResponse

		if err := json.Unmarshal(cached, &resp); err == nil {
			return &resp, nil
		}
	}

	// Parse date range
	start, err := time.Parse("2006-01-02", flightData.Date)

	if err != nil {
		return nil, fmt.Errorf("invalid date: %w", err)
	}

	end := start.Add(24 * time.Hour)

	// query flights
	dbFlights, err := s.queries.SearchFlights(ctx, db.SearchFlightsParams{
		DepartureAirport: flightData.Origin,
		ArrivalAirport:   flightData.Destination,
		DepartureTime:    pgtype.Timestamptz{Time: start, Valid: true},
		DepartureTime_2:  pgtype.Timestamptz{Time: end, Valid: true},
	})

	if err != nil {
		return nil, fmt.Errorf("search flights: %w", err)
	}

	result := dtos.FlightSearchResponse{
		Data: make([]dtos.FlightResult, 0, len(dbFlights)),
	}

	for _, f := range dbFlights {
		flight := dtos.FlightResult{
			ID:               f.ID.String(),
			FlightNumber:     f.FlightNumber,
			AirlineCode:      f.AirlineCode,
			AirlineName:      f.AirlineName.String,
			DepartureAirport: f.DepartureAirport,
			ArrivalAirport:   f.ArrivalAirport,
			DepartureTime:    f.DepartureTime.Time,
			ArrivalTime:      f.ArrivalTime.Time,
			Duration:         f.Duration.String,
		}

		cabinClasses, err := s.queries.GetFlightCabinClasses(ctx, f.ID)

		if err != nil {
			return nil, fmt.Errorf("get cabin classes: %w", err)
		}

		for _, cc := range cabinClasses {
			// filter by requested class
			if flightData.Class != "" && cc.ClassType != flightData.Class {
				continue
			}

			// filter by availability for passenger count
			if cc.AvailableSeats < int64(flightData.Adults) {
				continue
			}

			price, err := helpers.NumericToFloat64(cc.Price)

			if err != nil {
				return nil, fmt.Errorf("convert price for cabin %s: %w", cc.ClassType, err)
			}

			flight.CabinClasses = append(flight.CabinClasses, dtos.CabinClassResult{
				ID:             cc.ID.String(),
				ClassType:      cc.ClassType,
				Price:          price,
				AvailableSeats: cc.AvailableSeats,
				TotalSeats:     cc.TotalSeats,
			})
		}

		// only include if at least one cabin class has enough seats
		if len(flight.CabinClasses) > 0 {
			result.Data = append(result.Data, flight)
		}
	}

	// cache miss - store result
	if respBytes, err := json.Marshal(result); err == nil {
		_ = s.cache.SetFlightSearch(ctx, cacheKey, respBytes, 15*time.Minute)
	}

	return &result, nil
}

// Fetch seat mapping
func (s *Service) GetSeatsMap(ctx context.Context, flightID string) (*dtos.SeatMapResponse, error) {
	id := convert.StringToUUID(flightID)

	seats, err := s.queries.GetFlightSeats(ctx, id)

	if err != nil {
		return nil, fmt.Errorf("flight seat error: %w", err)
	}

	if len(seats) == 0 {
		return nil, fmt.Errorf("flight not found or no seats")
	}

	// grouped by cabin class, then by row
	cabinMap := make(map[string]*dtos.CabinClassSeatMap)
	rowMap := make(map[string]map[int]*dtos.SeatRow) // [cabinID][rowNumber]*SeatRow

	// iterate/range over seats and map
	for _, s := range seats {
		cabinID := s.CabinClassID.String()

		// init cabin class group
		if _, ok := cabinMap[cabinID]; !ok {
			cabinMap[cabinID] = &dtos.CabinClassSeatMap{
				ID:   cabinID,
				Type: s.ClassType,
				Rows: []dtos.SeatRow{},
			}
			rowMap[cabinID] = make(map[int]*dtos.SeatRow)
		}

		// parse row from seat number (e.g "1A" -> row 1)
		rowNum := parseSeatRow(s.SeatNumber)

		// init row group
		if _, ok := rowMap[cabinID][rowNum]; !ok {
			rowMap[cabinID][rowNum] = &dtos.SeatRow{
				RowNumber: rowNum,
				Seats:     []dtos.SeatInfo{},
			}
		}

		rowMap[cabinID][rowNum].Seats = append(rowMap[cabinID][rowNum].Seats, dtos.SeatInfo{
			ID:         s.ID.String(),
			SeatNumber: s.SeatNumber,
			Status:     s.Status,
		})
	}

	// assemble rows into cabin classes (sorted by row number)
	result := &dtos.SeatMapResponse{
		FlightID:     flightID,
		CabinClasses: make([]dtos.CabinClassSeatMap, 0, len(cabinMap)),
	}

	for _, cabin := range cabinMap {
		rows := make([]dtos.SeatRow, 0, len(rowMap[cabin.ID]))
		for _, row := range rowMap[cabin.ID] {
			rows = append(rows, *row)
		}

		// sort rows by number
		sort.Slice(rows, func(i, j int) bool {
			return rows[i].RowNumber < rows[j].RowNumber
		})
		cabin.Rows = rows
		result.CabinClasses = append(result.CabinClasses, *cabin)
	}

	// sort cabin classes: economy first, then business
	sort.Slice(result.CabinClasses, func(i, j int) bool {
		order := map[string]int{"economy": 0, "business": 1}
		return order[result.CabinClasses[i].Type] < order[result.CabinClasses[j].Type]
	})

	return result, nil
}

func parseSeatRow(seatNumber string) int {
	var row int
	fmt.Sscanf(seatNumber, "%d", &row)
	return row
}
