package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/j-ordep/mjcp/backend/internal/application/usecases"
	"github.com/j-ordep/mjcp/backend/internal/domain/entities"
)

// VolunteerHandler gerencia as requisições HTTP relacionadas a voluntários
type VolunteerHandler struct {
	createUseCase *usecases.CreateVolunteerUseCase
	getUseCase    *usecases.GetVolunteersUseCase
}

// NewVolunteerHandler cria uma nova instância do handler
func NewVolunteerHandler(
	createUseCase *usecases.CreateVolunteerUseCase,
	getUseCase *usecases.GetVolunteersUseCase,
) *VolunteerHandler {
	return &VolunteerHandler{
		createUseCase: createUseCase,
		getUseCase:    getUseCase,
	}
}

// Create handler para criar um voluntário
func (h *VolunteerHandler) Create(c *gin.Context) {
	var volunteer entities.Volunteer
	
	if err := c.ShouldBindJSON(&volunteer); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.createUseCase.Execute(c.Request.Context(), &volunteer); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, volunteer)
}

// GetAll handler para listar todos os voluntários
func (h *VolunteerHandler) GetAll(c *gin.Context) {
	volunteers, err := h.getUseCase.Execute(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, volunteers)
}

// ScheduleHandler gerencia as requisições HTTP relacionadas a escalas
type ScheduleHandler struct {
	createUseCase *usecases.CreateScheduleUseCase
}

// NewScheduleHandler cria uma nova instância do handler
func NewScheduleHandler(createUseCase *usecases.CreateScheduleUseCase) *ScheduleHandler {
	return &ScheduleHandler{createUseCase: createUseCase}
}

// Create handler para criar uma escala
func (h *ScheduleHandler) Create(c *gin.Context) {
	var schedule entities.Schedule
	
	if err := c.ShouldBindJSON(&schedule); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.createUseCase.Execute(c.Request.Context(), &schedule); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, schedule)
}
