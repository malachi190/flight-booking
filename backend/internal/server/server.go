package server

import (
	"context"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/malachi190/flights/internal/auth"
	"github.com/malachi190/flights/internal/bookings"
	"github.com/malachi190/flights/internal/cache"
	"github.com/malachi190/flights/internal/config"
	"github.com/malachi190/flights/internal/db"
	"github.com/malachi190/flights/internal/flights"
	"github.com/malachi190/flights/internal/logger"
)

type Server struct {
	Router *gin.Engine
	Config *config.Config
	DB     *pgxpool.Pool
}

func New(cfg *config.Config, pool *pgxpool.Pool, cache *cache.Client) *Server {
	if cfg.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(gin.Logger())

	// CORS — restrict this in production
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", cfg.FrontendURL)
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	queries := db.New(pool)
	jwtService := auth.NewJwtService(cfg)

	// Health check
	r.GET("/health", func(ctx *gin.Context) {
		ctx.JSON(http.StatusOK, gin.H{"status": "ok", "env": cfg.Env})
	})

	// Auth
	api := r.Group("/api")
	authHandler := auth.NewAuthHandler(queries, jwtService)
	{
		authHandler.RegisterRoutes(api.Group("/auth"))
	}

	// Flights
	flightService := flights.NewService(queries, cache)
	flightHandler := flights.NewFlightHandler(flightService)
	{
		flightHandler.RegisterRoutes(api.Group("/flights"), authHandler)
	}

	// Bookings
	bookingService := bookings.NewBookingService(pool, queries)
	bookingHandler := bookings.NewBookingHandler(bookingService)

	{
		bookingHandler.RegisterRoutes(api.Group("/bookings"), authHandler)
	}

	return &Server{
		Router: r,
		Config: cfg,
		DB:     pool,
	}
}

func (s *Server) Run() error {
	addr := ":" + s.Config.Port
	logger.Log.Info().Str("addr", addr).Str("mode", s.Config.Env).Msg("server starting")
	return s.Router.Run(addr)
}

func (s *Server) Shutdown(ctx context.Context) error {
	// We'll add graceful shutdown logic here later (DB, Redis, RabbitMQ cleanup)
	log.Println("Server shutting down gracefully...")
	return nil
}
