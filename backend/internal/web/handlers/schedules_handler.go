package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/j-ordep/mjcp/backend/internal/domain/entities"
)

type ScheduleHandler struct {
	
}

func NewScheduleHandler() *ScheduleHandler {
	return &ScheduleHandler{}
}

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
