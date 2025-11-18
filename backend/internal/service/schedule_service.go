package service

import (
	"github.com/j-ordep/mjcp/backend/internal/domain/repository"
)

type ScheduleService struct {
	scheduleRepo repository.ScheduleRepository
}

func NewScheduleService(scheduleRepo repository.ScheduleRepository,) *ScheduleService {
	return &ScheduleService{
		scheduleRepo: scheduleRepo,
	}
}
