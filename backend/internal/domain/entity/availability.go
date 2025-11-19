package entity

import (
	"time"

	"github.com/google/uuid"
)

// Availability representa a disponibilidade de um voluntário
type Availability struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	Date      time.Time `json:"date"`      // disponibilidade por dia, tavez seria melhor => start_time - end_time
	Status    bool      `json:"available"` // disponivel?
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func NewAvailability(userID string, date time.Time, status bool) *Availability {
	return &Availability{
		ID:        uuid.New().String(),
		UserID:    userID,
		Date:      date,
		Status:    status,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
}

func (a *Availability) UpdateStatus(status bool) {
	a.Status = status
	a.UpdatedAt = time.Now()
}
