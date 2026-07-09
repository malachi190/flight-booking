package flights

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/malachi190/flights/internal/auth"
	"github.com/malachi190/flights/internal/dtos"
	"github.com/malachi190/flights/internal/logger"
)

type FlightHandler struct {
	service *Service
}

func NewFlightHandler(service *Service) *FlightHandler {
	return &FlightHandler{service: service}
}

func (h *FlightHandler) RegisterRoutes(r *gin.RouterGroup, auth *auth.AuthHandler) {
	r.GET("/search", h.Search)
	// protected routes
	api := r.Use(auth.AuthMiddleware())
	api.GET("/:id/seats", h.GetSeatMap)
	api.GET("/:id", h.Flight)
}

func (h *FlightHandler) Search(ctx *gin.Context) {
	origin := ctx.Query("origin")
	destination := ctx.Query("destination")
	date := ctx.Query("date")
	class := ctx.Query("class")
	adultsStr := ctx.DefaultQuery("adults", "1")

	// validation
	if origin == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "missing required parameter: origin"})
		return
	}
	if destination == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "missing required parameter: destination"})
		return
	}
	if date == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "missing required parameter: date"})
		return
	}
	if len(origin) != 3 || len(destination) != 3 {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "airport codes must be 3 characters"})
		return
	}
	if _, err := time.Parse("2006-01-02", date); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid date format, expected YYYY-MM-DD"})
		return
	}
	if class != "" && class != "economy" && class != "business" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "class must be economy or business"})
		return
	}

	adults, err := strconv.Atoi(adultsStr)
	if err != nil || adults < 1 {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid adults parameter"})
		return
	}

	flight := &FlightData{
		Origin:      origin,
		Destination: destination,
		Date:        date,
		Class:       class,
		Adults:      adults,
	}

	result, err := h.service.Search(ctx.Request.Context(), flight)

	if err != nil {
		logger.Log.Error().Err(err).Msg("failed to search flights")
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to search flights",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"status":  true,
		"flights": result,
	})
}

func (h *FlightHandler) GetSeatMap(ctx *gin.Context) {
	flightID := ctx.Param("id")

	seatMap, err := h.service.GetSeatsMap(ctx, flightID)

	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{
			"status":  false,
			"message": "flight not found",
		})
		return
	}

	ctx.JSON(http.StatusOK, dtos.ApiResponse{
		Status:  true,
		Message: "seats fetched successfully",
		Data:    seatMap,
	})
}

func (h *FlightHandler) Flight(ctx *gin.Context) {
	flightID := ctx.Param("id")

	flight, err := h.service.GetFlightByID(ctx.Request.Context(), flightID)

	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"status":  false,
			"message": "An error occured",
			"context": err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, flight)
}
