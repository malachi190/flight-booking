package bookings

import (
	"context"
	"fmt"
	"math/rand"
	"strconv"
	"time"

	"github.com/emicklei/pgtalk/convert"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/malachi190/flights/internal/db"
	"github.com/malachi190/flights/internal/dtos"
	"github.com/malachi190/flights/internal/helpers"
	"github.com/malachi190/flights/internal/logger"
)

type Service struct {
	pool    *pgxpool.Pool
	queries *db.Queries
}

func NewBookingService(pool *pgxpool.Pool, queries *db.Queries) *Service {
	return &Service{
		pool:    pool,
		queries: queries,
	}
}

// Create Booking
func (s *Service) Create(ctx context.Context, userID string, req *dtos.CreateBookingRequest) (*dtos.BookingResponse, error) {
	// logger.Log.Info().Interface("seatIDs", req.SeatIDs).Msg("seats")
	// validation
	if len(req.Passengers) != len(req.SeatIDs) {
		return nil, fmt.Errorf("passenger count (%d) must match seat count (%d)", len(req.Passengers), len(req.SeatIDs))
	}

	cabinClassID := convert.StringToUUID(req.CabinClassID)
	flightID := convert.StringToUUID(req.FlightID)
	userUUID := convert.StringToUUID(userID)

	// get cabin class price
	cabinClass, err := s.queries.GetCabinClassByID(ctx, cabinClassID)

	if err != nil {
		return nil, fmt.Errorf("cabin class not found")
	}

	// verify cabin class belongs to requested flight
	if cabinClass.FlightID != flightID {
		return nil, fmt.Errorf("cabin class does not belong to this flight")
	}

	// begin transaction
	tx, err := s.pool.Begin(ctx)

	if err != nil {
		return nil, fmt.Errorf("begin transaction: %w", err)
	}

	defer tx.Rollback(ctx)

	q := db.New(tx)

	// lock seats in consistent order to prevent deadlocks
	var seatUUIDs []pgtype.UUID
	// seatUUIDs := make([]pgtype.UUID, len(req.SeatIDs))

	for _, sID := range req.SeatIDs {
		seatUUIDs = append(seatUUIDs, convert.StringToUUID(sID))
	}

	// sort seat IDs for consistent locking order
	for i := 0; i < len(seatUUIDs); i++ {
		for j := i + 1; j < len(seatUUIDs); j++ {
			if seatUUIDs[i].String() > seatUUIDs[j].String() {
				seatUUIDs[i], seatUUIDs[j] = seatUUIDs[j], seatUUIDs[i]
			}
		}
	}

	lockedSeats := make([]db.Seat, 0, len(seatUUIDs))

	logger.Log.Info().Interface("seatUUIDs", seatUUIDs).Msg("seat UUID logged")

	for _, sID := range seatUUIDs {
		seatUpdate, err := q.GetSeatByIDForUpdate(ctx, sID)

		if err != nil {
			return nil, fmt.Errorf("seat %s not available or does not exist", sID)
		}

		// verify seat belongs to the requested cabin class
		if seatUpdate.CabinClassID != cabinClassID {
			return nil, fmt.Errorf("seat %s does not belong to the selected cabin class", seatUpdate.SeatNumber)
		}

		seat := db.Seat{
			ID:           seatUpdate.ID,
			FlightID:     seatUpdate.FlightID,
			CabinClassID: seatUpdate.CabinClassID,
			SeatNumber:   seatUpdate.SeatNumber,
			Status:       seatUpdate.Status,
		}

		lockedSeats = append(lockedSeats, seat)
	}

	// calculate total
	price, err := helpers.NumericToFloat64(cabinClass.Price)

	if err != nil {
		return nil, fmt.Errorf("parse cabin price: %w", err)
	}

	totalAmount := price * float64(len(req.Passengers))

	// genrate booking reference
	ref := generateBookingReference()

	// create booking
	totalStr := strconv.FormatFloat(totalAmount, 'f', 2, 64)
	total := pgtype.Numeric{}

	if err := total.Scan(totalStr); err != nil {
		return nil, fmt.Errorf("convert total: %w", err)
	}

	booking, err := q.CreateBooking(ctx, db.CreateBookingParams{
		UserID:           userUUID,
		TotalAmount:      total,
		BookingReference: ref,
	})

	if err != nil {
		return nil, fmt.Errorf("create booking: %w", err)
	}

	// create booking flight
	_, err = q.CreateBookingFlight(ctx, db.CreateBookingFlightParams{
		BookingID:  booking.ID,
		FlightID:   flightID,
		FlightType: req.FlightType,
	})

	if err != nil {
		return nil, fmt.Errorf("create booking flight: %w", err)
	}

	// create passengers and assign seats
	passengerResponses := make([]dtos.PassengerResponse, 0, len(req.Passengers))

	for i, p := range req.Passengers {
		dob := pgtype.Date{}

		if p.DateOfBirth != "" {
			t, _ := time.Parse("2006-01-02", p.DateOfBirth)
			dob = pgtype.Date{Time: t, Valid: true}
		}

		passenger, err := q.CreatePassenger(ctx, db.CreatePassengerParams{
			BookingID:      booking.ID,
			FirstName:      p.FirstName,
			LastName:       p.LastName,
			Email:          pgtype.Text{String: p.Email, Valid: p.Email != ""},
			Phone:          pgtype.Text{String: p.Phone, Valid: p.Phone != ""},
			DateOfBirth:    dob,
			PassportNumber: pgtype.Text{String: p.PassportNumber, Valid: p.PassportNumber != ""},
		})

		if err != nil {
			return nil, fmt.Errorf("create passenger: %w", err)
		}

		// assign seat
		seat := lockedSeats[i]
		err = q.CreatePassengerSeat(ctx, db.CreatePassengerSeatParams{
			PassengerID: passenger.ID,
			SeatID:      seat.ID,
		})

		if err != nil {
			return nil, fmt.Errorf("assign seat: %w", err)
		}

		// mark seat as booked
		err = q.UpdateSeatStatus(ctx, db.UpdateSeatStatusParams{
			ID:     seat.ID,
			Status: "booked",
		})

		if err != nil {
			return nil, fmt.Errorf("update seat status: %w", err)
		}

		dobStr := ""

		if passenger.DateOfBirth.Valid {
			dobStr = passenger.DateOfBirth.Time.Format("2006-01-02")
		}

		passengerResponses = append(passengerResponses, dtos.PassengerResponse{
			ID:             passenger.ID.String(),
			FirstName:      passenger.FirstName,
			LastName:       passenger.LastName,
			Email:          passenger.Email.String,
			Phone:          passenger.Phone.String,
			DateOfBirth:    dobStr,
			PassportNumber: passenger.PassportNumber.String,
			SeatID:         seat.ID.String(),
			SeatNumber:     seat.SeatNumber,
		})
	}

	// commit
	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit transaction: %w", err)
	}

	// parse total for response
	totalFloat, _ := helpers.NumericToFloat64(booking.TotalAmount)

	// parse seat response
	// seatResponses := make([]dtos.SeatBookingResponse, 0, len(lockedSeats))
	var seatResponses []dtos.SeatBookingResponse

	for _, s := range lockedSeats {
		seatResponses = append(seatResponses, dtos.SeatBookingResponse{
			ID:         s.ID.String(),
			SeatNumber: s.SeatNumber,
		})
	}

	return &dtos.BookingResponse{
		ID:               booking.ID.String(),
		BookingReference: booking.BookingReference,
		Status:           booking.Status,
		TotalAmount:      totalFloat,
		PaymentStatus:    booking.PaymentStatus,
		FlightID:         flightID.String(),
		CabinClass:       cabinClass.ClassType,
		FlightType:       req.FlightType,
		Passengers:       passengerResponses,
		Seats:            seatResponses,
		CreatedAt:        booking.CreatedAt.Time,
	}, nil

}

