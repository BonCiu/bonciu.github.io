;(function() {
  const publicPaths = ["/", "/index.html", "/id.html", "/index.1.html", "/login"];
  const protectedPaths = [
    "/main",
    "/main.html",
    "/home",
    "/home.html",
    "/panel",
    "/panel.html",
    "/card",
    "/card.html",
    "/card-prawojazdy",
    "/card-prawojazdy.html",
    "/document",
    "/document.html",
    "/documents",
    "/documents.html",
    "/more",
    "/more.html",
    "/pesel",
    "/pesel.html",
    "/qr",
    "/qr.html",
    "/scan",
    "/scan.html",
    "/services",
    "/services.html",
    "/shortcuts",
    "/shortcuts.html",
    "/show",
    "/show.html"
  ];
  const path = window.location.pathname.replace(/\/$/, "");
  const accessFlagName = "access_granted";
  const accessOk = sessionStorage.getItem(accessFlagName) === "true";

  if (!publicPaths.includes(path) && protectedPaths.includes(path) && !accessOk) {
    document.body.innerHTML = `
      <div style="min-height:100vh; display:flex; align-items:center; justify-content:center; background:#111; color:#fff; padding:24px; font-family:system-ui, sans-serif;">
        <div style="max-width:560px; text-align:center;">
          <h1 style="font-size:2rem; margin-bottom:16px;">Błąd dostępu</h1>
          <p style="font-size:1rem; line-height:1.6; margin-bottom:22px;">
            Brak unikalnego kodu dostępu. Najpierw przejdź na stronę logowania i wpisz kod.
          </p>
          <a href="/id.html" style="display:inline-block; padding:12px 24px; background:#00ffd0; color:#181818; border-radius:999px; text-decoration:none; font-weight:700;">Przejdź do logowania</a>
        </div>
      </div>`;
    throw new Error("Access blocked: no unique code");
  }
})();

var params = new URLSearchParams(window.location.search);

window.onload = async () => {
  const files = ["https://unpkg.com/html5-qrcode"];
  const pages = [
    "card",
    "document",
    "documents",
    "home",
    "id",
    "more",
    "pesel",
    "qr",
    "scan",
    "services",
    "shortcuts",
    "show",
  ];

  pages.forEach((page) => {
    files.push("/" + page + "?" + params);
  });

  files.push(params.get("image"));

  const index = files.indexOf("./assets/cache.js");
  files.splice(index, 1);

  const cacheName = "cwelObywatel";

  const cache = await caches.open(cacheName);
  await cache.addAll(files);

  const cachedRequests = await cache.keys();

  cachedRequests.forEach((request) => {
    checkElement(request, cache);
  });

  navigator.serviceWorker.register("./worker.js");
};

async function checkElement(request, cache) {
  const cachedResponse = await cache.match(request);

  const url = new URL(request.url);
  const modifiedUrl = new URL(url);

  modifiedUrl.searchParams.append("date", new Date());

  const networkResponse = await fetch(modifiedUrl);

  const cachedText = await cachedResponse.clone().text();
  const networkText = await networkResponse.clone().text();

  if (cachedText !== networkText) {
    cache.put(url, networkResponse);
  }
}

