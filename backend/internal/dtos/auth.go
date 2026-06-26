package dtos

import (
	"time"
)

type SignUpRequest struct {
	Email     string `json:"email" binding:"email,required"`
	Password  string `json:"password" binding:"required,min=6"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

type UserResponse struct {
	ID         string    `json:"id"`
	FirstName  string    `json:"first_name"`
	LastName   string    `json:"last_name"`
	Email      string    `json:"email"`
	CreatedAt  time.Time `json:"created_at"`
	Updated_At time.Time `json:"updated_at"`
}

// type AuthResponse struct {
// 	User         UserResponse `json:"user"`
// 	AccessToken  string       `json:"access_token"`
// 	RefreshToken string       `json:"refresh_token"`
// }
