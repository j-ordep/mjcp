package entities

import "time"

// User representa um voluntário da igreja
type User struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Phone     string    `json:"phone"`
	Status    bool      `json:"status"` // disponivel?
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

// tabela de junção para relacionamento muitos-para-muitos
type UserMinistry struct {
	UserID     string `json:"user_id"`
	MinistryID string `json:"ministry_id"`
}

type Role struct {
	ID   string `json:"id"`
	Name string `json:"name"` // Member, Leader, Teacher
}

// que usuário tem qual papel em qual ministério; por exemplo, líder
type MinistryRoleAssignment struct {
	ID         string    `json:"id"`
	UserID     string    `json:"user_id"` // quem recebe o papel
	MinistryID string    `json:"ministry_id"`
	RoleID     string    `json:"role_id"`
	AssignedAt time.Time `json:"assigned_at"`
	GrantedByUserID   string    `json:"granted_by_user_id"` // quem deu o papel
}

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

// Availability representa a disponibilidade de um voluntário
type Availability struct {
	ID         string    `json:"id"`
	UserID     string    `json:"user_id"`
	Date       time.Time `json:"date"`
	Status     bool      `json:"available"` // disponivel?
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// vinculação de usuário a um slot de escala (quem vai servir em qual evento)
type Assignment struct {
	ID              string    `json:"id"`
	ScheduleID      string    `json:"schedule_id"` // qual evento (culto?)
	UserID          string    `json:"user_id"`
	RoleID          string    `json:"role_id"`  // papel que a pessoa vai exercer naquele evento
	AssignedByUserID string   `json:"assigned_by_user_id"` // escalado aonde ou por quem
	AssignedAt      time.Time `json:"assigned_at"`
}
