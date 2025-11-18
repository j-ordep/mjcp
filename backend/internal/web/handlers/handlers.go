package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/j-ordep/mjcp/backend/internal/application/usecases"
	"github.com/j-ordep/mjcp/backend/internal/domain/entities"
)

// VolunteerHandler gerencia as requisições HTTP relacionadas a voluntários
type VolunteerHandler struct {
	createUseCase *usecases.CreateVolunteerUseCase
	getUseCase    *usecases.GetVolunteersUseCase
}

// NewVolunteerHandler cria uma nova instância do handler
func NewVolunteerHandler(createUseCase *usecases.CreateVolunteerUseCase, getUseCase *usecases.GetVolunteersUseCase) *VolunteerHandler {
	return &VolunteerHandler{
		createUseCase: createUseCase,
		getUseCase:    getUseCase,
	}
}

// Create handler para criar um voluntário
func (h *VolunteerHandler) Create(w http.ResponseWriter, r *http.Request) {
	var volunteer entities.User

	if err := json.NewDecoder(r.Body).Decode(&volunteer); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request"})
		return
	}

	// if err := h.createUseCase.Execute(r.Context(), &volunteer); err != nil {
	// 	w.WriteHeader(http.StatusInternalServerError)
	// 	json.NewEncoder(w).Encode(map[string]string{"error": "Failed to create volunteer"})
	// 	return
	// }

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(volunteer)
} // GetAll handler para listar todos os voluntários
func (h *VolunteerHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	// volunteers, err := h.getUseCase.Execute(r.Context())
	// if err != nil {
	// 	w.WriteHeader(http.StatusInternalServerError)
	// 	json.NewEncoder(w).Encode(map[string]string{"error": "Failed to get volunteers"})
	// 	return
	// }

	// w.WriteHeader(http.StatusOK)
	// json.NewEncoder(w).Encode(volunteers)
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode([]entities.User{})
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
func (h *ScheduleHandler) Create(w http.ResponseWriter, r *http.Request) {
	var schedule entities.Schedule

	if err := json.NewDecoder(r.Body).Decode(&schedule); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request"})
		return
	}

	// if err := h.createUseCase.Execute(r.Context(), &schedule); err != nil {
	// 	w.WriteHeader(http.StatusInternalServerError)
	// 	json.NewEncoder(w).Encode(map[string]string{"error": "Failed to create schedule"})
	// 	return
	// }

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(schedule)
}
