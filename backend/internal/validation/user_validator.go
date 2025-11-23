package validation

import (
    "github.com/j-ordep/mjcp/backend/internal/domain/entity"
    "github.com/j-ordep/mjcp/backend/internal/domain/apperrors"
    "github.com/j-ordep/mjcp/backend/internal/domain/repository"
)

type UserValidator struct {
    repo repository.UserRepository
}

func NewUserValidator(repo repository.UserRepository) *UserValidator {
    return &UserValidator{repo: repo}
}

func (v *UserValidator) ValidateUser(user *entity.User) error {
    existingUser, err := v.repo.GetByEmail(user.Email)
    
    if err != nil && err != apperrors.ErrUserNotFound {
        return err
    }
    
    if existingUser == nil {
        return nil
    }
    
    if existingUser.Email == user.Email {
        return apperrors.ErrDuplicatedEmail
    }
    
    if existingUser.Phone == user.Phone {
        return apperrors.ErrDuplicatedPhone
    }
    
    return nil
}

// ValidateUserUpdate valida se email ou phone estão duplicados, excluindo o próprio usuário
func (v *UserValidator) ValidateUserUpdate(user *entity.User) error {
    existingUserByEmail, err := v.repo.GetByEmail(user.Email)
    
    if err != nil && err != apperrors.ErrUserNotFound {
        return err
    }
    
    // Se encontrou um usuário com o mesmo email e não é o mesmo usuário
    if existingUserByEmail != nil && existingUserByEmail.ID != user.ID {
        return apperrors.ErrDuplicatedEmail
    }
    
    // Verificar phone duplicado usando Search
    filters := map[string]string{"phone": user.Phone}
    users, err := v.repo.Search(filters)
    if err != nil {
        return err
    }
    
    // Se encontrou usuários com o mesmo phone e não é o mesmo usuário
    for _, u := range users {
        if u.Phone == user.Phone && u.ID != user.ID {
            return apperrors.ErrDuplicatedPhone
        }
    }
    
    return nil
}

// ValidatePhoneUpdate valida se phone está duplicado, excluindo o próprio usuário
func (v *UserValidator) ValidatePhoneUpdate(user *entity.User) error {
    filters := map[string]string{"phone": user.Phone}
    users, err := v.repo.Search(filters)
    if err != nil {
        return err
    }
    
    // Se encontrou usuários com o mesmo phone e não é o mesmo usuário
    for _, u := range users {
        if u.Phone == user.Phone && u.ID != user.ID {
            return apperrors.ErrDuplicatedPhone
        }
    }
    
    return nil
}