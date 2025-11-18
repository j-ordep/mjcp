package server

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/j-ordep/mjcp/backend/internal/application/usecases"
	"github.com/j-ordep/mjcp/backend/internal/web/handlers"
)

type Server struct {
	router            *chi.Mux
	server            *http.Server
	port              string
	createVolunteerUC *usecases.CreateVolunteerUseCase
	getVolunteersUC   *usecases.GetVolunteersUseCase
	createScheduleUC  *usecases.CreateScheduleUseCase
}

func NewServer(
	createVolunteerUC *usecases.CreateVolunteerUseCase,
	getVolunteersUC *usecases.GetVolunteersUseCase,
	createScheduleUC *usecases.CreateScheduleUseCase,
	port string,
) *Server {
	return &Server{
		router:            chi.NewRouter(),
		createVolunteerUC: createVolunteerUC,
		getVolunteersUC:   getVolunteersUC,
		createScheduleUC:  createScheduleUC,
		port:              port,
	}
}

func (s *Server) ConfigureRoutes() {
	// Middlewares
	s.router.Use(middleware.Logger)
	s.router.Use(middleware.Recoverer)
	s.router.Use(middleware.SetHeader("Content-Type", "application/json"))

	// Handlers
	volunteerHandler := handlers.NewVolunteerHandler(s.createVolunteerUC, s.getVolunteersUC)
	scheduleHandler := handlers.NewScheduleHandler(s.createScheduleUC)

	// Rotas
	s.router.Get("/health", healthCheck)
	s.router.Post("/volunteers", volunteerHandler.Create)
	s.router.Get("/volunteers", volunteerHandler.GetAll)
	s.router.Post("/schedules", scheduleHandler.Create)
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
