# Web - Sistema de Escalas para Igreja

Aplicação web desenvolvida em Next.js para gerenciamento de escalas, voluntários e ministérios da igreja.

## 📁 Estrutura do Projeto

```
web/
├── src/
│   ├── app/                     # App Router (Next.js 13+)
│   │   ├── layout.tsx           # Layout principal
│   │   ├── page.tsx             # Página inicial
│   │   ├── volunteers/          # Páginas de voluntários
│   │   ├── schedules/           # Páginas de escalas
│   │   └── ministries/          # Páginas de ministérios
│   ├── components/              # Componentes React
│   │   ├── common/              # Componentes comuns
│   │   │   ├── Button/
│   │   │   ├── Card/
│   │   │   └── Layout/
│   │   └── features/            # Componentes por feature
│   │       ├── volunteers/
│   │       ├── schedules/
│   │       └── ministries/
│   ├── lib/                     # Utilitários e configurações
│   │   ├── api/                 # Cliente API
│   │   └── utils/               # Funções utilitárias
│   └── styles/                  # Estilos globais
├── public/                      # Assets estáticos
└── tests/                       # Testes
```

## 🏗️ Arquitetura

### Next.js App Router
Utiliza o novo App Router do Next.js 13+ com:
- Server Components por padrão
- Layouts compartilhados
- Loading e error states
- Streaming e Suspense

### Organização de Componentes

```
components/
  common/                # Componentes reutilizáveis
    Button/
      Button.tsx
      Button.test.tsx
      index.ts
  features/              # Componentes específicos por feature
    volunteers/
      VolunteerList/
      VolunteerForm/
```

### Rotas e Páginas

```
app/
  layout.tsx              # Layout raiz
  page.tsx                # Homepage
  volunteers/
    page.tsx              # Lista de voluntários
    [id]/
      page.tsx            # Detalhes do voluntário
  schedules/
    page.tsx              # Lista de escalas
    new/
      page.tsx            # Nova escala
```

## 🎯 Princípios e Boas Práticas

### Server Components
- Usar Server Components quando possível
- Client Components apenas quando necessário (interatividade)
- Buscar dados no servidor

### Code Organization
- Um componente por arquivo
- Exports nomeados para componentes
- Index.ts para exports públicos
- Testes ao lado dos componentes

### Type Safety
- TypeScript em todo o projeto
- Tipos para props de componentes
- Tipos para responses da API
- Validação de dados

## 📱 Features Principais

### 1. Dashboard
- Visão geral de escalas
- Estatísticas de voluntários
- Próximos eventos

### 2. Volunteers (Voluntários)
- Listagem com filtros e busca
- Cadastro e edição
- Gerenciamento de disponibilidade
- Histórico de participações

### 3. Schedules (Escalas)
- Calendário de escalas
- Criação de escalas
- Atribuição de voluntários
- Visualização por ministério

### 4. Ministries (Ministérios)
- Gerenciamento de ministérios
- Voluntários por ministério
- Estatísticas

## 🧪 Testes

### Estrutura de Testes
```
tests/
├── unit/              # Testes unitários
│   ├── components/
│   └── utils/
├── integration/       # Testes de integração
└── e2e/              # Testes end-to-end
```

### Ferramentas Sugeridas
- **Jest**: Framework de testes
- **React Testing Library**: Testes de componentes
- **Playwright**: Testes E2E
- **MSW**: Mock de API

### Executar Testes
```bash
# Todos os testes
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage

# E2E
npm run test:e2e
```

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+
- npm ou yarn

### Desenvolvimento
```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev

# Build para produção
npm run build

# Executar build de produção
npm start
```

Acessar: http://localhost:3000

## 📦 Dependências Principais

### Atuais
- **Next.js 14**: Framework React
- **React 18**: Biblioteca UI
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first CSS

### Futuras (Sugestões)
- **React Query**: Data fetching e cache
- **Zustand/Jotai**: State management
- **React Hook Form**: Formulários
- **Zod**: Validação de schemas
- **date-fns**: Manipulação de datas
- **Recharts**: Gráficos e visualizações
- **next-auth**: Autenticação

## 🎨 Estilização

### Tailwind CSS
- Utility-first approach
- Componentes consistentes
- Dark mode support
- Responsive design

### Design System
```typescript
// Cores
primary: blue
secondary: gray
success: green
error: red

// Espaçamentos
spacing: [4, 8, 16, 24, 32, ...]

// Tipografia
heading: font-bold text-2xl
body: font-normal text-base
```

## 🔄 Organização Futura

### Fase 1 - MVP
- Autenticação e autorização
- CRUD de voluntários
- Visualização de escalas
- Dashboard básico

### Fase 2 - Funcionalidades Avançadas
- Sistema de notificações
- Exportação de relatórios
- Busca avançada
- Filtros dinâmicos

### Fase 3 - Otimizações
- PWA (Progressive Web App)
- Offline support
- Analytics
- Performance optimization
- SEO optimization

## 🔐 Segurança

- Autenticação JWT
- CSRF protection
- XSS prevention
- Input sanitization
- Rate limiting
- HTTPS obrigatório

## 📊 Performance

### Otimizações
- Image optimization (next/image)
- Code splitting automático
- Static generation quando possível
- Incremental Static Regeneration (ISR)
- Edge caching

### Métricas
- Core Web Vitals
- Lighthouse score
- Bundle size monitoring

## 📝 Convenções de Código

### Nomenclatura
- Componentes: `PascalCase`
- Funções/variáveis: `camelCase`
- Arquivos de componentes: `PascalCase.tsx`
- Utilitários: `camelCase.ts`
- Constantes: `UPPER_CASE`

### Estrutura de Componentes
```typescript
// Imports
import { FC } from 'react';

// Types
interface ButtonProps {
  label: string;
  onClick: () => void;
}

// Component
export const Button: FC<ButtonProps> = ({ label, onClick }) => {
  return <button onClick={onClick}>{label}</button>;
};
```

### Git Commits
- Mensagens claras e descritivas
- Prefixos: feat, fix, refactor, docs, test, chore
- Referência a issues quando aplicável

## 🌐 API Integration

### Client API
```typescript
// lib/api/client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchVolunteers() {
  const response = await fetch(`${API_BASE_URL}/volunteers`);
  return response.json();
}
```

### Error Handling
- Try/catch em todas as chamadas
- Feedback visual de erros
- Retry logic quando apropriado
- Logging de erros

## 🔍 SEO

- Meta tags dinâmicas
- Open Graph tags
- Sitemap automático
- robots.txt
- Structured data
