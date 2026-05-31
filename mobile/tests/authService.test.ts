import test from "node:test";
import assert from "node:assert/strict";
import { loadServiceModule } from "./serviceTestHelpers";

type AuthService = typeof import("../src/services/authService");

function createAuthMock(config: {
  signUpError?: { message: string } | null;
  signInError?: { message: string } | null;
  signOutError?: { message: string } | null;
}) {
  return {
    auth: {
      signUp: async () => ({
        data: { user: null },
        error: config.signUpError ?? null,
      }),
      signInWithPassword: async () => ({
        data: { user: null },
        error: config.signInError ?? null,
      }),
      signOut: async () => ({
        error: config.signOutError ?? null,
      }),
    },
  };
}

test("signIn returns a generic safe error message", async () => {
  const authService = loadServiceModule<AuthService>(
    "../src/services/authService",
    createAuthMock({
      signInError: { message: 'invalid input syntax for type uuid: "abc"' },
    }),
  );

  const result = await authService.signIn("user@example.com", "123456");

  assert.equal(
    result.error,
    "Nao foi possivel entrar. Confira seus dados e tente novamente.",
  );
});

test("signUp returns a generic safe error message", async () => {
  const authService = loadServiceModule<AuthService>(
    "../src/services/authService",
    createAuthMock({
      signUpError: { message: 'duplicate key value violates unique constraint "users_email_key"' },
    }),
  );

  const result = await authService.signUp(
    "user@example.com",
    "123456",
    "Usuario Teste",
  );

  assert.equal(
    result.error,
    "Nao foi possivel concluir o cadastro. Tente novamente em alguns instantes.",
  );
});

test("signOut returns a generic safe error message", async () => {
  const authService = loadServiceModule<AuthService>(
    "../src/services/authService",
    createAuthMock({
      signOutError: { message: "JWT expired" },
    }),
  );

  const result = await authService.signOut();

  assert.equal(
    result.error,
    "Nao foi possivel sair agora. Tente novamente em alguns instantes.",
  );
});
