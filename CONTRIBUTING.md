# Contribuindo para o MJCP

Obrigado por considerar contribuir com o projeto MJCP! Este documento fornece diretrizes para contribuir com o projeto.

## 🚀 Como Contribuir

### 1. Fork e Clone
```bash
# Fork o repositório no GitHub
# Clone seu fork
git clone https://github.com/seu-usuario/mjcp.git
cd mjcp
```

### 2. Crie uma Branch
```bash
git checkout -b feature/sua-funcionalidade
# ou
git checkout -b fix/correcao-de-bug
```

### 3. Faça suas Alterações
- Siga os padrões de código do projeto
- Adicione testes quando aplicável
- Atualize a documentação se necessário

### 4. Commit
Use commits semânticos:
```bash
git commit -m "feat: adiciona funcionalidade X"
git commit -m "fix: corrige bug Y"
git commit -m "docs: atualiza documentação Z"
```

### 5. Push e Pull Request
```bash
git push origin feature/sua-funcionalidade
```
Abra um Pull Request no GitHub com uma descrição clara.

## 📋 Padrões de Código

### Backend (Go)
- Use `gofmt` e `goimports`
- Siga as convenções do Go
- Escreva testes para novas funcionalidades
- Mantenha a Clean Architecture

### Mobile (Flutter)
- Use `flutter format`
- Siga o Dart style guide
- Widgets devem ser const quando possível
- Organize código por features

### Web (Next.js)
- Use TypeScript
- Siga o ESLint config
- Componentes devem ter tipos bem definidos
- Use Tailwind para estilos

## 🧪 Testes

Execute os testes antes de fazer push:

```bash
# Backend
cd backend && go test ./...

# Mobile
cd mobile && flutter test

# Web
cd web && npm test
```

## 📝 Mensagens de Commit

Prefixos aceitos:
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `refactor`: Refatoração
- `docs`: Documentação
- `test`: Testes
- `chore`: Manutenção
- `style`: Formatação
- `perf`: Performance

Exemplo:
```
feat: adiciona endpoint de criação de escalas
fix: corrige validação de email no cadastro de voluntário
docs: atualiza README com instruções de instalação
```

## 🐛 Reportando Bugs

Ao reportar um bug, inclua:
- Descrição clara do problema
- Passos para reproduzir
- Comportamento esperado vs atual
- Screenshots (se aplicável)
- Ambiente (OS, versões, etc.)

## 💡 Sugerindo Funcionalidades

Ao sugerir uma funcionalidade:
- Descreva o problema que ela resolve
- Explique como deveria funcionar
- Considere alternativas
- Pense no impacto nos usuários

## 🔍 Code Review

Todos os PRs passam por code review. Esteja aberto a:
- Sugestões de melhorias
- Discussões sobre implementação
- Feedback construtivo

## ✅ Checklist do PR

Antes de abrir um PR, verifique:
- [ ] O código compila sem erros
- [ ] Testes passam
- [ ] Documentação está atualizada
- [ ] Commits seguem padrão semântico
- [ ] Não há console.log/print esquecidos
- [ ] .env.example atualizado (se necessário)

## 📞 Dúvidas?

Abra uma issue para discussões ou dúvidas!

Obrigado por contribuir! 🙏
