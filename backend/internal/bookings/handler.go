package bookings

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/malachi190/flights/internal/auth"
	"github.com/malachi190/flights/internal/dtos"
	"github.com/malachi190/flights/internal/logger"
)

type Handler struct {
	service *Service
}

func NewBookingHandler(svc *Service) *Handler {
	return &Handler{service: svc}
}

func (h *Handler) RegisterRoutes(r *gin.RouterGroup, auth *auth.AuthHandler) {
	api := r.Use(auth.AuthMiddleware())
	api.POST("", h.Create)
	api.GET("/list", h.List)
	api.GET("/:id", h.Booking)
	api.POST("/:id/cancel", h.Cancel)
}

func (h *Handler) Create(ctx *gin.Context) {
	var req dtos.CreateBookingRequest

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusUnprocessableEntity, dtos.ApiResponse{
			Status:  false,
			Message: err.Error(),
		})
		return
	}

	// get user ID from auth context
	userID, exists := ctx.Get("userID")

	if !exists {
		ctx.JSON(http.StatusUnauthorized, dtos.ApiResponse{
			Status:  false,
			Message: "unauthenticated",
		})
		return
	}

	booking, err := h.service.Create(ctx, userID.(string), &req)

	if err != nil {
		logger.Log.Error().Err(err).Msg("create booking error")
		ctx.JSON(http.StatusInternalServerError, dtos.ApiResponse{
			Status:  false,
			Message: "Something went wrong, please try again",
		})
		return
	}

	ctx.JSON(http.StatusCreated, dtos.ApiResponse{
		Status:  true,
		Message: "booking created successfully",
		Data:    booking,
	})
}

func (h *Handler) List(ctx *gin.Context) {
	userID, exists := ctx.Get("userID")

	if !exists {
		ctx.JSON(http.StatusUnauthorized, dtos.ApiResponse{
			Status:  false,
			Message: "Unauthorized",
		})
		return
	}

	bookings, err := h.service.GetUserBookings(ctx.Request.Context(), userID.(string))

	if err != nil {
		logger.Log.Error().Err(err).Msg("fetch booking error")

		ctx.JSON(http.StatusInternalServerError, dtos.ApiResponse{
			Status:  false,
			Message: "Something went wrong, please try again",
		})
		return
	}

	ctx.JSON(http.StatusOK, dtos.ApiResponse{
		Status:  true,
		Message: "Bookings fetched successfully",
		Data:    bookings,
	})
}

func (h *Handler) Booking(ctx *gin.Context) {
	userID, exists := ctx.Get("userID")

	if !exists {
		ctx.JSON(http.StatusUnauthorized, dtos.ApiResponse{
			Status:  false,
			Message: "Unauthorized",
		})
		return
	}

	bookingID := ctx.Param("id")

	booking, err := h.service.GetBooking(ctx.Request.Context(), userID.(string), bookingID)

	if err != nil {
		logger.Log.Error().Err(err).Msg("fetch booking error")

		ctx.JSON(http.StatusInternalServerError, dtos.ApiResponse{
			Status:  false,
			Message: "Something went wrong, please try again",
		})
		return
	}

	ctx.JSON(http.StatusOK, dtos.ApiResponse{
		Status:  true,
		Message: "Booking fetched successfully",
		Data:    booking,
	})
}

func (h *Handler) Cancel(ctx *gin.Context) {
	userID, exists := ctx.Get("userID")

	if !exists {
		ctx.JSON(http.StatusUnauthorized, dtos.ApiResponse{
			Status:  false,
			Message: "Unauthorized",
		})
		return
	}

	bookingID := ctx.Param("id")

	if err := h.service.CancelBooking(ctx, userID.(string), bookingID); err != nil {
		logger.Log.Error().Err(err).Msg("fetch booking error")

		ctx.JSON(http.StatusInternalServerError, dtos.ApiResponse{
			Status:  false,
			Message: "Something went wrong, please try again",
		})
		return
	}

	ctx.JSON(http.StatusOK, dtos.ApiResponse{
		Status:  true,
		Message: "booking cancelled successfully",
	})
}
