package usecases

import (
	"context"
	"github.com/j-ordep/mjcp/backend/internal/domain/entities"
	"github.com/j-ordep/mjcp/backend/internal/domain/repositories"
)

// CreateVolunteerUseCase representa o caso de uso para criar um voluntário
type CreateVolunteerUseCase struct {
	repo repositories.VolunteerRepository
}

// NewCreateVolunteerUseCase cria uma nova instância do use case
func NewCreateVolunteerUseCase(repo repositories.VolunteerRepository) *CreateVolunteerUseCase {
	return &CreateVolunteerUseCase{repo: repo}
}

// Execute executa o caso de uso
func (uc *CreateVolunteerUseCase) Execute(ctx context.Context, volunteer *entities.Volunteer) error {
	// Validações de negócio podem ser adicionadas aqui
	// Por exemplo: verificar se email já existe, validar formato, etc.
	
	return uc.repo.Create(ctx, volunteer)
}

// GetVolunteersUseCase representa o caso de uso para listar voluntários
type GetVolunteersUseCase struct {
	repo repositories.VolunteerRepository
}

// NewGetVolunteersUseCase cria uma nova instância do use case
func NewGetVolunteersUseCase(repo repositories.VolunteerRepository) *GetVolunteersUseCase {
	return &GetVolunteersUseCase{repo: repo}
}

// Execute executa o caso de uso
func (uc *GetVolunteersUseCase) Execute(ctx context.Context) ([]*entities.Volunteer, error) {
	return uc.repo.GetAll(ctx)
}

// CreateScheduleUseCase representa o caso de uso para criar uma escala
type CreateScheduleUseCase struct {
	scheduleRepo repositories.ScheduleRepository
	eventRepo    repositories.EventRepository
}

// NewCreateScheduleUseCase cria uma nova instância do use case
func NewCreateScheduleUseCase(
	scheduleRepo repositories.ScheduleRepository,
	eventRepo repositories.EventRepository,
) *CreateScheduleUseCase {
	return &CreateScheduleUseCase{
		scheduleRepo: scheduleRepo,
		eventRepo:    eventRepo,
	}
}

// Execute executa o caso de uso
func (uc *CreateScheduleUseCase) Execute(ctx context.Context, schedule *entities.Schedule) error {
	// Validar se o evento existe
	_, err := uc.eventRepo.GetByID(ctx, schedule.EventID)
	if err != nil {
		return err
	}

	// Criar a escala
	return uc.scheduleRepo.Create(ctx, schedule)
}
