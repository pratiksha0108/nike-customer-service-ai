import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
test("release is self-contained and versioned", async () => {
  execFileSync(process.execPath, [
    new URL("./build.mjs", import.meta.url).pathname,
  ]);
  const html = await readFile(
    new URL("../site/index.html", import.meta.url),
    "utf8",
  );
  const file = html.match(/src="\.\/(assets\/app\.[a-f0-9]{12}\.js)"/)[1];
  const code = await readFile(
    new URL("../site/" + file, import.meta.url),
    "utf8",
  );
  assert.match(html, /style\.[a-f0-9]{12}\.css/);
  assert.doesNotMatch(html, /type="module"/);
  assert.match(code, /CASE-0001/);
  assert.match(code, /CASE-8469/);
  assert.doesNotMatch(code, /fetch\(/);
  assert.match(html, /bootFailure/);
});
