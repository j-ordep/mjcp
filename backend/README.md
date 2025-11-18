# Backend - Sistema de Escalas para Igreja

API REST desenvolvida em Go seguindo os princípios de Clean Architecture.

## 🚀 Tecnologias

- **Go 1.24**
- **Chi Router** - Roteamento HTTP leve e idiomático
- **PostgreSQL** - Banco de dados relacional
- **godotenv** - Gerenciamento de variáveis de ambiente

## 📁 Estrutura do Projeto

```
backend/
├── cmd/
│   └── api/
│       └── main.go           # Ponto de entrada da aplicação
├── config/
│   └── config.go             # Configurações e variáveis de ambiente
├── db/
│   └── db.go                 # Conexão e pool de banco de dados
├── internal/
│   ├── domain/
│   │   ├── entities/         # Entidades de negócio
│   │   └── repository/       # Interfaces de repositórios
│   ├── dto/                  # Data Transfer Objects
│   ├── repository/           # Implementações de repositórios
│   ├── service/              # Lógica de negócio e casos de uso
│   └── web/
│       ├── handlers/         # Handlers HTTP (controllers)
│       └── server/           # Configuração do servidor HTTP
├── .env                      # Variáveis de ambiente (não commitar)
├── go.mod
└── README.md
```

## 🏗️ Arquitetura

### Camadas da Aplicação

**Domain (Domínio)**
- Entidades de negócio puras
- Interfaces de repositórios
- Sem dependências externas

**Service (Serviço)**
- Casos de uso e regras de negócio
- Orquestração entre repositórios
- Validações de domínio

**Repository (Repositório)**
- Implementação de acesso a dados
- Queries SQL
- Mapeamento objeto-relacional

**Web (Apresentação)**
- Handlers HTTP
- Roteamento
- Middlewares
- Serialização JSON

### Entidades Principais

- **User**: Voluntário da igreja
- **Ministry**: Ministério (louvor, som, mídia, etc.)
- **UserMinistry**: Relacionamento usuário-ministério
- **Role**: Papéis (Membro, Líder, Professor)
- **MinistryRoleAssignment**: Atribuição de papéis em ministérios
- **Schedule**: Escala para um evento
- **Availability**: Disponibilidade do voluntário
- **Assignment**: Vinculação de usuário a uma escala

## ⚙️ Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# API
API_HOST=localhost
API_PORT=8080

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=senha
DB_NAME=mjcp

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

### Sistema de Configuração

O sistema utiliza um loader automático de variáveis de ambiente com:
- ✅ Validação de campos obrigatórios
- ✅ Valores padrão
- ✅ Marcação de campos sensíveis
- ✅ Type-safe com struct tipada

## 🚀 Como Executar

### Pré-requisitos
- Go 1.24+
- PostgreSQL 14+

### Instalação

```bash
# Clonar repositório
git clone https://github.com/j-ordep/mjcp.git
cd mjcp/backend

# Instalar dependências
go mod download

# Configurar .env
cp .env.example .env
# Editar .env com suas configurações

# Executar aplicação
go run cmd/api/main.go
```

### Desenvolvimento

```bash
# Executar com hot reload (usar air ou similar)
air

# Executar testes
go test ./...

# Formatar código
go fmt ./...

# Verificar imports
goimports -w .
```

## 📡 API Endpoints

### Health Check
```
GET /health
```

### Usuários
```
POST /user           # Criar usuário
GET  /user           # Listar todos os usuários
```

### Escalas
```
POST /schedules      # Criar escala
```

## 🗄️ Banco de Dados

### Pool de Conexões

Configurações otimizadas:
- **MaxOpenConns**: 25 conexões simultâneas
- **MaxIdleConns**: 5 conexões idle
- **ConnMaxLifetime**: 5 minutos

### Migrations

(A implementar - sugestão: golang-migrate ou goose)

## 🔐 Segurança

- [ ] Autenticação JWT (planejado)
- [x] CORS configurável
- [x] Validação de inputs via DTOs
- [x] Prepared statements (proteção SQL injection)
- [x] Middleware de recuperação de panic
- [ ] Rate limiting (planejado)

## 🧪 Testes

```bash
# Executar todos os testes
go test ./...

# Com coverage
go test ./... -coverprofile=coverage.out
go tool cover -html=coverage.out

# Testes de uma camada específica
go test ./internal/service/...
```

## 📦 Dependências

```go
require (
    github.com/go-chi/chi/v5 v5.2.3      // Router HTTP
    github.com/joho/godotenv v1.5.1      // Carregar .env
    github.com/lib/pq v1.10.9            // Driver PostgreSQL
)
```

## 🛠️ Ferramentas Recomendadas

- **Air**: Hot reload para desenvolvimento
- **golangci-lint**: Linter completo
- **sqlc**: Geração de código SQL type-safe
- **testify**: Biblioteca de asserções para testes

## 🎯 Roadmap

### ✅ Fase 1 - Fundação
- [x] Estrutura base do projeto
- [x] Servidor HTTP com Chi
- [x] Conexão com PostgreSQL
- [x] Sistema de configuração
- [x] Entidades de domínio

### 🔄 Fase 2 - Features Core
- [ ] CRUD completo de usuários
- [ ] CRUD de ministérios
- [ ] Sistema de disponibilidade
- [ ] Criação e gerenciamento de escalas
- [ ] Atribuição de papéis

### 📋 Fase 3 - Avançado
- [ ] Autenticação e autorização
- [ ] Notificações (email/push)
- [ ] Relatórios e estatísticas
- [ ] Histórico de escalas
- [ ] Dashboard administrativo

## 📝 Convenções de Código

- Código em inglês
- Comentários de negócio em português
- Seguir [Effective Go](https://go.dev/doc/effective_go)
- Usar `gofmt` e `goimports`
- Handlers retornam `error` quando apropriado
- DTOs para entrada/saída de dados

## 📄 Licença

[Definir licença]

## 👥 Contribuindo

[Definir guia de contribuição]
