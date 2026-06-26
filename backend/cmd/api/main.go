package main

import (
	"context"
	"os"
	"os/signal"
	"syscall"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/malachi190/flights/internal/config"
	"github.com/malachi190/flights/internal/logger"
	"github.com/malachi190/flights/internal/server"
)

func main() {
	cfg := config.Load()

	// Initialize logs
	logger.Init(cfg.Env)
	logger.Log.Info().Str("env", cfg.Env).Msg("starting server...")

	// Initialize DB
	ctx := context.Background()
	db, err := pgxpool.New(ctx, cfg.DatabaseURL)

	if err != nil {
		logger.Log.Fatal().Err(err).Msg("failed to connect to database")
	}

	defer db.Close()

	// Ping
	if err := db.Ping(ctx); err != nil {
		logger.Log.Fatal().Err(err).Msg("failed to ping database")
	}

	logger.Log.Info().Msg("Database connected")

	srv := server.New(cfg, db)

	// Graceful shutdown handling
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		if err := srv.Run(); err != nil {
			logger.Log.Fatal().Err(err).Msg("server error")
		}
	}()

	<-quit
	logger.Log.Info().Msg("shutting down server...")

	if err := srv.Shutdown(context.Background()); err != nil {
		logger.Log.Fatal().Err(err).Msg("server forced to shutdown")
	}

	logger.Log.Info().Msg("server exited")
}
