package apperrors

import "errors"

var (
    // ErrUserNotFound é retornado quando o usuário não é encontrado
    ErrUserNotFound = errors.New("user not found")

    // ErrDuplicatedEmail é retornado quando há tentativa de criar usuário com email duplicado
    ErrDuplicatedEmail = errors.New("email already exists")

    // ErrDuplicatedPhone é retornado quando há tentativa de criar usuário com telefone duplicado
    ErrDuplicatedPhone = errors.New("phone already exists")

    // ErrUnauthorizedAccess é retornado quando há tentativa de acesso não autorizado
    ErrUnauthorizedAccess = errors.New("unauthorized access")

    // ErrInvalidCredentials é retornado quando as credenciais são inválidas
    ErrInvalidCredentials = errors.New("invalid credentials")

    // ErrInvalidToken é retornado quando o token é inválido
    ErrInvalidToken = errors.New("invalid token")
    
    // ErrExpiredToken é retornado quando o token expirou
    ErrExpiredToken = errors.New("token expired")
)
