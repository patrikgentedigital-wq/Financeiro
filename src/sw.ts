import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst, NetworkOnly } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

declare let self: ServiceWorkerGlobalScope;

// Precache todos os arquivos do App Shell gerados pelo Vite
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// 1. Supabase Auth: NetworkOnly (sempre direto na rede por segurança)
registerRoute(
  ({ url }) => url.origin.includes('supabase.co') && url.pathname.includes('/auth/'),
  new NetworkOnly()
);

// 2. Supabase REST (Dados): NetworkFirst com fallback offline no cache local
registerRoute(
  ({ url }) => url.origin.includes('supabase.co') && url.pathname.includes('/rest/'),
  new NetworkFirst({
    cacheName: 'supabase-data-cache',
    networkTimeoutSeconds: 4,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 7, // 7 dias
      }),
    ],
  })
);

// 3. Fontes do Google: CacheFirst (armazenamento estático rápido)
registerRoute(
  ({ url }) => url.origin.includes('fonts.googleapis.com') || url.origin.includes('fonts.gstatic.com'),
  new CacheFirst({
    cacheName: 'google-fonts-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 ano
      }),
    ],
  })
);

// Auto-activate ao atualizar
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
