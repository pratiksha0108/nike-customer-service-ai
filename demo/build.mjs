import { build } from "esbuild";
import { readFile, writeFile, mkdir, cp } from "node:fs/promises";
import { createHash } from "node:crypto";
const base = new URL("./", import.meta.url),
  out = new URL("../site/", base);
await mkdir(new URL("assets/", out), { recursive: true });
const compiled = await build({
  entryPoints: [new URL("app.js", base).pathname],
  bundle: true,
  write: false,
  format: "iife",
  target: "es2020",
  minify: true,
});
const hash = (s) => createHash("sha256").update(s).digest("hex").slice(0, 12);
const js = compiled.outputFiles[0].text,
  css = await readFile(new URL("style.css", base), "utf8");
const jsName = `assets/app.${hash(js)}.js`,
  cssName = `assets/style.${hash(css)}.css`;
await writeFile(new URL(jsName, out), js);
await writeFile(new URL(cssName, out), css);
const html = (await readFile(new URL("index.html", base), "utf8"))
  .replace("./style.css", "./" + cssName)
  .replace(
    '<script type="module" src="./app.js"></script>',
    `<script defer src="./${jsName}" onerror="window.bootFailure()"></script>`,
  );
await writeFile(new URL("index.html", out), html);
await cp(new URL("data/", base), new URL("data/", out), { recursive: true });
await writeFile(new URL(".nojekyll", out), "");
console.log(`Built Care Canvas with embedded dataset: ${jsName}`);
