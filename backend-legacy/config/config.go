package config

import (
	"errors"
	"log/slog"
	"os"
	"reflect"
	"strings"
)

type CFG struct {
	CORS_ALLOWED_ORIGINS string `env:"CORS_ALLOWED_ORIGINS"`

	APIHost string `env:"API_HOST,default=,sensitive=true"`
	APIPort string `env:"API_PORT,default=8080,required=true,sensitive=true"`
	BaseURL string `env:"BASE_URL,default=http://localhost:8080"`

	DBHost     string `env:"DB_HOST"`
	DBPort     string `env:"DB_PORT"`
	DBUser     string `env:"DB_USER"`
	DBPassword string `env:"DB_PASSWORD,sensitive=true"`
	DBName     string `env:"DB_NAME"`

	JwtSecret string `env:"JWT_SECRET"`

	KcClientID string `env:"KC_CLIENT_ID"`
	KcBaseURL  string `env:"KC_BASE_URL"`
	KcRealm    string `env:"KC_REALM"`
	KcSecret   string `env:"KC_SECRET,sensitive=true"`
}

var Config CFG

var ErrEnvVarNotFound = errors.New("required environment variable not found")

type tag struct {
	Name        string
	IsSensitive bool
	HasDefault  bool
	Default     string
	Required    bool
}

func parseTag(tagData string, tag *tag) {
	pairs := strings.Split(tagData, ",")
	for _, pair := range pairs {
		if strings.HasPrefix(pair, "default=") {
			tag.HasDefault = true
			tag.Default = strings.ReplaceAll(pair, "default=", "")
		} else if strings.HasPrefix(pair, "sensitive=") {
			sensitiveValue := strings.ReplaceAll(pair, "sensitive=", "")
			if sensitiveValue == "true" {
				tag.IsSensitive = true
			}
		} else if strings.HasPrefix(pair, "required=") {
			requiredValue := strings.ReplaceAll(pair, "required=", "")
			if requiredValue == "true" {
				tag.Required = true
			}
		} else {
			tag.Name = pair
		}
	}
}

func iterFields(iter func(int, *tag)) {
	t := reflect.TypeOf(Config)
	for i := range t.NumField() {
		field := t.Field(i)
		env, found := field.Tag.Lookup("env")
		if !found {
			continue
		}

		var tag tag
		parseTag(env, &tag)
		iter(i, &tag)
	}
}

func LoadEnv() {
	v := reflect.ValueOf(&Config).Elem()
	iterFields(func(i int, tag *tag) {
		envValue := tag.Default
		if actualEnvValue, valueFound := os.LookupEnv(tag.Name); valueFound {
			envValue = actualEnvValue
		} else if tag.Required && !tag.HasDefault {
			slog.Warn("required enviroment variable not found", "variable", tag.Name)
			panic(ErrEnvVarNotFound)
		}

		if !tag.IsSensitive {
			slog.Info("loading environment variable", "variable", tag.Name, "value", envValue)
		}

		if envValue != "" {
			v.Field(i).SetString(envValue)
		}
	})
}

func Public() map[string]string {
	result := map[string]string{}

	v := reflect.ValueOf(&Config).Elem()
	iterFields(func(i int, t *tag) {
		if !t.IsSensitive {
			field := reflect.TypeOf(Config).Field(i)
			result[t.Name] = v.FieldByName(field.Name).String()
		}
	})

	return result
}
