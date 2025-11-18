# Backend - Sistema de Escalas para Igreja

API REST desenvolvida em Go seguindo os princípios de Clean Architecture.

## 📁 Estrutura do Projeto

```
backend/
├── cmd/
│   └── api/              # Ponto de entrada da aplicação
│       └── main.go
├── internal/
│   ├── domain/           # Camada de Domínio (Entities)
│   │   ├── entities/     # Entidades de negócio
│   │   └── repositories/ # Interfaces de repositórios
│   ├── application/      # Camada de Aplicação (Use Cases)
│   │   └── usecases/     # Casos de uso/regras de negócio
│   ├── infrastructure/   # Camada de Infraestrutura
│   │   ├── database/     # Implementação de repositórios
│   │   └── http/         # Cliente HTTP, APIs externas
│   └── presentation/     # Camada de Apresentação
│       └── handlers/     # Handlers HTTP (controllers)
├── pkg/                  # Pacotes reutilizáveis
├── configs/              # Arquivos de configuração
└── tests/                # Testes de integração
```

## 🏗️ Clean Architecture - Camadas

### 1. Domain (Domínio)
- **Responsabilidade**: Regras de negócio e entidades
- **Dependências**: Nenhuma (camada mais interna)
- **Conteúdo**:
  - `entities/`: Estruturas de dados do negócio (Volunteer, Schedule, Ministry, etc.)
  - `repositories/`: Interfaces que definem contratos de acesso a dados

### 2. Application (Aplicação)
- **Responsabilidade**: Casos de uso e orquestração de regras de negócio
- **Dependências**: Apenas Domain
- **Conteúdo**:
  - `usecases/`: Implementação de casos de uso (CreateSchedule, AssignVolunteer, etc.)

### 3. Infrastructure (Infraestrutura)
- **Responsabilidade**: Implementações concretas de acesso a dados e serviços externos
- **Dependências**: Domain (implementa interfaces)
- **Conteúdo**:
  - `database/`: Implementação de repositórios (PostgreSQL, MongoDB, etc.)
  - `http/`: Clientes HTTP para APIs externas

### 4. Presentation (Apresentação)
- **Responsabilidade**: Interface com o mundo externo (HTTP/REST)
- **Dependências**: Application e Domain
- **Conteúdo**:
  - `handlers/`: Handlers HTTP que recebem requests e retornam responses

## 🎯 Princípios e Boas Práticas

### Dependency Rule
As dependências apontam sempre para dentro:
```
Presentation → Application → Domain
Infrastructure → Domain
```

### Entidades Principais (Sugestão)
- **Volunteer**: Voluntário da igreja
- **Ministry**: Ministério (louvor, som, mídia, etc.)
- **Schedule**: Escala de um evento
- **Event**: Evento da igreja (culto, ensaio, etc.)
- **Availability**: Disponibilidade do voluntário

### Padrões Recomendados
1. **Repository Pattern**: Abstração de acesso a dados
2. **Dependency Injection**: Injeção de dependências via construtores
3. **DTO (Data Transfer Objects)**: Separação entre entidades de domínio e API
4. **Error Handling**: Erros customizados por camada
5. **Middleware**: Autenticação, logging, CORS

## 🧪 Testes

### Estrutura de Testes
```
- Unit Tests: Cada camada tem seus próprios testes
  - domain/entities/*_test.go
  - application/usecases/*_test.go
  
- Integration Tests: tests/integration/
  - Testes de API end-to-end
  - Testes com banco de dados

- Mocks: tests/mocks/
  - Mocks de repositórios
  - Mocks de serviços externos
```

### Ferramentas Sugeridas
- `testing`: Package nativo do Go
- `testify`: Assertions e mocks
- `gomock`: Geração de mocks
- `httptest`: Testes de handlers HTTP

## 🚀 Como Executar

### Pré-requisitos
- Go 1.21+
- PostgreSQL (ou outro banco de dados)

### Desenvolvimento
```bash
# Instalar dependências
go mod download

# Executar aplicação
go run cmd/api/main.go

# Executar testes
go test ./...

# Executar testes com coverage
go test ./... -coverprofile=coverage.out
go tool cover -html=coverage.out
```

## 📦 Dependências Principais

- **gin-gonic/gin**: Framework web
- **godotenv**: Gerenciamento de variáveis de ambiente
- **sqlx** (futuro): Database toolkit
- **jwt-go** (futuro): Autenticação JWT
- **validator** (futuro): Validação de structs

## 🔄 Organização Futura

### Fase 1 - MVP
- CRUD de voluntários
- CRUD de ministérios
- Criação de escalas básicas

### Fase 2 - Funcionalidades Avançadas
- Sistema de disponibilidade
- Notificações (email/push)
- Histórico de escalas
- Relatórios e estatísticas

### Fase 3 - Otimizações
- Cache com Redis
- Background jobs
- Auditoria e logs
- Métricas e monitoring

## 🔐 Segurança

- Autenticação JWT
- CORS configurado
- Validação de inputs
- SQL injection prevention (prepared statements)
- Rate limiting
- HTTPS obrigatório em produção

## 📝 Convenções de Código

- Nomes em inglês para código
- Comentários em português (documentação de negócio)
- Seguir Go Code Review Comments
- Usar gofmt/goimports
- Lint com golangci-lint
