package repositories

import (
	"database/sql"

	"github.com/j-ordep/mjcp/backend/internal/domain/apperrors"
	"github.com/j-ordep/mjcp/backend/internal/domain/entity"
)

type PasswordResetTokenRepository struct {
	db *sql.DB
}

func NewPasswordResetTokenRepository(db *sql.DB) *PasswordResetTokenRepository {
	return &PasswordResetTokenRepository{db: db}
}

func (r *PasswordResetTokenRepository) Create(token *entity.PasswordResetToken) error {
	stmt, err := r.db.Prepare(`
		INSERT INTO password_reset_tokens (id, user_id, token, expires_at, used, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)
	`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	_, err = stmt.Exec(
		token.ID,
		token.UserID,
		token.Token,
		token.ExpiresAt,
		token.Used,
		token.CreatedAt,
	)
	if err != nil {
		return err
	}

	return nil
}

func (r *PasswordResetTokenRepository) GetByToken(token string) (*entity.PasswordResetToken, error) {
	var resetToken entity.PasswordResetToken

	err := r.db.QueryRow(`
		SELECT id, user_id, token, expires_at, used, created_at
		FROM password_reset_tokens
		WHERE token = $1
	`, token).Scan(
		&resetToken.ID,
		&resetToken.UserID,
		&resetToken.Token,
		&resetToken.ExpiresAt,
		&resetToken.Used,
		&resetToken.CreatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, apperrors.ErrInvalidToken
	}
	if err != nil {
		return nil, err
	}

	return &resetToken, nil
}

func (r *PasswordResetTokenRepository) MarkAsUsed(token string) error {
	stmt, err := r.db.Prepare(`
		UPDATE password_reset_tokens
		SET used = TRUE
		WHERE token = $1
	`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	_, err = stmt.Exec(token)
	return err
}

func (r *PasswordResetTokenRepository) DeleteExpiredTokens() error {
	_, err := r.db.Exec(`
		DELETE FROM password_reset_tokens
		WHERE expires_at < NOW() OR used = TRUE
	`)
	return err
}
