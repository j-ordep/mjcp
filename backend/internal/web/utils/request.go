package utils

import "net/http"

// ExtractSearchFilters extrai os filtros permitidos dos query parameters
// Retorna um map com os filtros encontrados (name, email, phone)
func ExtractSearchFilters(r *http.Request) map[string]string {
	allowedFilters := []string{"name", "email", "phone"}
	filters := make(map[string]string)
	query := r.URL.Query()

	for _, key := range allowedFilters {
		if value := query.Get(key); value != "" {
			filters[key] = value
		}
	}

	return filters
}
