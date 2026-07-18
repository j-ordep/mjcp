import test from "node:test";
import assert from "node:assert/strict";

const {
  getRawErrorMessage,
  getGenericUserFacingError,
  getAuthUserFacingError,
} = require("../src/utils/userFacingErrors") as {
  getRawErrorMessage: (error: unknown) => string;
  getGenericUserFacingError: (error: unknown, fallback: string) => string;
  getAuthUserFacingError: (
    error: unknown,
    mode: "sign_in" | "sign_up" | "sign_out",
  ) => string;
};

test("getRawErrorMessage extracts the message from Error instances and plain objects", () => {
  assert.equal(getRawErrorMessage(new Error("Falha simples.")), "Falha simples.");
  assert.equal(
    getRawErrorMessage({ message: "Falha em objeto simples." }),
    "Falha em objeto simples.",
  );
  assert.equal(getRawErrorMessage(null), "");
});

test("getGenericUserFacingError hides technical backend messages behind the fallback", () => {
  const result = getGenericUserFacingError(
    new Error('new row violates row-level security policy for table "profiles"'),
    "Nao foi possivel salvar agora.",
  );

  assert.equal(result, "Nao foi possivel salvar agora.");
});

test("getGenericUserFacingError preserves safe domain messages", () => {
  const result = getGenericUserFacingError(
    new Error("Apenas administradores podem alterar esta permissao."),
    "Nao foi possivel salvar agora.",
  );

  assert.equal(result, "Apenas administradores podem alterar esta permissao.");
});

test("getAuthUserFacingError returns generic copy per auth mode", () => {
  assert.equal(
    getAuthUserFacingError(
      new Error("Invalid login credentials"),
      "sign_in",
    ),
    "Nao foi possivel entrar. Confira seus dados e tente novamente.",
  );
  assert.equal(
    getAuthUserFacingError(
      new Error("User already registered"),
      "sign_up",
    ),
    "Nao foi possivel concluir o cadastro. Tente novamente em alguns instantes.",
  );
  assert.equal(
    getAuthUserFacingError(
      new Error("JWT expired"),
      "sign_out",
    ),
    "Nao foi possivel sair agora. Tente novamente em alguns instantes.",
  );
});
