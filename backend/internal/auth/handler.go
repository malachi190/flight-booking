package auth

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"

	// "github.com/google/uuid"
	"github.com/emicklei/pgtalk/convert"
	"github.com/malachi190/flights/internal/db"
	"github.com/malachi190/flights/internal/dtos"
	"github.com/malachi190/flights/internal/helpers"
	"github.com/malachi190/flights/internal/logger"
)

type AuthHandler struct {
	queries *db.Queries
	jwt     *JwtService
}

func NewAuthHandler(queries *db.Queries, jwt *JwtService) *AuthHandler {
	return &AuthHandler{
		queries: queries,
		jwt:     jwt,
	}
}

func (h *AuthHandler) SignUp(ctx *gin.Context) {
	var req dtos.SignUpRequest

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusUnprocessableEntity, gin.H{
			"status":  false,
			"message": err.Error(),
		})
		return
	}

	hash, err := helpers.HashPassword(req.Password)

	if err != nil {
		logger.Log.Error().Err(err).Msg("password hashing failed")
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"status":  false,
			"message": "Something went wrong",
		})
		return
	}

	user, err := h.queries.CreateUser(ctx, db.CreateUserParams{
		Email:        req.Email,
		PasswordHash: hash,
		FirstName:    pgtype.Text{String: req.FirstName, Valid: req.FirstName != ""},
		LastName:     pgtype.Text{String: req.LastName, Valid: req.LastName != ""},
	})

	if err != nil {
		logger.Log.Error().Err(err).Msg("signup failed")
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"status":  false,
			"message": "Something went wrong",
		})
		return
	}

	// generate tokens
	tokens, err := h.jwt.GenerateTokenPair(user.ID.String(), user.Email)

	if err != nil {
		logger.Log.Error().Err(err).Msg("failed to generate tokens")
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"status":  false,
			"message": "Something went wrong",
		})
		return
	}

	// store refresh tokens
	tokenHash := helpers.HashRefreshToken(tokens.RefreshToken)
	expiresAt := time.Now().Add(h.jwt.cfg.JWTRefreshExpiry)
	err = h.queries.UpdateUserRefreshToken(ctx, db.UpdateUserRefreshTokenParams{
		ID:                    user.ID,
		RefreshToken:          pgtype.Text{String: tokenHash, Valid: true},
		RefreshTokenExpiresAt: pgtype.Timestamptz{Time: expiresAt, Valid: true},
	})

	if err != nil {
		logger.Log.Error().Err(err).Msg("failed to store refresh token")
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"status":  false,
			"message": "Something went wrong",
		})
		return
	}

	ctx.JSON(http.StatusCreated, dtos.ApiResponse{
		Status:  true,
		Message: "Account created successfully",
		Data: map[string]any{
			"access_token":  tokens.AccessToken,
			"refresh_token": tokens.RefreshToken,
			"user": map[string]string{
				"id":         user.ID.String(),
				"email":      user.Email,
				"first_name": user.FirstName.String,
				"last_name":  user.LastName.String,
				"created_at": user.CreatedAt.Time.String(),
				"updated_at": user.UpdatedAt.Time.String(),
			},
		},
	})
}

func (h *AuthHandler) Login(ctx *gin.Context) {
	var req dtos.LoginRequest

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusUnprocessableEntity, gin.H{
			"status":  false,
			"message": err.Error(),
		})
		return
	}

	user, err := h.queries.GetUserByEmail(ctx, req.Email)

	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{
			"status":  false,
			"message": "invalid credentials",
		})
		return
	}

	if !helpers.CheckPassword(req.Password, user.PasswordHash) {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"status":  false,
			"message": "invalid credentials",
		})
		return
	}

	tokens, err := h.jwt.GenerateTokenPair(user.ID.String(), user.Email)

	if err != nil {
		logger.Log.Error().Err(err).Msg("failed to create tokens")
		ctx.JSON(http.StatusInternalServerError, dtos.ApiResponse{
			Status:  false,
			Message: "Something went wrong",
		})
		return
	}

	// store refresh token
	tokenHash := helpers.HashRefreshToken(tokens.RefreshToken)
	expiresAt := time.Now().Add(h.jwt.cfg.JWTRefreshExpiry)
	err = h.queries.UpdateUserRefreshToken(ctx, db.UpdateUserRefreshTokenParams{
		ID:                    user.ID,
		RefreshToken:          pgtype.Text{String: tokenHash, Valid: true},
		RefreshTokenExpiresAt: pgtype.Timestamptz{Time: expiresAt, Valid: true},
	})

	if err != nil {
		logger.Log.Error().Err(err).Msg("failed to store refresh token")
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"status":  false,
			"message": "Something went wrong",
		})
		return
	}

	ctx.JSON(http.StatusCreated, dtos.ApiResponse{
		Status:  true,
		Message: "Login successful",
		Data: map[string]any{
			"access_token":  tokens.AccessToken,
			"refresh_token": tokens.RefreshToken,
			"user": map[string]string{
				"id":         user.ID.String(),
				"email":      user.Email,
				"first_name": user.FirstName.String,
				"last_name":  user.LastName.String,
				"created_at": user.CreatedAt.Time.String(),
				"updated_at": user.UpdatedAt.Time.String(),
			},
		},
	})
}

