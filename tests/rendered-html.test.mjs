import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("build includes the Worker entry and V1.3 persistent routes", async () => {
  const worker = await readFile(
    new URL("../dist/server/index.js", import.meta.url),
    "utf8",
  );

  assert.match(worker, /export\s*\{\s*worker_entry_default as default\s*\}/);
  assert.match(worker, /pattern:\s*["']\/api\/demo-state["']/);
  assert.match(worker, /pattern:\s*["']\/api\/account["']/);
  assert.match(worker, /pattern:\s*["']\/api\/purchase-offers["']/);
  assert.match(worker, /chave_direta_demo_session/);
  assert.match(worker, /sqliteTable\(["']demo_states["']/);
  assert.match(worker, /sqliteTable\(["']purchase_offers["']/);
  assert.match(worker, /oai-authenticated-user-id/);
});
