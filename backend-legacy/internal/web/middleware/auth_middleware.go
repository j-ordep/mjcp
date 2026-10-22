package middleware

import (
	"net/http"
	"strings"

	"github.com/j-ordep/mjcp/backend/internal/infra/auth"
)

func Authenticate(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        authHeader := r.Header.Get("Authorization")
        if authHeader == "" {
            http.Error(w, "missing authorization header", http.StatusUnauthorized)
            return
        }

        token := strings.TrimPrefix(authHeader, "Bearer ")
        if token == authHeader {
            http.Error(w, "invalid authorization format", http.StatusUnauthorized)
            return
        }

        _, err := auth.VerifyToken(token)
        if err != nil {
            http.Error(w, "invalid or expired token", http.StatusUnauthorized)
            return
        }

        next.ServeHTTP(w, r)
    })
}