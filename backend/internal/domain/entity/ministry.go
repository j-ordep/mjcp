package entity

import "time"

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

type LayoutSlot struct {
    ID         string `json:"id"`
    MinistryID string `json:"ministry_id"`
    Name       string `json:"name"`     // Ex: "Salva – Esquerdo Frente"
    Code       string `json:"code"`     // Ex: "salva_esquerdo_frente"
    Multiple   bool   `json:"multiple"` // pode ter mais de um voluntário?
    Order      int    `json:"order_position"`    // ordenação visual
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
