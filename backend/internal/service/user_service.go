package service

import (
	"time"

	"github.com/j-ordep/mjcp/backend/internal/domain/apperrors"
	"github.com/j-ordep/mjcp/backend/internal/domain/repository"
	userDTO "github.com/j-ordep/mjcp/backend/internal/dto/user"
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

func (s *UserService) Login(input userDTO.LoginUserInput) (*userDTO.LoginUserOutput, error) {
	userEntity, err := s.repo.GetByEmail(input.Email)
	if err != nil {
		return nil, err
	}

	if bcrypt.CompareHashAndPassword([]byte(userEntity.Password), []byte(input.Password)) != nil {
		return nil, apperrors.ErrInvalidCredentials
	}

	token, err := auth.GenerateToken(userEntity.ID, userEntity.Name, userEntity.Email)
	if err != nil {
		return nil, apperrors.ErrInvalidCredentials
	}

	userOutput := userDTO.FromUserDomain(userEntity)

	return &userDTO.LoginUserOutput{
		User:  userOutput,
		Token: token,
	}, nil
}

func (s *UserService) Create(input userDTO.CreateUserInput) (*userDTO.UserOutput, error) {
	userEntity, err := userDTO.ToUserDomain(input)
	if err != nil {
		return nil, err
	}

	// Valida se email ou telefone já existem no banco
	if err := s.validator.ValidateUser(userEntity); err != nil {
		return nil, err
	}

	err = s.repo.Create(userEntity)
	if err != nil {
		return nil, err
	}

	output := userDTO.FromUserDomain(userEntity)
	return output, nil
}

func (s *UserService) GetAll() ([]*userDTO.UserOutput, error) {
	users, err := s.repo.GetAll()
	if err != nil {
		return nil, err
	}

	usersOutput := make([]*userDTO.UserOutput, len(users))
	for i, u := range users {
		usersOutput[i] = userDTO.FromUserDomain(u)
	}

	return usersOutput, nil
}

func (s *UserService) GetByID(id string) (*userDTO.UserOutput, error) {
	userEntity, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}

	return userDTO.FromUserDomain(userEntity), nil
}

func (s *UserService) Search(filters map[string]string) ([]*userDTO.UserOutput, error) {
	users, err := s.repo.Search(filters)
	if err != nil {
		return nil, err
	}

	usersOutput := make([]*userDTO.UserOutput, len(users))
	for i, u := range users {
		usersOutput[i] = userDTO.FromUserDomain(u)
	}

	return usersOutput, nil
}

func (s *UserService) Update(id string, input userDTO.UpdateUserInput) (*userDTO.UserOutput, error) {
	userEntity, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}

	userEntity.Name = input.Name
	userEntity.Email = input.Email
	userEntity.Phone = input.Phone
	userEntity.UpdatedAt = time.Now()

	// Validar se email ou phone não estão duplicados (exceto o próprio usuário)
	if err := s.validator.ValidateUserUpdate(userEntity); err != nil {
		return nil, err
	}

	// Atualizar no banco
	err = s.repo.Update(userEntity)
	if err != nil {
		return nil, err
	}

	return userDTO.FromUserDomain(userEntity), nil
}

func (s *UserService) UpdatePhone(id string, input userDTO.UpdatePhoneInput) (*userDTO.UserOutput, error) {
	// Buscar usuário existente
	userEntity, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}

	// Atualizar apenas o telefone
	userEntity.UpdatePhone(input.Phone)

	// Validar se phone não está duplicado (exceto o próprio usuário)
	if err := s.validator.ValidatePhoneUpdate(userEntity); err != nil {
		return nil, err
	}

	// Atualizar no banco
	err = s.repo.Update(userEntity)
	if err != nil {
		return nil, err
	}

	return userDTO.FromUserDomain(userEntity), nil
}

func (s *UserService) Delete(id string) error {
	// Verificar se usuário existe
	_, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}

	// Deletar
	return s.repo.Delete(id)
}
