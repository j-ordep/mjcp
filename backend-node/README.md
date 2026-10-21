# Backend MJCP — aprendendo do zero

A base anterior foi removida. As pastas de módulos foram preservadas vazias,
mas ainda não há código de aplicação. Configurações e dependências continuam
disponíveis para serem exploradas aos poucos.

## Primeiro objetivo

Criar um servidor que receba `GET /health` e responda um JSON.

O caminho de uma requisição é:

```text
Navegador ou app → requisição HTTP → Fastify → resposta HTTP
```

- TypeScript é a linguagem do código.
- Bun executa o código e gerencia as dependências.
- Fastify é a biblioteca que organiza o servidor e suas rotas.
- Uma rota combina método HTTP (como GET) e caminho (como /health).

## Primeiro exercício, ainda não implementado

Criar `src/server.ts` com:

```ts
import Fastify from "fastify";

const app = Fastify({ logger: true });

app.get("/health", async () => {
	return { status: "ok" };
});

await app.listen({ port: 3000 });
```

1. O import traz a função que cria a aplicação Fastify.
2. A chamada Fastify cria a aplicação; logger habilita os registros de execução.
3. app.get registra a função que atende GET /health. A função só executa quando
   chega uma requisição para essa rota.
4. O objeto retornado é enviado como JSON na resposta HTTP.
5. app.listen inicia o servidor na porta 3000; await espera a inicialização terminar.

Depois de criar esse arquivo, executar nesta pasta:

```sh
bun run dev
```

Abrir http://localhost:3000/health. A resposta esperada é:

```json
{ "status": "ok" }
```

Encerrar com Ctrl+C no terminal. O comando dev observa alterações no código.
Até o exercício ser implementado, os comandos dev e start não funcionam.

## Depois do primeiro servidor

Entender parâmetros, corpo da requisição, códigos HTTP e erros. Depois separar
a criação da aplicação da inicialização do servidor, e extrair a primeira rota
para um módulo.

Um monolito modular é uma aplicação publicada como uma unidade, organizada em
áreas de negócio com responsabilidades e limites claros. Só criar pastas não
estabelece esses limites; vamos construí-los quando houver código para organizar.

Validação, banco de dados e autenticação entram em etapas posteriores.
