package entities

import "time"

// User representa um voluntário da igreja
type User struct {
	ID        string     `json:"id"`
	Name      string     `json:"name"`
	Email     string     `json:"email"`
	Phone     string     `json:"phone"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
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

// Role representa um PAPEL dentro de um ministério.
// - Isso é apenas um "catálogo" de funções possíveis.
// - Não tem relação direta com usuários aqui.
// - Exemplos: "Baterista", "Guitarrista", "Recepcionista", "Professor", "Líder".
// - Serve para saber que tipos de funções existem naquele ministério.
// - Cada ministério define seus próprios papéis.
type Role struct {
	ID   string `json:"id"`
	MinistryID string  `json:"ministry_id"`
	Name string `json:"name"` // Leader, Teacher, Recepcionista, Baterista, guitarrista
}

// MinistryRoleAssignment representa QUEM possui QUAL papel em QUAL ministério.
// - Aqui é onde ligamos User → Ministry → Role.
// - Serve para saber:
//     * quem é líder do ministério
//     * quem pode criar escala
//     * quem pode atribuir voluntários
//     * quem exerce cada função (ex: baterista, recepcionista, professor)
// - Diferente de Role, essa tabela fala de PESSOAS REAIS e PERMISSÕES reais.
// - Cada registro é "Usuário X tem o papel Y no ministério Z".
type MinistryRoleAssignment struct {
	// que usuário tem qual papel em qual ministério; por exemplo, líder
	ID              string    `json:"id"`
	UserID          string    `json:"user_id"` // quem recebe o papel
	MinistryID      string    `json:"ministry_id"`
	RoleID          string    `json:"role_id"`
	AssignedAt      time.Time `json:"assigned_at"`
	GrantedByUserID string    `json:"granted_by_user_id"` // quem deu o papel
}

type LayoutSlot struct {
    ID         string `json:"id"`
    MinistryID string `json:"ministry_id"`
    Name       string `json:"name"`     // Ex: "Salva – Esquerdo Frente"
    Code       string `json:"code"`     // Ex: "salva_esquerdo_frente"
    Multiple   bool   `json:"multiple"` // pode ter mais de um voluntário?
    Order      int    `json:"order_position"`    // ordenação visual
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

type ScheduleSlot struct {
	ID           string `json:"id"`
	ScheduleID   string `json:"schedule_id"`
	LayoutSlotID string `json:"layout_slot_id"`
	Position     int    `json:"position"` // ex: 1º recepcionista, 2º recepcionista
}

// Availability representa a disponibilidade de um voluntário
type Availability struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	Date      time.Time `json:"date"` // disponibilidade por dia, tavez seria melhor => start_time - end_time  
	Status    bool      `json:"available"` // disponivel?
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
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
