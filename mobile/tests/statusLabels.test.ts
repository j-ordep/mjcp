import test from "node:test";
import assert from "node:assert/strict";
import {
  getAssignmentStatusLabel,
  getSwapRequestStatusLabel,
} from "../src/utils/statusLabels";

test("getAssignmentStatusLabel maps known assignment statuses", () => {
  assert.equal(getAssignmentStatusLabel("confirmed"), "Confirmado");
  assert.equal(getAssignmentStatusLabel("declined"), "Recusado");
  assert.equal(getAssignmentStatusLabel("swapped"), "Trocado");
});

test("getAssignmentStatusLabel falls back to pending for unknown statuses", () => {
  assert.equal(getAssignmentStatusLabel("anything-else"), "Pendente");
});

test("getSwapRequestStatusLabel maps known swap request statuses", () => {
  assert.equal(getSwapRequestStatusLabel("approved"), "Aprovada");
  assert.equal(getSwapRequestStatusLabel("rejected"), "Rejeitada");
  assert.equal(getSwapRequestStatusLabel("cancelled"), "Cancelada");
});

test("getSwapRequestStatusLabel falls back to pending for unknown statuses", () => {
  assert.equal(getSwapRequestStatusLabel("anything-else"), "Pendente");
});
