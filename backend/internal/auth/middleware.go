package auth

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/malachi190/flights/internal/dtos"
)

func (h *AuthHandler) AuthMiddleware() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		header := ctx.GetHeader("Authorization")
		if header == "" {
			ctx.AbortWithStatusJSON(http.StatusUnauthorized, dtos.ApiResponse{
				Status:  false,
				Message: "authorization header required",
			})
			return
		}

		parts := strings.SplitN(header, " ", 2)

		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			ctx.AbortWithStatusJSON(http.StatusUnauthorized, dtos.ApiResponse{
				Status:  false,
				Message: "invalid authorization header format",
			})
			return
		}

		claims, err := h.jwt.ValidateAccessToken(parts[1])

		if err != nil {
			ctx.AbortWithStatusJSON(http.StatusUnauthorized, dtos.ApiResponse{
				Status:  false,
				Message: "invalid or expired token",
			})
			return
		}

		// set userID in context
		ctx.Set("userID", claims.UserID)
		ctx.Set("email", claims.Email)
		ctx.Next()
	}
}
