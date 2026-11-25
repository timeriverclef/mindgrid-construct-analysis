import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const dist = new URL("../dist/", import.meta.url);
const read = (file) => readFileSync(new URL(file, dist), "utf8");

test("production PWA stays within the GitHub Pages project subpath", async () => {
  const scope = "https://example.test/mindgrid/";
  const manifest = JSON.parse(read("manifest.webmanifest"));
  const html = read("index.html");
  assert.match(html, /href="\.\/manifest\.webmanifest"/);
  assert.equal(new URL(manifest.scope, scope).href, scope);
  assert.equal(new URL(manifest.start_url, scope).href, scope);
  assert.equal(manifest.display, "standalone");
  for (const icon of manifest.icons) {
    const png = readFileSync(new URL(icon.src, dist));
    const size = Number(icon.sizes.split("x")[0]);
    assert.equal(png.readUInt32BE(16), size);
    assert.equal(png.readUInt32BE(20), size);
  }

  const events = new Map(), cached = new Map();
  const old = "mindgrid-shell:" + scope + ":old";
  const unrelated = "mindgrid-shell:https://example.test/other/:old";
  const keys = new Set([old, unrelated]);
  let claims = 0;
  const cache = {
    addAll: async requests => {
      for (const {url} of requests) {
        const path = url.slice(scope.length);
        assert.match(path, /^(assets\/|icons\/|index\.html$|manifest\.webmanifest$)/);
        cached.set(url, readFileSync(new URL(path, dist)));
      }
    },
    match: async url => cached.get(url),
  };
  runInNewContext(read("sw.js"), {
    URL, Request, Set,
    fetch: () => Promise.reject(new Error("offline")),
    self: {
      registration: {scope}, location: new URL(scope),
      clients: {claim: async () => { claims++ }},
      addEventListener: (event, handler) => events.set(event, handler),
    },
    caches: {
      open: async key => { keys.add(key); return cache },
      keys: async () => [...keys],
      delete: async key => keys.delete(key),
    },
  });
  for (const stage of ["install", "activate"]) {
    let work;
    events.get(stage)({waitUntil: promise => { work = promise }});
    await work;
  }
  assert.equal(claims, 1);
  assert.equal(keys.has(old), false);
  assert.equal(keys.has(unrelated), true);
  assert.ok([...cached.keys()].some(url => url.includes("jspdf")));
  for (const [url, mode, method, handled] of [
    [scope, "navigate", "GET", true],
    [scope + "index.html?source=installed", "navigate", "GET", true],
    [[...cached.keys()].find(x => x.includes("/assets/")), "cors", "GET", true],
    [scope + "session.json", "cors", "GET", false],
    [scope, "navigate", "POST", false],
    ["https://elsewhere.test/assets/x.js", "cors", "GET", false],
  ]) {
    let response;
    events.get("fetch")({request:{url,mode,method}, respondWith: promise => { response = promise }});
    assert.equal(Boolean(response), handled);
    if (handled) assert.ok((await response).length > 0);
  }
});