func (h *AuthHandler) Refresh(ctx *gin.Context) {
	var req dtos.RefreshRequest

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusUnprocessableEntity, dtos.ApiResponse{
			Status:  false,
			Message: err.Error(),
		})
		return
	}

	userID, err := h.jwt.ValidateRefreshToken(req.RefreshToken)

	if err != nil {
		ctx.JSON(http.StatusUnauthorized, dtos.ApiResponse{
			Status:  false,
			Message: "invalid refresh token",
		})
		return
	}

	id := convert.StringToUUID(userID)

	if !id.Valid {
		ctx.JSON(http.StatusUnauthorized, dtos.ApiResponse{
			Status:  false,
			Message: "invalid user ID in token",
		})
		return
	}

	// get user by ID
	user, err := h.queries.GetUserByID(ctx, id)

	if err != nil {
		ctx.JSON(http.StatusUnauthorized, dtos.ApiResponse{
			Status:  false,
			Message: "user not found",
		})
		return
	}

	// compare incoming hash with current hashed
	hashedIncoming := helpers.HashRefreshToken(req.RefreshToken)

	if !user.RefreshToken.Valid || user.RefreshToken.String != hashedIncoming {
		logger.Log.Warn().Str("user_id", userID).Msg("refresh token revoked")
		ctx.JSON(http.StatusUnauthorized, dtos.ApiResponse{
			Status:  false,
			Message: "token revoked",
		})
		return
	}

	// generate tokens
	tokens, err := h.jwt.GenerateTokenPair(user.ID.String(), user.Email)

	if err != nil {
		logger.Log.Error().Err(err).Msg("failed to create tokens")
		ctx.JSON(http.StatusInternalServerError, dtos.ApiResponse{
			Status:  false,
			Message: "Something went wrong",
		})
		return
	}

	tokenHash := helpers.HashRefreshToken(tokens.RefreshToken)
	expiresAt := time.Now().Add(h.jwt.cfg.JWTRefreshExpiry)
	err = h.queries.UpdateUserRefreshToken(ctx, db.UpdateUserRefreshTokenParams{
		ID:                    user.ID,
		RefreshToken:          pgtype.Text{String: tokenHash, Valid: true},
		RefreshTokenExpiresAt: pgtype.Timestamptz{Time: expiresAt, Valid: true},
	})

	if err != nil {
		logger.Log.Error().Err(err).Msg("failed to store refresh token")
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"status":  false,
			"message": "Something went wrong",
		})
		return
	}

	ctx.JSON(http.StatusOK, dtos.ApiResponse{
		Status:  true,
		Message: "request successful",
		Data: map[string]string{
			"access_token":  tokens.AccessToken,
			"refresh_token": tokens.RefreshToken,
		},
	})
}

func (h *AuthHandler) Logout(ctx *gin.Context) {
	userID, exists := ctx.Get("userID")

	if !exists {
		ctx.JSON(http.StatusUnauthorized, dtos.ApiResponse{
			Status:  false,
			Message: "unauthenticated",
		})
		return
	}

	id := convert.StringToUUID(userID.(string))

	if !id.Valid {
		ctx.JSON(http.StatusBadRequest, dtos.ApiResponse{
			Status:  false,
			Message: "invalid user id",
		})
		return
	}

	h.queries.ClearUserRefreshToken(ctx, id)
	ctx.JSON(http.StatusOK, dtos.ApiResponse{
		Status:  true,
		Message: "logged out",
	})
}
