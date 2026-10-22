package auth

import (
	"fmt"
	"log"
)

// EmailService é uma interface simples para envio de emails
// Por enquanto apenas loga, mas pode ser facilmente substituído por SMTP/SendGrid/etc
type EmailService struct{}

func NewEmailService() *EmailService {
	return &EmailService{}
}

// SendPasswordResetEmail envia email com link de recuperação de senha
// Por enquanto apenas loga, mas pode ser implementado com SMTP real
func (e *EmailService) SendPasswordResetEmail(email, resetLink string) error {
	// TODO: Implementar envio real de email (SMTP, SendGrid, etc)
	// Por enquanto apenas loga para desenvolvimento
	log.Printf("[EMAIL] Password reset link for %s: %s", email, resetLink)

	// Em produção, você pode usar:
	// - net/smtp para SMTP simples
	// - SendGrid, Mailgun, AWS SES para serviços de email
	// - gomail para envio mais robusto

	return nil
}

// SendPasswordResetEmailWithToken é um helper que constrói o link completo
func (e *EmailService) SendPasswordResetEmailWithToken(email, baseURL, token string) error {
	resetLink := fmt.Sprintf("%s/auth/reset-password?token=%s", baseURL, token)
	return e.SendPasswordResetEmail(email, resetLink)
}
