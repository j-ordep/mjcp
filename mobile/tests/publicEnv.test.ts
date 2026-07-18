import test from "node:test";
import assert from "node:assert/strict";
import {
  APP_BOOTSTRAP_ENV_ERROR,
  getPublicSupabaseConfig,
} from "../src/lib/publicEnv";

test("getPublicSupabaseConfig returns the hosted config when both values are valid", () => {
  const result = getPublicSupabaseConfig({
    EXPO_PUBLIC_SUPABASE_URL: "https://demo-project.supabase.co",
    EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_demo_key",
  });

  assert.deepEqual(result, {
    data: {
      supabaseUrl: "https://demo-project.supabase.co",
      supabasePublishableKey: "sb_publishable_demo_key",
    },
    error: null,
  });
});

test("getPublicSupabaseConfig rejects missing and placeholder values with a friendly bootstrap error", () => {
  const missingUrl = getPublicSupabaseConfig({
    EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_demo_key",
  });
  const placeholderKey = getPublicSupabaseConfig({
    EXPO_PUBLIC_SUPABASE_URL: "https://demo-project.supabase.co",
    EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "******",
  });

  assert.deepEqual(missingUrl, {
    data: null,
    error: APP_BOOTSTRAP_ENV_ERROR,
  });
  assert.deepEqual(placeholderKey, {
    data: null,
    error: APP_BOOTSTRAP_ENV_ERROR,
  });
});

test("getPublicSupabaseConfig rejects invalid URLs but still accepts local HTTP endpoints", () => {
  const invalidUrl = getPublicSupabaseConfig({
    EXPO_PUBLIC_SUPABASE_URL: "not-a-url",
    EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_demo_key",
  });
  const localUrl = getPublicSupabaseConfig({
    EXPO_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
    EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_demo_key",
  });

  assert.deepEqual(invalidUrl, {
    data: null,
    error: APP_BOOTSTRAP_ENV_ERROR,
  });
  assert.equal(localUrl.error, null);
  assert.equal(localUrl.data?.supabaseUrl, "http://127.0.0.1:54321");
});
