package main

import (
	"log/slog"

	"github.com/j-ordep/mjcp/backend/config"
	"github.com/j-ordep/mjcp/backend/db"
	"github.com/j-ordep/mjcp/backend/internal/application/usecases"
	"github.com/j-ordep/mjcp/backend/internal/server"
	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		slog.Warn("cannot load .env", "error", err.Error())
	}
	config.LoadEnv()

	// Conectar ao banco
    db, err := db.NewConnect()
    if err != nil {
        slog.Error("Failed to connect to database", "error", err)
        return
    }
    defer db.Close()


	// Inicializar use cases (temporário com nil)
	createVolunteerUC := usecases.NewCreateVolunteerUseCase(nil)
	getVolunteersUC := usecases.NewGetVolunteersUseCase(nil)
	createScheduleUC := usecases.NewCreateScheduleUseCase(nil, nil)

	// Criar servidor
	srv := server.NewServer(createVolunteerUC, getVolunteersUC, createScheduleUC, config.Config.APIPort)

	// Configurar rotas
	srv.ConfigureRoutes()

	// Iniciar servidor
	slog.Info("Starting server", "port", config.Config.APIPort)

	if err := srv.Start(); err != nil {
		slog.Error("Failed to start server", "error", err)
	}
}
