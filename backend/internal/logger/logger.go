package logger

import (
	"io"
	"os"
	"time"

	"github.com/rs/zerolog"
	"gopkg.in/natefinch/lumberjack.v2"
)

var Log zerolog.Logger

func Init(env string) {
	var output io.Writer

	if env == "development" {
		// pretty console output for dev
		output = zerolog.ConsoleWriter{
			Out:        os.Stdout,
			TimeFormat: time.RFC3339,
			NoColor:    false,
		}
	} else {
		// JSON to stdout + rotating file for prod
		fileWriter := &lumberjack.Logger{
			Filename:   "logs/app.log",
			MaxSize:    10, // MB
			MaxBackups: 5,
			MaxAge:     30, // days
			Compress:   true,
		}

		output = io.MultiWriter(os.Stdout, fileWriter)
	}

	Log = zerolog.New(output).With().Timestamp().Caller().Logger()

	zerolog.SetGlobalLevel(zerolog.InfoLevel)

	if env == "development" {
		zerolog.SetGlobalLevel(zerolog.DebugLevel)
	}
}
