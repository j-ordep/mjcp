package repository

import (
	"github.com/j-ordep/mjcp/backend/internal/domain/entity"
)

type UserRepository interface {
	Create(user *entity.User) error
	GetAll() ([]*entity.User, error)
	GetByID(id string) (*entity.User, error)
	GetByEmail(email string) (*entity.User, error)
	GetByPhone(phone string) (*entity.User, error)
	Update(user *entity.User) error
	Delete(id string) error
}

// MinistryRepository define o contrato para operações com ministérios
type MinistryRepository interface {
	Create(ministry *entity.Ministry) error
	GetByID(id string) (*entity.Ministry, error)
	GetAll() ([]*entity.Ministry, error)
	Update(ministry *entity.Ministry) error
	Delete(id string) error
}

// ScheduleRepository define o contrato para operações com escalas
type ScheduleRepository interface {
	Create(schedule *entity.Schedule) error
	GetByID(id string) (*entity.Schedule, error)
	GetByEventID(eventID string) ([]*entity.Schedule, error)
	GetAll() ([]*entity.Schedule, error)
	Update(schedule *entity.Schedule) error
	Delete(id string) error
}

// AvailabilityRepository define o contrato para operações com disponibilidade
type AvailabilityRepository interface {
	Create(availability *entity.Availability) error
	GetByVolunteerID(volunteerID string) ([]*entity.Availability, error)
	GetByDate(date string) ([]*entity.Availability, error)
	Update(availability *entity.Availability) error
	Delete(id string) error
}