// Bookings (User Scoped)
func (s *Service) GetUserBookings(ctx context.Context, userID string) ([]dtos.UserBooking, error) {
	userUUID := convert.StringToUUID(userID)

	rows, err := s.queries.GetUserBookings(ctx, userUUID)

	if err != nil {
		return nil, fmt.Errorf("get bookings: %w", err)
	}

	var bookings []dtos.UserBooking
	// bookings := make([]dtos.UserBooking, 0, len(rows))

	for _, r := range rows {
		total, _ := helpers.NumericToFloat64(r.TotalAmount)

		bookings = append(bookings, dtos.UserBooking{
			ID:               r.ID.String(),
			BookingReference: r.BookingReference,
			Status:           r.Status,
			TotalAmount:      total,
			PaymentStatus:    r.PaymentStatus,
			FlightID:         r.FlightID.String(),
			FlightType:       r.FlightType.String,
			FlightNumber:     r.FlightNumber.String,
			AirlineCode:      r.AirlineCode.String,
			AirlineName:      r.AirlineName.String,
			DepartureAirport: r.DepartureAirport.String,
			ArrivalAirport:   r.ArrivalAirport.String,
			DepartureTime:    r.DepartureTime.Time,
			ArrivalTime:      r.ArrivalTime.Time,
			CabinClass:       r.CabinClass,
			Duration:         r.Duration.String,
			CreatedAt:        r.CreatedAt.Time,
		})
	}

	return bookings, nil
}

