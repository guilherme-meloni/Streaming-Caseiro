/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';

const CACHE_NAME = `cache-${version}`;

// Lista de URLs para pré-cache (app shell)
const precache_urls = [...build, ...files];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Pré-cache de recursos essenciais.');
      return cache.addAll(precache_urls)
        .catch(error => {
          console.error('Service Worker: Falha no pré-cache:', error);
          // Opcional: relançar o erro para que a instalação falhe explicitamente
          throw error;
        });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(async (keys) => {
      // Deleta caches antigos
      await Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log(`Service Worker: Deletando cache antigo: ${key}`);
            return caches.delete(key);
          }
        })
      );
      self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora requisições de extensões e outros protocolos
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Ignora requisições de outros domínios (opcional, mas recomendado para evitar cache de terceiros)
	// don't try to cache stuff that isn't on our origin, or that breaks things in dev
	// Also, exclude API routes from service worker caching/handling
	if (url.origin !== self.location.origin || url.pathname.startsWith('/_app/') || url.pathname.startsWith('/api/')) {
		return;
	}

  // Estratégia Cache-First, Network-Fallback para imagens e APIs
  // Você pode ajustar os padrões de URL conforme suas necessidades
  const shouldCache =
    request.method === 'GET' &&
    (url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i) || // Imagens
     url.pathname.startsWith('/api/')); // Exemplo: suas rotas de API

  if (shouldCache) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        // Tenta encontrar no cache primeiro
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          console.log(`Service Worker: Servindo do cache: ${url.pathname}`);
          return cachedResponse;
        }

        // Se não estiver no cache, vai para a rede
        try {
          const networkResponse = await fetch(request);
          // Clona a resposta porque uma resposta de rede só pode ser consumida uma vez
          const responseToCache = networkResponse.clone();

          // Apenas cacheia respostas bem-sucedidas (status 200) para APIs
          if (url.pathname.startsWith('/api/') && networkResponse.ok) {
            cache.put(request, responseToCache);
            console.log(`Service Worker: Cacheando e servindo da rede: ${url.pathname}`);
          } else if (!url.pathname.startsWith('/api/')) {
            // Cacheia outras requisições (como imagens) independentemente do status, se desejar
            cache.put(request, responseToCache);
            console.log(`Service Worker: Cacheando e servindo da rede: ${url.pathname}`);
          }
          return networkResponse;
        } catch (error) {
          console.error(`Service Worker: Falha na requisição e não encontrado no cache: ${url.pathname}`, error);
          // Se falhar na rede e não houver cache, você pode retornar uma resposta de fallback
          // Por exemplo, uma imagem placeholder ou um JSON de erro
          // return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
          throw error; // Deixa a requisição falhar para a UI lidar
        }
      })
    );
  } else {
    // Para outras requisições, apenas vai para a rede
    event.respondWith(fetch(request));
  }
});

// Escuta por mensagens da página principal (opcional, para comunicação)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
