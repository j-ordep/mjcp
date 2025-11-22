package repositories

import (
	"database/sql"

	"github.com/j-ordep/mjcp/backend/internal/domain/entity"
	"github.com/j-ordep/mjcp/backend/internal/domain/apperrors"
)

type UserRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(user *entity.User) error {

	stmt, err := r.db.Prepare(`
		INSERT INTO users (id, name, email, password, phone, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)	
	`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	_, err = stmt.Exec(
		user.ID,
		user.Name,
		user.Email,
		user.Password,
		user.Phone,
		user.CreatedAt,
		user.UpdatedAt,
	)
	if err != nil {
		return err
	}

	return nil
}

func (r *UserRepository) GetAll() ([]*entity.User, error) {
	rows, err := r.db.Query(`
		SELECT id, name, email, password, phone, created_at, updated_at 
		FROM users
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []*entity.User
	for rows.Next() {
		var user entity.User
		err := rows.Scan(
			&user.ID,
			&user.Name,
			&user.Email,
			&user.Password,
			&user.Phone,
			&user.CreatedAt,
			&user.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		users = append(users, &user)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return users, nil
}

func (r *UserRepository) GetByID(id string) (*entity.User, error) {
	return nil, nil
}

func (r *UserRepository) GetByEmail(email string) (*entity.User, error) {
    var user entity.User

    err := r.db.QueryRow(`
        SELECT id, name, email, password, phone, created_at, updated_at 
        FROM users 
        WHERE email = $1
    `, email).Scan(
        &user.ID,
        &user.Name,
        &user.Email,
        &user.Password,
        &user.Phone,
        &user.CreatedAt,
        &user.UpdatedAt,
    )
    
    if err == sql.ErrNoRows {
        return nil, apperrors.ErrUserNotFound
    }
    if err != nil {
        return nil, err
    }
    
    return &user, nil
}

func (r *UserRepository) GetByPhone(phone string) (*entity.User, error) {
    var user entity.User

    err := r.db.QueryRow(`
        SELECT id, name, email, password, phone, created_at, updated_at 
        FROM users 
        WHERE phone = $1
    `, phone).Scan(
        &user.ID,
        &user.Name,
        &user.Email,
        &user.Password,
        &user.Phone,
        &user.CreatedAt,
        &user.UpdatedAt,
    )
    
    if err == sql.ErrNoRows {
        return nil, apperrors.ErrUserNotFound
    }
    if err != nil {
        return nil, err
    }
    
    return &user, nil
}

func (r *UserRepository) Update(user *entity.User) error {
	return nil
}

func (r *UserRepository) Delete(id string) error {
	return nil
}