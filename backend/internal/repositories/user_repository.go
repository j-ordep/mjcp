package repositories

import (
	"database/sql"
	"fmt"

	"github.com/j-ordep/mjcp/backend/internal/domain/apperrors"
	"github.com/j-ordep/mjcp/backend/internal/domain/entity"
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
	var user entity.User

	err := r.db.QueryRow(`
		SELECT id, name, email, password, phone, created_at, updated_at 
		FROM users 
		WHERE id = $1
	`, id).Scan(
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

func (r *UserRepository) Search(filters map[string]string) ([]*entity.User, error) {
	query := `SELECT id, name, email, password, phone, created_at, updated_at FROM users WHERE 1=1`
	var args []interface{}
	argIndex := 1

	if name, ok := filters["name"]; ok && name != "" {
		query += fmt.Sprintf(` AND name ILIKE $%d`, argIndex)
		args = append(args, "%"+name+"%")
		argIndex++
	}

	if email, ok := filters["email"]; ok && email != "" {
		query += fmt.Sprintf(` AND email ILIKE $%d`, argIndex)
		args = append(args, "%"+email+"%")
		argIndex++
	}

	if phone, ok := filters["phone"]; ok && phone != "" {
		query += fmt.Sprintf(` AND phone ILIKE $%d`, argIndex)
		args = append(args, "%"+phone+"%")
		argIndex++
	}

	rows, err := r.db.Query(query, args...)
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

func (r *UserRepository) Update(user *entity.User) error {
	stmt, err := r.db.Prepare(`
		UPDATE users 
		SET name = $1, email = $2, phone = $3, updated_at = $4
		WHERE id = $5
	`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	result, err := stmt.Exec(
		user.Name,
		user.Email,
		user.Phone,
		user.UpdatedAt,
		user.ID,
	)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return apperrors.ErrUserNotFound
	}

	return nil
}

func (r *UserRepository) Delete(id string) error {
	stmt, err := r.db.Prepare(`DELETE FROM users WHERE id = $1`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	result, err := stmt.Exec(id)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return apperrors.ErrUserNotFound
	}

	return nil
}
