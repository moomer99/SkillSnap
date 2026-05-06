// SkillSnap Service Worker — handles background push notifications
self.addEventListener("install", () => self.skipWaiting());

// Clear all old caches on activate and claim clients immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

// Never cache Supabase calls or API routes — always go to network
self.addEventListener("fetch", (event) => {
  const url = event.request.url;
  if (
    url.includes("supabase.co") ||
    url.includes("/api/") ||
    url.includes("/rest/v1/") ||
    url.includes("/auth/")
  ) {
    event.respondWith(fetch(event.request));
  }
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try { payload = event.data.json(); } catch { return; }

  const { title = "New message", body = "", icon = "/icon-192.png" } = payload;
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge: icon,
      tag: "skillsnap-message",
      renotify: true,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes("skillsnap") && "focus" in client) return client.focus();
      }
      return self.clients.openWindow("/");
    })
  );
});
