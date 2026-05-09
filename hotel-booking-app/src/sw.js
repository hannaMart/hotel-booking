import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";
cleanupOutdatedCaches();

precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};

  const title = data.title || "Baltic Breeze";

  const options = {
    body: data.body || "New notification",
    icon: "/pwa-192x192.png",
  };

  event.waitUntil(self.registration.showNotification(title, options));
});
