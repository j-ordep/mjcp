package service

import "github.com/j-ordep/mjcp/backend/internal/domain/repository"

type ScheduleService struct {
	repository repository.ScheduleRepository
}

func NewScheduleService(scheduleRepo repository.ScheduleRepository,) *ScheduleService {
	return &ScheduleService{
		repository: scheduleRepo,
	}
}
