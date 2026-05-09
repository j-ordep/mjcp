import test from "node:test";
import assert from "node:assert/strict";
import { resolveAudienceResponse } from "../src/utils/audienceResults";

type AudienceProfile = {
  id: string;
  full_name: string;
};

function createProfile(id: string, fullName = `Membro ${id}`): AudienceProfile {
  return {
    id,
    full_name: fullName,
  };
}

test("resolveAudienceResponse ignores stale responses", () => {
  const result = resolveAudienceResponse({
    current: [createProfile("1")],
    incoming: [createProfile("2")],
    mode: "replace",
    page: 0,
    hasMore: false,
    requestId: 1,
    latestRequestId: 2,
    isPublic: false,
  });

  assert.equal(result.shouldApply, false);
  assert.equal(result.page, null);
  assert.equal(result.hasMore, false);
  assert.deepEqual(result.results, [createProfile("1")]);
});

test("resolveAudienceResponse ignores private audience results after the event becomes public", () => {
  const result = resolveAudienceResponse({
    current: [createProfile("1")],
    incoming: [createProfile("2")],
    mode: "replace",
    page: 0,
    hasMore: true,
    requestId: 3,
    latestRequestId: 3,
    isPublic: true,
  });

  assert.equal(result.shouldApply, false);
  assert.equal(result.page, null);
  assert.equal(result.hasMore, false);
  assert.deepEqual(result.results, [createProfile("1")]);
});

test("resolveAudienceResponse appends a new page without duplicating profiles", () => {
  const result = resolveAudienceResponse({
    current: [createProfile("1"), createProfile("2")],
    incoming: [createProfile("2"), createProfile("3")],
    mode: "append",
    page: 1,
    hasMore: true,
    requestId: 4,
    latestRequestId: 4,
    isPublic: false,
  });

  assert.equal(result.shouldApply, true);
  assert.equal(result.page, 1);
  assert.equal(result.hasMore, true);
  assert.deepEqual(result.results, [
    createProfile("1"),
    createProfile("2"),
    createProfile("3"),
  ]);
});
