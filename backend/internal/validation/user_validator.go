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