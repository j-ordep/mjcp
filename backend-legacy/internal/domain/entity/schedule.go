package entity

import "time"

// Schedule representa uma escala para um evento
type Schedule struct { // melhorar esse nome
	ID          string    `json:"id"`
	MinistryID  string    `json:"ministry_id"`
	Description string    `json:"description"` // opcional, talvez description = Ministry.Name
	StartTime   time.Time `json:"start_time"`
	EndTime     time.Time `json:"end_time"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type ScheduleSlot struct {
	ID           string `json:"id"`
	ScheduleID   string `json:"schedule_id"`
	LayoutSlotID string `json:"layout_slot_id"`
	Position     int    `json:"position"` // ex: 1º recepcionista, 2º recepcionista
}

// vinculação de usuário a um slot de escala (quem vai servir em qual evento)
type Assignment struct {
    ID               string    `json:"id"`
    ScheduleID       string    `json:"schedule_id"`
    UserID           string    `json:"user_id"`
    LayoutSlotID     *string   `json:"layout_slot_id,omitempty"` // usado quando a posição importa
    RoleID           *string   `json:"role_id,omitempty"`        // usado quando o papel importa
    AssignedByUserID string    `json:"assigned_by_user_id"`
    AssignedAt       time.Time `json:"assigned_at"`
}
