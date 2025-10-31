// A versão do cache deve ser incrementada a cada nova atualização do código.
// Isso força o Service Worker a descartar caches antigos.
const CACHE_NAME = 'roleta-iap-cache-v1.0.3'; 

// Lista de arquivos essenciais que serão cacheados
const urlsToCache = [
  './', // Caching do index.html (página principal)
  './index.html',
  './manifest.webservice',
  './IMG_4124.jpeg', // Seu ícone 192x192
  './IMG_4123.jpeg', // Seu ícone 512x512
  'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;800&display=swap',
  'https://cdn.jsdelivr.net/npm/tesseract.js@4.1.1/dist/tesseract.min.js'
];


// =======================================================
// INSTALAÇÃO: Cacheia todos os recursos essenciais
// =======================================================
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando e cacheadando recursos...');
  // Força o Service Worker a se ativar imediatamente após a instalação
  self.skipWaiting(); 
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('[Service Worker] Falha ao adicionar recursos ao cache:', err);
      })
  );
});


// =======================================================
// ATIVAÇÃO: Limpa caches antigos
// =======================================================
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Ativado. Limpando caches antigos...');
  
  // Assegura que o Service Worker assume o controle da página imediatamente
  event.waitUntil(self.clients.claim()); 
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deletando cache obsoleto:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});


// =======================================================
// FETCH: Estratégia de cache
// =======================================================
self.addEventListener('fetch', (event) => {
  
  // Estratégia: Cache-First para recursos e Network-First para HTML (evita congelamento)

  // 1. Estratégia Network-First (Tenta a rede, se falhar usa cache) para HTML (index.html)
  if (event.request.mode === 'navigate' || 
      event.request.destination === 'document' || 
      event.request.url.includes('index.html')) {
        
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request);
      })
    );
    return;
  }
  
  // 2. Estratégia Cache-First (Tenta o cache, se falhar usa rede) para outros recursos (CSS, JS, Imagens)
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retorna recurso do cache, se encontrado
        if (response) {
          return response;
        }
        // Se não está no cache, busca na rede
        return fetch(event.request).then(
          (response) => {
            // Verifica se a resposta é válida
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clona a resposta para o cache
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                // Não cachear requisições externas que podem ser grandes ou mudar
                if (urlsToCache.includes(event.request.url)) {
                    cache.put(event.request, responseToCache);
                }
              });

            return response;
          }
        );
      })
  );
});
