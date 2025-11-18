package repository

import (
	"github.com/j-ordep/mjcp/backend/internal/domain/entities"
)

// UserRepository define o contrato para operações com voluntários
type UserRepository interface {
	Create(user *entities.User) error
	GetByID(id string) (*entities.User, error)
	GetAll() ([]*entities.User, error)
	Update(user *entities.User) error
	Delete(id string) error
}

// MinistryRepository define o contrato para operações com ministérios
type MinistryRepository interface {
	Create(ministry *entities.Ministry) error
	GetByID(id string) (*entities.Ministry, error)
	GetAll() ([]*entities.Ministry, error)
	Update(ministry *entities.Ministry) error
	Delete(id string) error
}

// ScheduleRepository define o contrato para operações com escalas
type ScheduleRepository interface {
	Create(schedule *entities.Schedule) error
	GetByID(id string) (*entities.Schedule, error)
	GetByEventID(eventID string) ([]*entities.Schedule, error)
	GetAll() ([]*entities.Schedule, error)
	Update(schedule *entities.Schedule) error
	Delete(id string) error
}

// AvailabilityRepository define o contrato para operações com disponibilidade
type AvailabilityRepository interface {
	Create(availability *entities.Availability) error
	GetByVolunteerID(volunteerID string) ([]*entities.Availability, error)
	GetByDate(date string) ([]*entities.Availability, error)
	Update(availability *entities.Availability) error
	Delete(id string) error
}
