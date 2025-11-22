package auth

import (
    "fmt"

    "github.com/golang-jwt/jwt/v5"
    "github.com/j-ordep/mjcp/backend/internal/domain/errors"
    "github.com/j-ordep/mjcp/backend/config"
)

func VerifyToken(tokenString string) (jwt.MapClaims, error) {
    token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
        if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
            return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
        }
        return []byte(config.Config.JwtSecret), nil
    })

    if err != nil {
        return nil, errors.ErrInvalidToken
    }

    if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
        return claims, nil
    }

    return nil, errors.ErrInvalidToken
}