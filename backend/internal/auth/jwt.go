package auth

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/malachi190/flights/internal/config"
)

type TokenPair struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}

type JwtClaims struct {
	UserID string `json:"user_id"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}

type JwtService struct {
	cfg *config.Config
}

func NewJwtService(cfg *config.Config) *JwtService {
	return &JwtService{cfg: cfg}
}

// Generates new JWT pair
func (s *JwtService) GenerateTokenPair(userID, email string) (*TokenPair, error) {
	now := time.Now()

	// access token
	accessClaims := JwtClaims{
		UserID: userID,
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(now.Add(s.cfg.JWTAccessExpiry)),
			IssuedAt:  jwt.NewNumericDate(now),
			Subject:   userID,
		},
	}

	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	accessSigned, err := accessToken.SignedString([]byte(s.cfg.JWTSecret))

	if err != nil {
		return nil, fmt.Errorf("failed to sign access token: %w", err)
	}

	// refresh token
	refreshClaims := JwtClaims{
		UserID: userID,
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(now.Add(s.cfg.JWTRefreshExpiry)),
			IssuedAt:  jwt.NewNumericDate(now),
			Subject:   userID,
		},
	}

	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshSigned, err := refreshToken.SignedString([]byte(s.cfg.JWTRefreshSecret))

	if err != nil {
		return nil, fmt.Errorf("failed to sign refresh token: %w", err)
	}

	return &TokenPair{
		AccessToken:  accessSigned,
		RefreshToken: refreshSigned,
	}, nil
}

// Validates access token
func (s *JwtService) ValidateAccessToken(tokenStr string) (*JwtClaims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &JwtClaims{}, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return []byte(s.cfg.JWTSecret), nil
	})

	if err != nil {
		return nil, fmt.Errorf("parse token: %w", err)
	}

	if claims, ok := token.Claims.(*JwtClaims); ok && token.Valid {
		return claims, nil
	}
	return nil, fmt.Errorf("invalid token claims")
}

// Validate refresh token
func (s *JwtService) ValidateRefreshToken(tokenStr string) (string, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &JwtClaims{}, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return []byte(s.cfg.JWTRefreshSecret), nil
	})

	if err != nil {
		return "", fmt.Errorf("parse refresh token: %w", err)
	}

	if claims, ok := token.Claims.(*JwtClaims); ok && token.Valid {
		return claims.Subject, nil
	}
	return "", fmt.Errorf("invalid refresh token claims")
}
