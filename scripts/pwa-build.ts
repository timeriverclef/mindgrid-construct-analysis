import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Plugin } from "vite";

export function mindGridPwa(): Plugin {
  let outDir: string;
  return {
    name: "mindgrid-offline",
    apply: "build",
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const assets = readdirSync(outDir, { recursive: true, withFileTypes: true })
        .filter(entry => entry.isFile())
        .map(entry => resolve(entry.parentPath, entry.name).slice(outDir.length + 1).replaceAll("\\", "/"))
        .filter(path => path === "index.html" || path === "manifest.webmanifest" ||
          path.startsWith("assets/") || path.startsWith("icons/"))
        .sort();
      const template = readFileSync(new URL("./service-worker.js", import.meta.url), "utf8");
      const hash = createHash("sha256").update(template);
      for (const path of assets) hash.update(path).update("\0").update(readFileSync(resolve(outDir, path)));
      const worker = template
        .replace("/* BUILD_ASSETS */ []", JSON.stringify(assets))
        .replace('/* BUILD_RELEASE */ "dev"', JSON.stringify(hash.digest("hex").slice(0, 20)));
      writeFileSync(resolve(outDir, "sw.js"), worker);
    },
  };
}
