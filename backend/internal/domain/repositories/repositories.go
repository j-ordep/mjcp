package repositories

import (
	"context"
	"github.com/j-ordep/mjcp/backend/internal/domain/entities"
)

// VolunteerRepository define o contrato para operações com voluntários
type VolunteerRepository interface {
	Create(ctx context.Context, volunteer *entities.User) error
	GetByID(ctx context.Context, id string) (*entities.User, error)
	GetAll(ctx context.Context) ([]*entities.User, error)
	Update(ctx context.Context, volunteer *entities.User) error
	Delete(ctx context.Context, id string) error
}

// MinistryRepository define o contrato para operações com ministérios
type MinistryRepository interface {
	Create(ctx context.Context, ministry *entities.Ministry) error
	GetByID(ctx context.Context, id string) (*entities.Ministry, error)
	GetAll(ctx context.Context) ([]*entities.Ministry, error)
	Update(ctx context.Context, ministry *entities.Ministry) error
	Delete(ctx context.Context, id string) error
}

// ScheduleRepository define o contrato para operações com escalas
type ScheduleRepository interface {
	Create(ctx context.Context, schedule *entities.Schedule) error
	GetByID(ctx context.Context, id string) (*entities.Schedule, error)
	GetByEventID(ctx context.Context, eventID string) ([]*entities.Schedule, error)
	GetAll(ctx context.Context) ([]*entities.Schedule, error)
	Update(ctx context.Context, schedule *entities.Schedule) error
	Delete(ctx context.Context, id string) error
}

// AvailabilityRepository define o contrato para operações com disponibilidade
type AvailabilityRepository interface {
	Create(ctx context.Context, availability *entities.Availability) error
	GetByVolunteerID(ctx context.Context, volunteerID string) ([]*entities.Availability, error)
	GetByDate(ctx context.Context, date string) ([]*entities.Availability, error)
	Update(ctx context.Context, availability *entities.Availability) error
	Delete(ctx context.Context, id string) error
}
