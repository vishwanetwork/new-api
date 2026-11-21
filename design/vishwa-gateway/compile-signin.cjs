const fs = require("node:fs");
const path = require("node:path");
const tw = require("tailwindcss");
(async () => {
  const file = path.join(__dirname, "public", "signin.html");
  let html = fs.readFileSync(file, "utf8");
  const candidates = [...html.matchAll(/class="([^"]+)"/g)].flatMap((m) => m[1].split(/\s+/));
  const compiler = await tw.compile("@tailwind utilities;");
  const css = compiler.build(candidates);
  const font = fs
    .readFileSync(path.join(__dirname, "src", "InterVariable.woff2"))
    .toString("base64");
  function setStyle(id, content) {
    html = html.replace(
      new RegExp('(<style id="' + id + '">)[\\s\\S]*?(</style>)'),
      (_, a, b) => a + content + b,
    );
  }
  if (!css.includes(".w-full")) throw new Error("Missing compiled form utilities");
  setStyle("shared-theme", fs.readFileSync(path.join(__dirname, "src", "theme.css"), "utf8"));
  setStyle(
    "inter-font",
    "@font-face{font-family:Inter;src:url(data:font/woff2;base64," +
      font +
      ') format("woff2");font-weight:100 900;font-display:swap}',
  );
  setStyle("tailwind-utilities", css);
  fs.writeFileSync(file, html);
  fs.writeFileSync(
    path.join(__dirname, "src", "model-utilities.css"),
    compiler.build(["shadow-[0_0_15px_rgba(163,119,255,.36)]"]),
  );
  console.log("Compiled sign-in styles and embedded shared Inter font");
})();
