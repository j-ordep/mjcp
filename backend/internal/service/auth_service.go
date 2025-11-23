package service

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/j-ordep/mjcp/backend/internal/domain/apperrors"
	"github.com/j-ordep/mjcp/backend/internal/domain/entity"
	"github.com/j-ordep/mjcp/backend/internal/domain/repository"
	userDTO "github.com/j-ordep/mjcp/backend/internal/dto/user"
	"github.com/j-ordep/mjcp/backend/internal/infra/auth"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	userRepo               repository.UserRepository
	passwordResetTokenRepo repository.PasswordResetTokenRepository
	emailService           *auth.EmailService
	baseURL                string
}

func NewAuthService(
	userRepo repository.UserRepository,
	passwordResetTokenRepo repository.PasswordResetTokenRepository,
	emailService *auth.EmailService,
	baseURL string,
) *AuthService {
	return &AuthService{
		userRepo:               userRepo,
		passwordResetTokenRepo: passwordResetTokenRepo,
		emailService:           emailService,
		baseURL:                baseURL,
	}
}

// ForgotPassword gera token de reset e envia email
func (s *AuthService) ForgotPassword(input userDTO.ForgotPasswordInput) error {
	// Buscar usuário por email
	user, err := s.userRepo.GetByEmail(input.Email)
	if err != nil {
		// Por segurança, não revelamos se o email existe ou não
		// Sempre retorna sucesso para evitar email enumeration
		return nil
	}

	// Gerar token aleatório seguro
	token, err := generateSecureToken()
	if err != nil {
		return fmt.Errorf("failed to generate token: %w", err)
	}

	// Criar token de reset (válido por 1 hora)
	resetToken := entity.NewPasswordResetToken(user.ID, token, time.Hour)

	// Salvar token no banco
	if err := s.passwordResetTokenRepo.Create(resetToken); err != nil {
		return err
	}

	// Enviar email com link de reset
	if err := s.emailService.SendPasswordResetEmailWithToken(user.Email, s.baseURL, token); err != nil {
		// Log erro mas não falha a operação
		// O token já foi criado, usuário pode tentar novamente
		return nil
	}

	return nil
}

// ResetPassword valida token e atualiza senha
func (s *AuthService) ResetPassword(input userDTO.ResetPasswordInput) error {
	// Buscar token
	resetToken, err := s.passwordResetTokenRepo.GetByToken(input.Token)
	if err != nil {
		return apperrors.ErrInvalidToken
	}

	// Validar token (não usado e não expirado)
	if !resetToken.IsValid() {
		if resetToken.IsExpired() {
			return apperrors.ErrExpiredToken
		}
		return apperrors.ErrInvalidToken
	}

	// Buscar usuário
	user, err := s.userRepo.GetByID(resetToken.UserID)
	if err != nil {
		return apperrors.ErrUserNotFound
	}

	// Hash da nova senha
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	// Atualizar senha do usuário
	user.Password = string(hashedPassword)
	user.UpdatedAt = time.Now()

	if err := s.userRepo.Update(user); err != nil {
		return err
	}

	// Marcar token como usado
	if err := s.passwordResetTokenRepo.MarkAsUsed(input.Token); err != nil {
		// Log erro mas não falha a operação
		// Senha já foi atualizada
	}

	return nil
}

// generateSecureToken gera um token aleatório seguro de 32 bytes (64 caracteres hex)
func generateSecureToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}
