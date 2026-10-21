# Backend - Sistema de Escalas para Igreja

API REST desenvolvida em Go seguindo os princípios de Clean Architecture.

## 🚀 Tecnologias

- **Go 1.24**
- **Chi Router** - Roteamento HTTP leve e idiomático
- **PostgreSQL**

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

```env
# API
API_HOST=localhost
API_PORT=8080

# Database
DB_HOST=localhost
DB_PORT=5436
DB_USER=postgres
DB_PASS=postgres
DB_NAME=mjcp

# CORS
CORS_ALLOWED_ORIGINS=
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
