package service

import (
	"github.com/j-ordep/mjcp/backend/internal/domain/errors"
	"github.com/j-ordep/mjcp/backend/internal/domain/repository"
	"github.com/j-ordep/mjcp/backend/internal/dto"
	"github.com/j-ordep/mjcp/backend/internal/infra/jwt"
	"golang.org/x/crypto/bcrypt"
)

type UserService struct {
	repo repository.UserRepository
}

func NewUserService(repo repository.UserRepository) *UserService {
	return &UserService{repo: repo}
}

func (s *UserService) Login(input dto.LoginUserInput) (*dto.LoginUserOutput, error) {
	user, err := s.repo.GetByEmail(input.Email)
	if err != nil {
		return nil, err
	}

	if bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)) != nil {
		return nil, errors.ErrInvalidCredentials
	}

	token, err := jwt.GenerateToken(user.ID, user.Name, user.Email)
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

    existingUser, err := s.repo.GetByEmail(user.Email)
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
