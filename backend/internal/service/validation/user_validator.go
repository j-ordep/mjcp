package validation

import (
    "github.com/j-ordep/mjcp/backend/internal/domain/entity"
    "github.com/j-ordep/mjcp/backend/internal/domain/errors"
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
    
    if err != nil && err != errors.ErrUserNotFound {
        return err
    }
    
    if existingUser == nil {
        return nil
    }
    
    if existingUser.Email == user.Email {
        return errors.ErrDuplicatedEmail
    }
    
    if existingUser.Phone == user.Phone {
        return errors.ErrDuplicatedPhone
    }
    
    return nil
}