package entities

import "time"

// Volunteer representa um voluntário da igreja
type Volunteer struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Phone     string    `json:"phone"`
	Active    bool      `json:"active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Ministry representa um ministério da igreja
type Ministry struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Active      bool      `json:"active"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Schedule representa uma escala para um evento
type Schedule struct {
	ID        string    `json:"id"`
	EventID   string    `json:"event_id"`
	Date      time.Time `json:"date"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Event representa um evento da igreja
type Event struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	EventType   string    `json:"event_type"` // culto, ensaio, reunião, etc.
	StartTime   time.Time `json:"start_time"`
	EndTime     time.Time `json:"end_time"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Availability representa a disponibilidade de um voluntário
type Availability struct {
	ID          string    `json:"id"`
	VolunteerID string    `json:"volunteer_id"`
	Date        time.Time `json:"date"`
	Available   bool      `json:"available"`
	Notes       string    `json:"notes"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