// Booking (By ID)
func (s *Service) GetBooking(ctx context.Context, userID, bookingID string) (*dtos.BookingDetailResponse, error) {
	bookingUUID := convert.StringToUUID(bookingID)
	userUUID := convert.StringToUUID(userID)

	row, err := s.queries.GetBookingByID(ctx, bookingUUID)

	if err != nil {
		return nil, fmt.Errorf("booking not found: %w", err)
	}

	// verify ownership
	if row.UserID != userUUID {
		return nil, fmt.Errorf("unauthorized access")
	}

	// get passengers
	passengerRows, err := s.queries.GetBookingPassengers(ctx, bookingUUID)

	if err != nil {
		return nil, fmt.Errorf("get passengers: %w", err)
	}

	var passengers []dtos.BookingPassenger

	for _, r := range passengerRows {
		// parse date of birth
		dobStr := ""

		if r.DateOfBirth.Valid {
			dobStr = r.DateOfBirth.Time.Format("2006-01-02")
		}

		passengers = append(passengers, dtos.BookingPassenger{
			ID:             r.ID.String(),
			FirstName:      r.FirstName,
			LastName:       r.LastName,
			Email:          r.Email.String,
			Phone:          r.Phone.String,
			DateOfBirth:    dobStr,
			PassportNumber: r.PassportNumber.String,
			SeatID:         r.SeatID.String(),
			SeatNumber:     r.SeatNumber.String,
		})
	}

	total, _ := helpers.NumericToFloat64(row.TotalAmount)

	return &dtos.BookingDetailResponse{
		ID:               row.ID.String(),
		BookingReference: row.BookingReference,
		Status:           row.Status,
		TotalAmount:      total,
		PaymentStatus:    row.PaymentStatus,
		FlightID:         row.FlightID.String(),
		FlightType:       row.FlightType.String,
		FlightNumber:     row.FlightNumber.String,
		AirlineCode:      row.AirlineCode.String,
		AirlineName:      row.AirlineName.String,
		DepartureAirport: row.DepartureAirport.String,
		ArrivalAirport:   row.ArrivalAirport.String,
		DepartureTime:    row.DepartureTime.Time,
		ArrivalTime:      row.ArrivalTime.Time,
		Duration:         row.Duration.String,
		Passengers:       passengers,
		CreatedAt:        row.CreatedAt.Time,
	}, nil
}

// Cancel Booking
func (s *Service) CancelBooking(ctx context.Context, userID, bookingID string) error {
	userUUID := convert.StringToUUID(userID)
	bookingUUID := convert.StringToUUID(bookingID)

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	q := db.New(tx)

	rowsAffected, err := q.CancelBooking(ctx, db.CancelBookingParams{
		ID:     bookingUUID,
		UserID: userUUID,
	})
	if err != nil {
		return fmt.Errorf("cancel booking: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("booking not found, not owned by user, or not in pending status")
	}

	err = q.ReleaseSeats(ctx, bookingUUID)
	if err != nil {
		return fmt.Errorf("release seats: %w", err)
	}

	return tx.Commit(ctx)
}

func generateBookingReference() string {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

	b := make([]byte, 6)
	for o := range b {
		b[o] = chars[rand.Intn(len(chars))]
	}
	return "BK-" + string(b)
}
