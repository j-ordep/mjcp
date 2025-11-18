package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/j-ordep/mjcp/backend/internal/domain/entities"
)

type UserHandler struct {

}

func NewUserHandler() *UserHandler {
	return &UserHandler{

	}
}

func (h *UserHandler) Create(w http.ResponseWriter, r *http.Request) {
	var user entities.User

	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
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
	json.NewEncoder(w).Encode(user)
} 

func (h *UserHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	// volunteers, err := h.getUseCase.Execute(r.Context())
	// if err != nil {
	// 	w.WriteHeader(http.StatusInternalServerError)
	// 	json.NewEncoder(w).Encode(map[string]string{"error": "Failed to get volunteers"})
	// 	return
	// }

	// w.WriteHeader(http.StatusOK)
	// json.NewEncoder(w).Encode(volunteers)
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode("")
}
