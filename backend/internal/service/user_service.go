package service

import (
	"github.com/j-ordep/mjcp/backend/internal/domain/errors"
	"github.com/j-ordep/mjcp/backend/internal/domain/repository"
	"github.com/j-ordep/mjcp/backend/internal/dto"
	"github.com/j-ordep/mjcp/backend/internal/infra/auth"
	"github.com/j-ordep/mjcp/backend/internal/validation"
	"golang.org/x/crypto/bcrypt"
)

type UserService struct {
    repo      repository.UserRepository
    validator *validation.UserValidator
}

func NewUserService(repo repository.UserRepository) *UserService {
    return &UserService{
        repo:      repo,
        validator: validation.NewUserValidator(repo),
    }
}

func (s *UserService) Login(input dto.LoginUserInput) (*dto.LoginUserOutput, error) {
	user, err := s.repo.GetByEmail(input.Email)
	if err != nil {
		return nil, err
	}

	if bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)) != nil {
		return nil, errors.ErrInvalidCredentials
	}

	token, err := auth.GenerateToken(user.ID, user.Name, user.Email)
	if err != nil{
		return nil, errors.ErrInvalidCredentials
	}

	userOutput := dto.FromUserDomain(user)

    return &dto.LoginUserOutput{
        User:  userOutput,
        Token: token,
    }, nil
}

func (s *UserService) Create(input dto.CreateUserInput) (*dto.UserOutput, error) {
	user, err := dto.ToUserDomain(input)
	if err != nil {
		return nil, err
	}

	if err := s.validator.ValidateUser(user); err != nil {
        return nil, err
    }

	err = s.repo.Create(user)
	if err != nil {
		return nil, err
	}

	output := dto.FromUserDomain(user)
	return output, nil
}

func (s *UserService) GetAll() ([]*dto.UserOutput ,error){
	users, err := s.repo.GetAll()
	if err != nil {
		return nil, err
	}

	usersOutput := make([]*dto.UserOutput, len(users))
	for i, user := range users {
		usersOutput[i] = dto.FromUserDomain(user)
	}

	return usersOutput, nil
}
