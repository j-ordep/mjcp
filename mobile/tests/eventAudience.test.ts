import test from "node:test";
import assert from "node:assert/strict";
import { normalizeAudienceUserIds } from "../src/utils/eventAudience";

test("normalizeAudienceUserIds trims, dedupes and drops empty ids", () => {
  assert.deepEqual(
    normalizeAudienceUserIds([" user-1 ", "user-1", "", "user-2 ", "   "]),
    ["user-1", "user-2"],
  );
});

test("normalizeAudienceUserIds returns an empty array when no member is selected", () => {
  assert.deepEqual(normalizeAudienceUserIds([" ", "", "   "]), []);
});
