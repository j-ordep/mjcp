# MJCP - Sistema de Escalas para Igreja

Plataforma completa para organizar escalas, ministérios e disponibilidade de voluntários na igreja. Arquitetura em monorepo com backend em Go, mobile em React Native e web em Next.js.

## 📋 Sobre o Projeto

O MJCP (Ministério Jesus Cristo Presente) é um sistema desenvolvido para facilitar o gerenciamento de escalas de voluntários em igrejas. O sistema permite:

- 📝 Cadastro e gerenciamento de voluntários
- 🎯 Organização de ministérios
- 📅 Criação e visualização de escalas
- ✅ Controle de disponibilidade dos voluntários
- 📊 Relatórios e estatísticas

## 🏗️ Arquitetura - Monorepo

Este projeto utiliza uma arquitetura de monorepo, contendo 3 aplicações principais:

```
mjcp/
├── backend/          # API REST em Go com Clean Architecture
├── mobile/           # App mobile em React Native (Expo)
├── web/              # Aplicação web em Next.js
└── README.md         # Este arquivo
```

### Backend (Go + Clean Architecture)
- **Tecnologia**: Go 1.21+
- **Framework**: Gin
- **Arquitetura**: Clean Architecture
- **Banco de Dados**: PostgreSQL (sugerido)

[Ver documentação completa do backend →](./backend/README.md)

### Mobile (React Native)
- **Tecnologia**: React Native + Expo
- **State Management**: React Context/Provider
- **Navegação**: React Navigation
- **UI**: React Native Paper, NativeWind (Tailwind para RN)
- **Arquitetura**: Organização por features

[Ver documentação completa do mobile →](./mobile/README.md)

### Web (Next.js)
- **Tecnologia**: Next.js 14 + React 18
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS
- **Arquitetura**: App Router (Next.js 13+)

[Ver documentação completa do web →](./web/README.md)

## 🎯 Clean Architecture - Visão Geral

O backend segue os princípios de Clean Architecture, garantindo:

### Camadas da Arquitetura

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│      (Handlers HTTP/REST API)           │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│        Application Layer                │
│         (Use Cases)                     │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│          Domain Layer                   │
│    (Entities + Repository Interfaces)   │
└─────────────────────────────────────────┘
                  ↑
┌─────────────────────────────────────────┐
│       Infrastructure Layer              │
│  (Database, HTTP Clients, External APIs)│
└─────────────────────────────────────────┘
```

### Princípios Fundamentais

1. **Dependency Rule**: As dependências apontam sempre para dentro
2. **Separation of Concerns**: Cada camada tem uma responsabilidade clara
3. **Independence**: Frameworks, UI, DB e serviços externos são detalhes
4. **Testability**: Cada camada pode ser testada independentemente


## 🚀 Como Começar

Consulte os READMEs de cada módulo para instruções detalhadas de instalação, configuração e variáveis de ambiente:

- [Backend](./backend/README.md)
- [Mobile](./mobile/README.md)
- [Web](./web/README.md)

## 📚 Boas Práticas

### Código
- ✅ Seguir convenções de cada linguagem (Go, Dart, TypeScript)
- ✅ Escrever testes para novas funcionalidades
- ✅ Documentar código complexo
- ✅ Manter componentes pequenos e reutilizáveis
- ✅ Usar TypeScript/tipos sempre que possível

### Git
- ✅ Commits semânticos (feat, fix, refactor, docs, test)
- ✅ Branches descritivas
- ✅ Pull requests com descrições claras
- ✅ Code review antes de merge

### Segurança
- ✅ Nunca commitar secrets ou credenciais
- ✅ Usar variáveis de ambiente
- ✅ Validar todos os inputs
- ✅ Implementar autenticação e autorização
- ✅ HTTPS em produção


## 🧪 Testes

Consulte os READMEs de cada módulo para instruções de testes específicas.

## 📦 Estrutura de Dados

### Entidades Principais

- **Volunteer**: Voluntário da igreja
- **Ministry**: Ministério (louvor, som, mídia, etc.)
- **Schedule**: Escala de um evento
- **Event**: Evento da igreja (culto, ensaio, etc.)
- **Availability**: Disponibilidade do voluntário

### Relacionamentos

```
Volunteer ─┬─→ Availability
           └─→ Schedule ←─ Event
                  ↓
              Ministry
```

## 🔄 Roadmap

### Fase 1 - MVP (Atual)
- [x] Estrutura inicial do monorepo
- [x] Clean Architecture no backend
- [x] Estrutura base mobile e web
- [ ] CRUD de voluntários
- [ ] CRUD de ministérios
- [ ] Criação de escalas básicas
- [ ] Autenticação

### Fase 2 - Funcionalidades Avançadas
- [ ] Sistema de disponibilidade
- [ ] Notificações (email/push)
- [ ] Histórico de escalas
- [ ] Relatórios e estatísticas
- [ ] Exportação de dados
- [ ] Filtros avançados

### Fase 3 - Otimizações
- [ ] Cache (Redis)
- [ ] Background jobs
- [ ] PWA (Progressive Web App)
- [ ] Modo offline
- [ ] Analytics
- [ ] Testes E2E


## 🛠️ Tecnologias

### Backend
- Go 1.21+
- Gin (Web Framework)
- PostgreSQL
- JWT

### Mobile
- React Native + Expo
- React Navigation
- React Native Paper
- NativeWind

### Web
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS

## 📖 Documentação Adicional

- [Backend Documentation](./backend/README.md) - Detalhes sobre Clean Architecture, estrutura e API
- [Mobile Documentation](./mobile/README.md) - Guia de desenvolvimento mobile, widgets e features
- [Web Documentation](./web/README.md) - Componentes, rotas e integrações

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Padrões de Código

### Commits Semânticos
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `refactor`: Refatoração de código
- `docs`: Documentação
- `test`: Testes
- `chore`: Tarefas de manutenção

### Nomenclatura
- **Backend (Go)**: `PascalCase` para tipos, `camelCase` para funções
- **Mobile (React Native/TS)**: `PascalCase` para componentes, `camelCase` para funções/variáveis
- **Web (TS/JS)**: `PascalCase` para componentes, `camelCase` para funções


## 🔐 Variáveis de Ambiente

As variáveis de ambiente estão documentadas nos READMEs de cada módulo.

## 📄 Licença

Este projeto é de código aberto para uso em igrejas e organizações religiosas.

## 👥 Autores

- Equipe MJCP

## 🙏 Agradecimentos

Projeto desenvolvido para facilitar o trabalho de coordenadores de ministérios e voluntários em igrejas.

---

**Nota**: Este é um projeto em desenvolvimento ativo. Consulte os READMEs individuais de cada módulo para informações mais detalhadas.
