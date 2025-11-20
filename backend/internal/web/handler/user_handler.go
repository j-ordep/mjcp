package handler

import (
	"encoding/json"
	"net/http"

	"github.com/j-ordep/mjcp/backend/internal/dto"
	"github.com/j-ordep/mjcp/backend/internal/service"
)

type UserHandler struct {
	service *service.UserService
}

func NewUserHandler(service *service.UserService) *UserHandler {
	return &UserHandler{service: service}
}

func (h *UserHandler) Login(w http.ResponseWriter, r *http.Request) {
	var input dto.LoginUserInput
	if err := json.NewDecoder(r.Body).Decode(input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	user, err := h.service.Login(input)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(user)
}

func (h *UserHandler) Create(w http.ResponseWriter, r *http.Request) {
    var input dto.CreateUserInput

    if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }

    user, err := h.service.Create(input)
    if err != nil {
        w.WriteHeader(http.StatusInternalServerError)
        json.NewEncoder(w).Encode(map[string]string{"error": "Failed to create user"})
        return
    }

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
