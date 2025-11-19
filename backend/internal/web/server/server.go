package server

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

type Server struct {
	router *chi.Mux
	server *http.Server
	port   string
}

func NewServer(port string) *Server {
	return &Server{
		router: chi.NewRouter(),
		port:   port,
	}
}

func (s *Server) ConfigureRoutes() {
	// Middlewares
	s.router.Use(middleware.Logger)
	s.router.Use(middleware.Recoverer)
	s.router.Use(middleware.SetHeader("Content-Type", "application/json"))

	// Handlers
	// userHandler := handler.NewUserHandler()
	// scheduleHandler := handler.NewScheduleHandler()

	// Rotas
	// s.router.Get("/health", healthCheck)
	// s.router.Post("/user", userHandler.Create)
	// s.router.Get("/user", userHandler.GetAll)
	// s.router.Post("/schedules", scheduleHandler.Create)
}

func healthCheck(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func (s *Server) Start() error {
	s.server = &http.Server{
		Addr:    ":" + s.port,
		Handler: s.router,
	}
	return s.server.ListenAndServe()
}
