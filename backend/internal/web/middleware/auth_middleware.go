package middleware

import (
	"net/http"
)

type AuthMiddleware struct {
	
}

func NewAuthMiddleware() *AuthMiddleware {
	return &AuthMiddleware{}
}

func (m *AuthMiddleware) Authenticate(next http.Handler) http.Handler {
	return  http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		apiKey := r.Header.Get("X-API-KEY")
		if apiKey == "" {
			http.Error(w, "X-API-KEY is required", http.StatusUnauthorized)
			return 
		}

		// _, err := m.accountService.FindByAPIKey(apiKey)
		// if err != nil {
		// 	if err == domain.ErrUnauthorizedAccess {
		// 		http.Error(w, err.Error(), http.StatusUnauthorized)
		// 		return 
		// 	}

		// 	http.Error(w, err.Error(), http.StatusInternalServerError)
		// 	return 
		// }
		next.ServeHTTP(w, r)
	})
}