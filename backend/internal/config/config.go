package config

import (
	"fmt"
	"strings"
	"time"

	"github.com/joho/godotenv"
	"github.com/knadh/koanf/providers/env"
	"github.com/knadh/koanf/providers/structs"
	"github.com/knadh/koanf/v2"
)

type Config struct {
	Port                string        `koanf:"port"`
	Env                 string        `koanf:"env"`
	DatabaseURL         string        `koanf:"database_url"`
	RedisURL            string        `koanf:"redis_url"`
	RedisPassword       string        `koanf:"redis_password"`
	RabbitMQURL         string        `koanf:"rabbitmq_url"`
	JWTSecret           string        `koanf:"jwt_secret"`
	JWTRefreshSecret    string        `koanf:"jwt_refresh_secret"`
	JWTAccessExpiry     time.Duration `koanf:"jwt_access_expiry"`
	JWTRefreshExpiry    time.Duration `koanf:"jwt_refresh_expiry"`
	StripeSecretKey     string        `koanf:"stripe_secret_key"`
	StripeWebhookSecret string        `koanf:"stripe_webhook_secret"`
	AmadeusAPIKey       string        `koanf:"amadeus_api_key"`
	AmadeusAPISecret    string        `koanf:"amadeus_api_secret"`
	FrontendURL         string        `koanf:"frontend_url"`
}

func Load() *Config {
	_ = godotenv.Load()

	k := koanf.New(".")

	// 1. Defaults
	defaults := Config{
		Port:             "8080",
		Env:              "development",
		RedisURL:         "redis:6379",
		RedisPassword:    "",
		JWTAccessExpiry:  15 * time.Minute,
		JWTRefreshExpiry: 7 * 24 * time.Hour, // 168h
		FrontendURL:      "http://localhost:3000",
	}
	_ = k.Load(structs.Provider(defaults, "koanf"), nil)

	// 2. Environment variables
	_ = k.Load(env.Provider("", ".", func(s string) string {
		return strings.ToLower(s)
	}), nil)

	// 3. Unmarshal
	var cfg Config
	if err := k.Unmarshal("", &cfg); err != nil {
		panic(fmt.Sprintf("failed to unmarshal config: %v", err))
	}

	// 4. Parse duration overrides manually with clear error messages
	if raw := k.String("jwt_access_expiry"); raw != "" {
		d, err := time.ParseDuration(raw)
		if err != nil {
			panic(fmt.Sprintf("invalid JWT_ACCESS_EXPIRY %q: %v. Use Go duration format like 15m, 1h, 168h", raw, err))
		}
		cfg.JWTAccessExpiry = d
	}

	if raw := k.String("jwt_refresh_expiry"); raw != "" {
		d, err := time.ParseDuration(raw)
		if err != nil {
			panic(fmt.Sprintf("invalid JWT_REFRESH_EXPIRY %q: %v. Use Go duration format like 15m, 1h, 168h", raw, err))
		}
		cfg.JWTRefreshExpiry = d
	}

	// 5. Validate required fields
	required := map[string]string{
		"database_url":       cfg.DatabaseURL,
		"rabbitmq_url":       cfg.RabbitMQURL,
		"jwt_secret":         cfg.JWTSecret,
		"jwt_refresh_secret": cfg.JWTRefreshSecret,
	}
	for name, value := range required {
		if value == "" {
			panic(fmt.Sprintf("required configuration %s is not set", name))
		}
	}

	return &cfg
}
