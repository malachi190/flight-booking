package main

import (
	"context"
	"fmt"
	"math/rand"
	"os"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/malachi190/flights/internal/config"
	"github.com/rs/zerolog"
)

var (
	routes = []struct {
		Origin      string
		Destination string
		Duration    string
		BasePrice   float64
	}{
		{"JFK", "LAX", "5h 30m", 250.00},
		{"LAX", "JFK", "5h 00m", 280.00},
		{"LHR", "CDG", "1h 20m", 80.00},
		{"CDG", "LHR", "1h 15m", 75.00},
		{"DXB", "SIN", "7h 10m", 320.00},
		{"SIN", "DXB", "7h 00m", 310.00},
		{"HND", "SIN", "7h 00m", 290.00},
		{"SIN", "HND", "6h 50m", 285.00},
		{"FRA", "JFK", "8h 30m", 450.00},
		{"JFK", "FRA", "8h 10m", 440.00},
	}

	airlines = []struct {
		Code string
		Name string
	}{
		{"AA", "American Airlines"},
		{"BA", "British Airways"},
		{"EK", "Emirates"},
		{"SQ", "Singapore Airlines"},
		{"LH", "Lufthansa"},
		{"AF", "Air France"},
		{"JL", "Japan Airlines"},
		{"DL", "Delta Air Lines"},
		{"UA", "United Airlines"},
		{"VS", "Virgin Atlantic"},
	}
)

func main() {
	cfg := config.Load()

	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	logger := zerolog.New(os.Stdout).With().Timestamp().Logger()

	ctx := context.Background()

	// connect db
	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)

	if err != nil {
		logger.Fatal().Err(err).Msg("failed to connect to db")
	}
	defer pool.Close()

	// ping database
	if err := pool.Ping(ctx); err != nil {
		logger.Fatal().Err(err).Msg("failed to ping db")
	}

	var existingCount int

	if err := pool.QueryRow(ctx, "SELECT COUNT(*) FROM flights").Scan(&existingCount); err != nil {
		logger.Fatal().Err(err).Msg("failed to check existing flights")
	}

	if existingCount > 0 {
		logger.Info().Int("count", existingCount).Msg("flights already seeded, skipping")
		return
	}

	// Begin transaction
	tx, err := pool.Begin(ctx)

	if err != nil {
		logger.Fatal().Err(err).Msg("failed to begin transaction")
	}

	defer tx.Rollback(ctx)

	logger.Info().Msg("starting seed...")

	if err := runSeed(ctx, tx, logger); err != nil {
		logger.Fatal().Err(err).Msg("seed failed, rolling back")
	}

	if err := tx.Commit(ctx); err != nil {
		logger.Fatal().Err(err).Msg("failed to commit transaction")
	}

	// Add other seeders

	logger.Info().Msg("seed committed succssfully")
}

func runSeed(ctx context.Context, tx pgx.Tx, logger zerolog.Logger) error {

	now := time.Now()
	rng := rand.New(rand.NewSource(now.UnixNano()))

	const totalFlights = 50
	flightsPerRoute := totalFlights / len(routes)

	flightCount := 0

	for _, route := range routes {
		for i := 0; i < flightsPerRoute; i++ {
			// Seed flight
			if flightCount >= totalFlights {
				break
			}

			daysOffset := rng.Intn(30)
			hour := 6 + rng.Intn(18)
			minute := rng.Intn(60)
			departure := now.AddDate(0, 0, daysOffset).Add(time.Duration(hour)*time.Hour + time.Duration(minute)*time.Minute)

			durationMin := parseDurationMinutes(route.Duration)
			durationVariation := rng.Intn(40) - 20

			if durationMin+durationVariation < 30 {
				durationVariation = 30 - durationMin
			}

			actualDuration := durationMin + durationVariation
			arrival := departure.Add(time.Duration(actualDuration) * time.Minute)

			durationStr := fmt.Sprintf("%dh %dm", actualDuration/60, actualDuration%60)

			priceVariation := 0.8 + (rng.Float64() * 0.4)
			basePrice := route.BasePrice * priceVariation

			airline := airlines[rng.Intn(len(airlines))]
			flightNum := fmt.Sprintf("%s%d", airline.Code, 100+rng.Intn(8999))

			var flightID string
			err := tx.QueryRow(ctx, `
				INSERT INTO flights (
					flight_number, airline_code, airline_name,
					departure_airport, arrival_airport, departure_time, arrival_time, duration, base_price, status, created_at, updated_at
				)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
				RETURNING id
			`, flightNum, airline.Code, airline.Name, route.Origin, route.Destination, departure, arrival, durationStr, basePrice, "scheduled", now, now).Scan(&flightID)

			if err != nil {
				logger.Fatal().Err(err).Str("flight", flightNum).Msg("failed to insert flight")
			}

			// Seed cabin class
			cabinConfigs := []struct {
				ClassType  string
				Multiplier float64
				TotalSeats int
			}{
				{"economy", 1.0, 60},
				{"business", 2.5, 20},
			}

			startingRow := 1

			for _, cc := range cabinConfigs {
				price := basePrice * cc.Multiplier

				var cabinID string

				err := tx.QueryRow(ctx, `
					INSERT INTO cabin_classes (flight_id, class_type, price, total_seats, created_at)
					VALUES ($1, $2, $3, $4, $5)
					RETURNING id
				`, flightID, cc.ClassType, price, cc.TotalSeats, now).Scan(&cabinID)

				if err != nil {
					logger.Fatal().Err(err).Str("cabin", cc.ClassType).Msg("failed to insert cabin class")
				}

				seatLetters := []string{"A", "B", "C", "D", "E", "F"}

				if cc.ClassType == "business" {
					seatLetters = []string{"A", "B", "D", "E", "F"}
				}

				rows := cc.TotalSeats / len(seatLetters)

				if cc.TotalSeats%len(seatLetters) != 0 {
					rows++
				}

				seatNum := 1

				for r := 1; r < rows && seatNum <= cc.TotalSeats; r++ {
					for _, letter := range seatLetters {
						if seatNum > cc.TotalSeats {
							break
						}

						seatNumber := fmt.Sprintf("%d%s", startingRow+r, letter)

						_, err := tx.Exec(ctx, `
							INSERT INTO seats (flight_id, cabin_class_id, seat_number, status, created_at)
							VALUES ($1, $2, $3, $4, $5)
						`, flightID, cabinID, seatNumber, "available", now)

						if err != nil {
							logger.Fatal().Err(err).Str("seat", seatNumber).Msg("failed to inseart seat")
						}
						seatNum++
					}
				}

				startingRow += rows
			}
			logger.Info().Str("flight_id", flightID).Str("flight", flightNum).Str("route", fmt.Sprintf("%s-%s", route.Origin, route.Destination)).Time("departure", departure).Msg("inserted flight")

			flightCount++
			startingRow = 1 // reset
		}
	}

	logger.Info().Int("count", flightCount).Msg("seed complete")
	return nil
}

func parseDurationMinutes(d string) int {
	var h, m int
	fmt.Sscanf(d, "%dh %dm", &h, &m)
	return h*60 + m
}
