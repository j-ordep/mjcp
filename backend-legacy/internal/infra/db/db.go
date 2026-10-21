package db

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/j-ordep/mjcp/backend/config"
	_ "github.com/lib/pq"
)

func NewConnect() (*sql.DB, error) {
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		config.Config.DBHost,
		config.Config.DBPort,
		config.Config.DBUser,
		config.Config.DBPassword,
		config.Config.DBName,
	)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	if err = db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return db, nil
}
