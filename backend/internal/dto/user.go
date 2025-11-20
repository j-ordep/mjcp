package dto

import (
	"time"

	"github.com/j-ordep/mjcp/backend/internal/domain/entity"
)

type LoginUserInput struct {
	Email    string `json:"email"`
	Password string `json:"password" binding:"required"`
}

type LoginUserOutput struct {
	User  UserOutput `json:"user"`
	Token string     `json:"token"`
}

type CreateUserInput struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password" binding:"required,min=6"`
	Phone    string `json:"phone"`
}

type UserOutput struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Phone     string    `json:"phone"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func ToUserDomain(input CreateUserInput) (*entity.User, error) {
	user, err := entity.NewUser(input.Name, input.Email, input.Password, input.Phone)
	if err != nil {
		return nil, err
	}

	return user, nil
}

func FromUserDomain(user *entity.User) UserOutput {
	return UserOutput{
		ID:        user.ID,
		Name:      user.Name,
		Email:     user.Email,
		Phone:     user.Phone,
		CreatedAt: user.CreatedAt,
		UpdatedAt: user.UpdatedAt,
	}
}
