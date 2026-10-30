import test from "node:test";
import assert from "node:assert/strict";
import { writeFile, readFile, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

test("workflow-scaffold init creates config file", async (t) => {
  const tempDir = join(tmpdir(), `wf-test-${Date.now()}`);
  await writeFile(join(tempDir, "placeholder.txt"), "placeholder");
  const result = spawnSync("node", [join(process.cwd(), "src", "index.js"), "init"], {
    cwd: tempDir,
    encoding: "utf8"
  });
  assert.equal(result.status, 0, "CLI should exit with 0");
  const configPath = join(tempDir, ".workflow-config.json");
  const data = await readFile(configPath, "utf8");
  const parsed = JSON.parse(data);
  assert.ok(parsed.scripts?.build, "Config should contain build script");
  await rm(tempDir, { recursive: true, force: true });
});
