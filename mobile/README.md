# Mobile - Sistema de Escalas para Igreja

Aplicativo mobile desenvolvido em Flutter para gerenciamento de escalas, voluntários e ministérios da igreja.

## 📁 Estrutura do Projeto

```
mobile/
├── lib/
│   ├── core/                    # Núcleo da aplicação
│   │   ├── constants/           # Constantes (cores, strings, endpoints)
│   │   ├── theme/               # Tema do app (cores, estilos)
│   │   └── utils/               # Utilitários e helpers
│   ├── features/                # Funcionalidades por módulo
│   │   ├── volunteers/          # Feature de voluntários
│   │   │   ├── models/
│   │   │   ├── screens/
│   │   │   ├── widgets/
│   │   │   └── services/
│   │   ├── schedules/           # Feature de escalas
│   │   └── ministries/          # Feature de ministérios
│   └── shared/                  # Componentes compartilhados
│       ├── models/              # Models compartilhados
│       ├── widgets/             # Widgets reutilizáveis
│       └── services/            # Serviços compartilhados (API, auth)
├── test/                        # Testes
├── assets/                      # Assets (imagens, fontes)
└── pubspec.yaml                 # Dependências
```

## 🏗️ Arquitetura

### Feature-First Organization
Cada feature é organizada em módulos independentes:

```
features/
  volunteers/
    ├── models/           # Models específicos
    ├── screens/          # Telas da feature
    ├── widgets/          # Widgets específicos
    └── services/         # Serviços/repositories
```

### Camadas por Feature

1. **Models**: Representação de dados
2. **Screens**: Telas completas
3. **Widgets**: Componentes de UI reutilizáveis da feature
4. **Services**: Lógica de negócio e comunicação com API

## 🎯 Princípios e Boas Práticas

### State Management
- **Provider** para gerenciamento de estado
- Separação clara entre UI e lógica de negócio
- ChangeNotifier para models reativos

### Estrutura de Features
Cada feature deve ser independente e conter:
- Models específicos
- Telas e widgets
- Serviços de comunicação com backend
- Testes unitários

### Widgets Compartilhados
Componentes reutilizáveis em `shared/widgets/`:
- Botões customizados
- Cards
- Loading indicators
- Dialogs
- etc.

## 📱 Features Principais

### 1. Volunteers (Voluntários)
- Listagem de voluntários
- Cadastro/edição de voluntários
- Visualização de detalhes
- Gerenciamento de disponibilidade

### 2. Schedules (Escalas)
- Visualização de escalas por data
- Criação de novas escalas
- Atribuição de voluntários
- Calendário de escalas

### 3. Ministries (Ministérios)
- Listagem de ministérios
- Gerenciamento de ministérios
- Voluntários por ministério

## 🧪 Testes

### Estrutura de Testes
```
test/
├── unit/              # Testes unitários
│   ├── models/
│   └── services/
├── widget/            # Testes de widgets
└── integration/       # Testes de integração
```

### Tipos de Testes
- **Unit Tests**: Testes de models e services
- **Widget Tests**: Testes de componentes de UI
- **Integration Tests**: Testes end-to-end

### Executar Testes
```bash
# Todos os testes
flutter test

# Com coverage
flutter test --coverage

# Testes específicos
flutter test test/unit/models/
```

## 🚀 Como Executar

### Pré-requisitos
- Flutter SDK 3.0+
- Android Studio / Xcode
- Dispositivo físico ou emulador

### Desenvolvimento
```bash
# Instalar dependências
flutter pub get

# Executar em modo debug
flutter run

# Executar em dispositivo específico
flutter run -d <device_id>

# Build para produção
flutter build apk        # Android
flutter build ios        # iOS
```

## 📦 Dependências Principais

### Atuais
- **provider**: State management
- **http**: Cliente HTTP
- **shared_preferences**: Armazenamento local

### Futuras (Sugestões)
- **flutter_bloc**: State management alternativo
- **dio**: Cliente HTTP avançado
- **cached_network_image**: Cache de imagens
- **flutter_secure_storage**: Armazenamento seguro (tokens)
- **go_router**: Navegação declarativa
- **freezed**: Geração de models imutáveis
- **json_serializable**: Serialização JSON

## 🎨 Design System

### Tema
- Cores primárias e secundárias
- Tipografia consistente
- Espaçamentos padronizados
- Componentes reutilizáveis

### Acessibilidade
- Contraste adequado
- Tamanhos de fonte ajustáveis
- Navegação por teclado
- Screen readers

## 🔄 Organização Futura

### Fase 1 - MVP
- Tela de login
- Listagem de voluntários
- Visualização de escalas
- Perfil do usuário

### Fase 2 - Funcionalidades Avançadas
- Notificações push
- Modo offline
- Sincronização de dados
- Tema escuro

### Fase 3 - Otimizações
- Animações
- Performance optimization
- Internacionalização (i18n)
- Analytics

## 🔐 Segurança

- Armazenamento seguro de tokens
- HTTPS obrigatório
- Validação de inputs
- Tratamento de erros
- Timeout de sessão

## 📝 Convenções de Código

### Nomenclatura
- Classes: `PascalCase`
- Variáveis/funções: `camelCase`
- Arquivos: `snake_case`
- Constantes: `UPPER_CASE`

### Formatação
- Usar `flutter format`
- Seguir Dart style guide
- Lint com `flutter_lints`

### Commits
- Mensagens claras e descritivas
- Prefixos: feat, fix, refactor, docs, test
