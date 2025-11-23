package entity

import (
	"time"

	"github.com/google/uuid"
)

type PasswordResetToken struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	Token     string    `json:"token"`
	ExpiresAt time.Time `json:"expires_at"`
	Used      bool      `json:"used"`
	CreatedAt time.Time `json:"created_at"`
}

func NewPasswordResetToken(userID string, token string, expiresIn time.Duration) *PasswordResetToken {
	return &PasswordResetToken{
		ID:        uuid.New().String(),
		UserID:    userID,
		Token:     token,
		ExpiresAt: time.Now().Add(expiresIn),
		Used:      false,
		CreatedAt: time.Now(),
	}
}

func (p *PasswordResetToken) IsExpired() bool {
	return time.Now().After(p.ExpiresAt)
}

func (p *PasswordResetToken) IsValid() bool {
	return !p.Used && !p.IsExpired()
}
