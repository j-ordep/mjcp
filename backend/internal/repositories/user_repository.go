package repository

import (
	"database/sql"

	"github.com/j-ordep/mjcp/backend/internal/domain/entities"
)

type UserRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

func Create(user *entities.User) error {
	return nil
}

func GetByID(id string) (*entities.User, error) {
	return nil, nil
}

func GetAll() ([]entities.User, error) {
	return nil, nil
}

func Update(user *entities.User) error {
	return nil
}

func Delete(id string) error {
	return nil
}