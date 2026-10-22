package server

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/j-ordep/mjcp/backend/internal/service"
	"github.com/j-ordep/mjcp/backend/internal/web/handler"
	mw "github.com/j-ordep/mjcp/backend/internal/web/middleware"
)

type Server struct {
	router      *chi.Mux
	server      *http.Server
	port        string
	userService *service.UserService
	authService *service.AuthService
}

func NewServer(port string, userService *service.UserService, authService *service.AuthService) *Server {
	return &Server{
		router:      chi.NewRouter(),
		port:        port,
		userService: userService,
		authService: authService,
	}
}

func (s *Server) ConfigureRoutes() {
	s.router.Use(middleware.Logger)
	s.router.Use(middleware.Recoverer)
	s.router.Use(middleware.SetHeader("Content-Type", "application/json"))

	userHandler := handler.NewUserHandler(s.userService)
	authHandler := handler.NewAuthHandler(s.authService)

	s.router.Get("/health", healthCheck)
	s.router.Post("/user", userHandler.Create)
	s.router.Post("/login", userHandler.Login)
	s.router.Post("/auth/forgot-password", authHandler.ForgotPassword)
	s.router.Post("/auth/reset-password", authHandler.ResetPassword)

	s.router.Group(func(r chi.Router) {
		r.Use(mw.Authenticate)
		r.Get("/users", userHandler.GetAll)
		r.Get("/user", userHandler.Search)
		r.Get("/user/{id}", userHandler.GetByID)
		r.Put("/user/{id}", userHandler.Update)
		r.Patch("/user/{id}/phone", userHandler.UpdatePhone)
		r.Delete("/user/{id}", userHandler.Delete)
	})
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
