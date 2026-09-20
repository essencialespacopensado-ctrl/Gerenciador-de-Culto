// Service worker do app — é ele que permite "instalar" o site como aplicativo e faz o app se
// atualizar sozinho toda vez que uma nova versão é publicada, sem precisar desinstalar nada.
const CACHE_NAME = 'gerenciador-culto-v1';

// Assim que a nova versão termina de instalar, ela já assume o controle na hora (não fica
// esperando todas as abas fecharem) — é isso que faz o app atualizar sozinho na próxima abertura.
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

// Páginas e chamadas de API sempre buscam a versão mais nova da rede primeiro (nunca mostra
// dado desatualizado); só usa o que está guardado se o celular estiver sem internet no momento.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.pathname.startsWith('/api/')) return; // nunca guarda em cache chamadas de API

  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match('/')))
  );
});
