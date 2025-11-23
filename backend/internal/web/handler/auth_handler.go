package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-playground/validator/v10"
	"github.com/j-ordep/mjcp/backend/internal/domain/apperrors"
	userDTO "github.com/j-ordep/mjcp/backend/internal/dto/user"
	"github.com/j-ordep/mjcp/backend/internal/service"
)

type AuthHandler struct {
	service  *service.AuthService
	validate *validator.Validate
}

func NewAuthHandler(authService *service.AuthService) *AuthHandler {
	return &AuthHandler{
		service:  authService,
		validate: validator.New(),
	}
}

// ForgotPassword recebe email e envia link de recuperação
func (h *AuthHandler) ForgotPassword(w http.ResponseWriter, r *http.Request) {
	var input userDTO.ForgotPasswordInput

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request body"})
		return
	}

	if err := h.validate.Struct(input); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	// Sempre retorna sucesso por segurança (evita email enumeration)
	err := h.service.ForgotPassword(input)
	if err != nil {
		// Log erro internamente mas retorna sucesso
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"message": "If the email exists, a password reset link has been sent"})
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "If the email exists, a password reset link has been sent"})
}

// ResetPassword recebe token e nova senha
func (h *AuthHandler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	var input userDTO.ResetPasswordInput

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request body"})
		return
	}

	if err := h.validate.Struct(input); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	err := h.service.ResetPassword(input)
	if err != nil {
		switch err {
		case apperrors.ErrInvalidToken:
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Invalid or expired token"})
		case apperrors.ErrExpiredToken:
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Token has expired"})
		case apperrors.ErrUserNotFound:
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"error": "User not found"})
		default:
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Failed to reset password"})
		}
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Password has been reset successfully"})
}
