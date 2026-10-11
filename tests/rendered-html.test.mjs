import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("build includes the Worker entry and persistent demo-state route", async () => {
  const worker = await readFile(
    new URL("../dist/server/index.js", import.meta.url),
    "utf8",
  );

  assert.match(worker, /export\s*\{\s*worker_entry_default as default\s*\}/);
  assert.match(worker, /pattern:\s*["']\/api\/demo-state["']/);
  assert.match(worker, /chave_direta_demo_session/);
  assert.match(worker, /sqliteTable\(["']demo_states["']/);
});
