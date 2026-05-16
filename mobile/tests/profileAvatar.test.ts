import assert from "node:assert/strict";
import test from "node:test";
import {
  formatProfilePhone,
  getProfileAvatarUri,
  getProfileInitials,
} from "../src/utils/profileAvatar";

test("getProfileInitials returns default initials when name is missing", () => {
  assert.equal(getProfileInitials(), "MJ");
  assert.equal(getProfileInitials(""), "MJ");
  assert.equal(getProfileInitials("   "), "MJ");
});

test("getProfileInitials uses the first letters of up to two names", () => {
  assert.equal(getProfileInitials("Maria"), "M");
  assert.equal(getProfileInitials("Maria Jose"), "MJ");
  assert.equal(getProfileInitials("maria jose silva"), "MJ");
});

test("formatProfilePhone formats brazilian phone numbers for display", () => {
  assert.equal(formatProfilePhone(null), "Não informado");
  assert.equal(formatProfilePhone("11987654321"), "(11) 98765-4321");
  assert.equal(formatProfilePhone("1134567890"), "(11) 3456-7890");
  assert.equal(formatProfilePhone("(11) 98765-4321"), "(11) 98765-4321");
});

test("getProfileAvatarUri only returns stored avatar values", () => {
  assert.equal(getProfileAvatarUri(undefined), undefined);
  assert.equal(getProfileAvatarUri("   "), undefined);
  assert.equal(
    getProfileAvatarUri("https://cdn.example.com/avatar.png"),
    "https://cdn.example.com/avatar.png",
  );
});
