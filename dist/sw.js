// Build-time replacements are generated from verified local build assets.
const assets = ["assets/html2canvas.esm-QH1iLAAe.js","assets/index-0RY6-8yW.css","assets/index-Cf6cxq3a.js","assets/index.es-Cnyrq0Dv.js","assets/jspdf.es.min-BXXQzkFW.js","assets/purify.es-DBIK8olT.js","icons/app-192.png","icons/app-512.png","icons/apple-touch.png","icons/maskable-512.png","index.html","manifest.webmanifest"];
const release = "c877d185dd92ad8e735e";
const scope = self.registration.scope;
const prefix = "mindgrid-shell:" + scope + ":";
const cacheName = prefix + release;
const index = new URL("index.html", scope).href;
const root = new URL(scope).pathname;
const assetsByUrl = new Set(assets.map(path => new URL(path, scope).href));

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    // Installation is atomic: a partial release cannot become active.
    await cache.addAll([...assetsByUrl].map(url => new Request(url, {cache: "reload"})));
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(prefix) && key !== cacheName)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const isHome = request.mode === "navigate" &&
    (url.pathname === root || url.pathname === root + "index.html");
  if (!isHome && !assetsByUrl.has(url.href)) return;
  // Keep HTML and its hashed chunks on the same release, including offline.
  event.respondWith((async () => {
    const cache = await caches.open(cacheName);
    return (await cache.match(isHome ? index : url.href)) ?? fetch(request);
  })());
});
