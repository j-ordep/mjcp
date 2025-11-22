package errors

import "errors"

var (
	// ErrUserNotFound é retornado quando a conta não é encontrada
	ErrUserNotFound = errors.New("user not found")

	// ErrDuplicatedAPIKey é retornado quando há tentativa de criar conta com API key duplciada
	ErrDuplicatedEmail = errors.New("email already exists")

	// ErrUnauthorizedAccess é retornado quando há tentativa de acesso não autorizado a um recurso
	ErrUnauthorizedAccess = errors.New("unauthorized access")

	ErrInvalidCredentials = errors.New("invalid credentials")
)
