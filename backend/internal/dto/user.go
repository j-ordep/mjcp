package dto

import (
	"time"

	"github.com/j-ordep/mjcp/backend/internal/domain/entities"
)

type CreateUserInput struct {
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Phone     string    `json:"phone"`
	Status    bool      `json:"status"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type UserOutput struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Phone     string    `json:"phone"`
	Status    bool      `json:"status"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func ToUserDomain(input CreateUserInput) *entities.User{
	return nil
}

func FromUserDomain() UserOutput {
	return UserOutput{}
}
