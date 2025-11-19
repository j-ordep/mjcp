package service

import (
	"github.com/j-ordep/mjcp/backend/internal/domain/errors"
	"github.com/j-ordep/mjcp/backend/internal/domain/repository"
	"github.com/j-ordep/mjcp/backend/internal/dto"
)

type UserService struct {
	repo repository.UserRepository
}

func NewUserService(repo repository.UserRepository) *UserService {
	return &UserService{repo: repo}
}

func (s *UserService) Create(input dto.CreateUserInput) (*dto.UserOutput, error) {
	user, err := dto.ToUserDomain(input)
	if err != nil {
		return nil, err
	}

    // verificar se user já existe

	// 	GetByEmail() → retorna (nil, ErrUserNotFound)
	// ├─ err != nil? SIM
	// ├─ err != ErrUserNotFound? NÃO ← Ignora o erro
	// ├─ existingUser != nil? NÃO
	// └─ Cria o usuário
    existingUser, err := s.repo.GetByEmail(user.Email)
	// tem erro? se tiver, e o erro for diferenten de ErrUserNotFound, ignoramos, como isso temos existingUser
	// se tem erro e o erro e é difefente de ErrUserNotFound, paramos
    if err != nil && err != errors.ErrUserNotFound {
        return nil, err
    }
    if existingUser != nil {
        return nil, errors.ErrDuplicatedEmail
    }

	err = s.repo.Create(user)
	if err != nil {
		return nil, err
	}

	output := dto.FromUserDomain(user)
	return &output, nil
}

// func GetUserByEmail(email string) (*dto.UserOutput ,error){

// 	output := dto.FromUserDomain(user)
// 	return &output, nil
// }
