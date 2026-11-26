import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const read = (path) => readFile(new URL(path, import.meta.url));
const data = async (path, mime) => `data:${mime};base64,${(await read(path)).toString("base64")}`;
const [template, css, display, mono, assembled, exploded, licenses, script] = await Promise.all([
  read("./src/page.html").then(String),
  read("./src/styles.css").then(String),
  data("./node_modules/@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2", "font/woff2"),
  data("./node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2", "font/woff2"),
  data("./src/assembled.webp", "image/webp"),
  data("./src/exploded.webp", "image/webp"),
  Promise.all([
    read("./node_modules/three/LICENSE").then(String),
    read("./node_modules/@fontsource-variable/space-grotesk/LICENSE").then(String),
    read("./node_modules/@fontsource/ibm-plex-mono/LICENSE").then(String),
  ]),
  build({
    entryPoints: [fileURLToPath(new URL("./src/viewer.js", import.meta.url))],
    bundle: true,
    minify: true,
    write: false,
    format: "iife",
    target: "es2020",
  }),
]);

const html = template
  .replace("/*__STYLE__*/", () => css.replace("__DISPLAY_FONT__", display).replace("__MONO_FONT__", mono))
  .replaceAll("__ASSEMBLED__", assembled)
  .replaceAll("__EXPLODED__", exploded)
  .replace("/*__SCRIPT__*/", () => script.outputFiles[0].text.replaceAll(/<\/script/gi, "<\\/script"))
  .replace("<!--__LICENSES__-->", () => `<!--\n${licenses.join("\n\n").replaceAll("--", "−−")}\n-->`);
await writeFile(new URL("../index.html", import.meta.url), html);
