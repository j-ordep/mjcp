package main

import (
	"log"

	"github.com/gin-gonic/gin"
)

func main() {
	// Inicializar o router Gin
	r := gin.Default()

	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"service": "mjcp-backend",
		})
	})

	// Grupo de rotas da API v1
	v1 := r.Group("/api/v1")
	{
		// Rotas de voluntários (exemplo)
		// volunteers := v1.Group("/volunteers")
		// {
		//     volunteers.GET("", volunteerHandler.GetAll)
		//     volunteers.POST("", volunteerHandler.Create)
		//     volunteers.GET("/:id", volunteerHandler.GetByID)
		//     volunteers.PUT("/:id", volunteerHandler.Update)
		//     volunteers.DELETE("/:id", volunteerHandler.Delete)
		// }

		// Placeholder para demonstração
		v1.GET("/", func(c *gin.Context) {
			c.JSON(200, gin.H{
				"message": "MJCP API v1",
				"version": "1.0.0",
			})
		})
	}

	// Iniciar servidor
	port := ":8080"
	log.Printf("Server starting on port %s", port)
	if err := r.Run(port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
