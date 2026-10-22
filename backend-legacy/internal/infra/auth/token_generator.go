package auth

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/j-ordep/mjcp/backend/config"
)

func GenerateToken(userID, userName, userEmail string) (string, error) {
	secret := config.Config.JwtSecret
	if secret == "" {
		return "", errors.New("missing JWT_SECRET")
	}

	claims := jwt.MapClaims{
		"sub":   userID,
		"name":  userName,
		"email": userEmail,
		"iat":   time.Now().Unix(),
		"exp":   time.Now().Add(time.Hour * 24).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	tokenString, err := token.SignedString([]byte(secret))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}
