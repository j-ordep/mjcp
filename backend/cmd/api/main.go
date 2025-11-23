package main

import (
	"log/slog"

	"github.com/j-ordep/mjcp/backend/config"
	"github.com/j-ordep/mjcp/backend/internal/infra/auth"
	"github.com/j-ordep/mjcp/backend/internal/infra/db"
	"github.com/j-ordep/mjcp/backend/internal/repositories"
	"github.com/j-ordep/mjcp/backend/internal/service"
	"github.com/j-ordep/mjcp/backend/internal/web/server"
	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		slog.Warn("cannot load .env", "error", err.Error())
	}
	config.LoadEnv()

	db, err := db.NewConnect()
	if err != nil {
		slog.Error("Failed to connect to database", "error", err)
		return
	}
	defer db.Close()

	userRepository := repositories.NewUserRepository(db)
	userService := service.NewUserService(userRepository)

	passwordResetTokenRepository := repositories.NewPasswordResetTokenRepository(db)
	emailService := auth.NewEmailService()
	authService := service.NewAuthService(
		userRepository,
		passwordResetTokenRepository,
		emailService,
		config.Config.BaseURL,
	)

	srv := server.NewServer(config.Config.APIPort, userService, authService)
	srv.ConfigureRoutes()

	slog.Info("Starting server", "port", config.Config.APIPort)

	if err := srv.Start(); err != nil {
		slog.Error("Failed to start server", "error", err)
	}
}
