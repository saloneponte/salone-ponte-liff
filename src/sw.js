// Service Worker for Salone Ponte PWA
const CACHE_NAME = 'salone-ponte-v1.2.0';
const STATIC_CACHE = 'salone-ponte-static-v1.2.0';
const DYNAMIC_CACHE = 'salone-ponte-dynamic-v1.2.0';

// キャッシュするリソース
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/confirm.html',
  '/menu.html',
  '/staff.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Firebase SDK
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js',
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js',
  // LIFF SDK
  'https://static.line-scdn.net/liff/edge/2.1/sdk.js',
  // フォールバック画像
  'https://dummyimage.com/160x120/e9ecef/6c757d.png',
  'https://dummyimage.com/60x60/e9ecef/6c757d.png'
];

// ネットワーク優先リソース（常に最新が必要）
const NETWORK_FIRST = [
  '/api/',
  'firestore.googleapis.com',
  'firebase.googleapis.com'
];

// キャッシュ優先リソース（静的コンテンツ）
const CACHE_FIRST = [
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.svg',
  '.css',
  '.js',
  '.woff',
  '.woff2'
];

// Service Worker インストール
self.addEventListener('install', event => {
  console.log('[SW] インストール中...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] 静的リソースをキャッシュ中...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] インストール完了');
        return self.skipWaiting(); // 即座にアクティベート
      })
      .catch(error => {
        console.error('[SW] インストールエラー:', error);
      })
  );
});

// Service Worker アクティベート
self.addEventListener('activate', event => {
  console.log('[SW] アクティベート中...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            // 古いキャッシュを削除
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('[SW] 古いキャッシュを削除:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] アクティベート完了');
        return self.clients.claim(); // 即座に制御開始
      })
  );
});

// ネットワークリクエストの処理
self.addEventListener('fetch', event => {
  const { request } = event;
  const { url, method } = request;

  // POSTリクエストはキャッシュしない
  if (method !== 'GET') {
    return;
  }

  // Chrome拡張機能のリクエストは無視
  if (url.includes('chrome-extension://')) {
    return;
  }

  event.respondWith(handleRequest(request));
});

// リクエスト処理のメイン関数
async function handleRequest(request) {
  const url = new URL(request.url);
  
  try {
    // 1. Firebase Firestore リクエスト - ネットワーク優先
    if (isFirebaseRequest(url)) {
      return await networkFirstStrategy(request);
    }
    
    // 2. 静的リソース - キャッシュ優先
    if (isStaticResource(url)) {
      return await cacheFirstStrategy(request);
    }
    
    // 3. HTMLページ - stale-while-revalidate
    if (isHTMLRequest(request)) {
      return await staleWhileRevalidateStrategy(request);
    }
    
    // 4. その他 - ネットワーク優先
    return await networkFirstStrategy(request);
    
  } catch (error) {
    console.error('[SW] リクエストエラー:', error);
    return await getOfflineFallback(request);
  }
}

// Firebase関連リクエストの判定
function isFirebaseRequest(url) {
  return NETWORK_FIRST.some(pattern => url.hostname.includes(pattern));
}

// 静的リソースの判定
function isStaticResource(url) {
  return CACHE_FIRST.some(ext => url.pathname.includes(ext));
}

// HTMLリクエストの判定
function isHTMLRequest(request) {
  return request.destination === 'document' || 
         request.headers.get('accept')?.includes('text/html');
}

// ネットワーク優先戦略
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    // 成功したレスポンスをキャッシュ
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // ネットワークエラー時はキャッシュから取得
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// キャッシュ優先戦略
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // キャッシュにない場合はネットワークから取得
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    throw error;
  }
}

// Stale-while-revalidate戦略
async function staleWhileRevalidateStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  // バックグラウンドでネットワークリクエストを実行
  const networkResponsePromise = fetch(request)
    .then(response => {
      if (response.ok) {
        const cache = caches.open(DYNAMIC_CACHE);
        cache.then(c => c.put(request, response.clone()));
      }
      return response;
    })
    .catch(() => null);
  
  // キャッシュがあればすぐに返す、なければネットワークを待つ
  return cachedResponse || await networkResponsePromise;
}

// オフライン時のフォールバック
async function getOfflineFallback(request) {
  // HTMLリクエストの場合
  if (isHTMLRequest(request)) {
    const cachedResponse = await caches.match('/index.html');
    if (cachedResponse) {
      return cachedResponse;
    }
  }
  
  // 画像リクエストの場合
  if (request.destination === 'image') {
    return new Response(
      `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150">
        <rect width="200" height="150" fill="#e9ecef"/>
        <text x="100" y="75" text-anchor="middle" dominant-baseline="middle" fill="#6c757d" font-family="Arial" font-size="14">
          オフライン
        </text>
      </svg>`,
      {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'no-cache'
        }
      }
    );
  }
  
  // その他のリクエスト
  return new Response('オフラインです', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: {
      'Content-Type': 'text/plain; charset=utf-8'
    }
  });
}

// プッシュ通知の処理
self.addEventListener('push', event => {
  console.log('[SW] プッシュ通知受信:', event);
  
  if (!event.data) {
    return;
  }
  
  const data = event.data.json();
  const { title, body, icon, badge, tag, url } = data;
  
  const options = {
    body: body || '新しい通知があります',
    icon: icon || '/icons/icon-192x192.png',
    badge: badge || '/icons/badge-72x72.png',
    tag: tag || 'default',
    data: { url: url || '/' },
    actions: [
      {
        action: 'open',
        title: '開く',
        icon: '/icons/action-open.png'
      },
      {
        action: 'close',
        title: '閉じる',
        icon: '/icons/action-close.png'
      }
    ],
    requireInteraction: true,
    silent: false,
    vibrate: [100, 50, 100],
    timestamp: Date.now()
  };
  
  event.waitUntil(
    self.registration.showNotification(title || 'Salone Ponte', options)
  );
});

// 通知クリックの処理
self.addEventListener('notificationclick', event => {
  console.log('[SW] 通知クリック:', event);
  
  event.notification.close();
  
  const { action, data } = event;
  const url = data?.url || '/';
  
  if (action === 'close') {
    return;
  }
  
  // アプリを開く
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // 既に開いているウィンドウがあれば、それにフォーカス
        for (const client of clientList) {
          if (client.url.includes(url) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // 新しいウィンドウを開く
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// バックグラウンド同期
self.addEventListener('sync', event => {
  console.log('[SW] バックグラウンド同期:', event.tag);
  
  if (event.tag === 'background-sync-reservations') {
    event.waitUntil(syncReservations());
  }
});

// 予約データの同期
async function syncReservations() {
  try {
    // IndexedDBから未同期の予約データを取得
    // Firebase Firestoreに送信
    // 成功したらローカルデータを削除
    console.log('[SW] 予約データを同期中...');
    
    // 実装例（実際のIndexedDB操作が必要）
    // const reservations = await getUnsyncedReservations();
    // for (const reservation of reservations) {
    //   await uploadReservation(reservation);
    //   await markReservationAsSynced(reservation.id);
    // }
    
    console.log('[SW] 予約データ同期完了');
  } catch (error) {
    console.error('[SW] 予約データ同期エラー:', error);
    throw error; // 再試行のため
  }
}

// ネットワーク状態の監視
self.addEventListener('online', event => {
  console.log('[SW] オンラインに復帰');
  // 必要に応じて同期処理を実行
});

self.addEventListener('offline', event => {
  console.log('[SW] オフラインになりました');
});

// キャッシュサイズの制限
async function limitCacheSize(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxItems) {
    // 古いアイテムから削除
    const deletePromises = keys
      .slice(0, keys.length - maxItems)
      .map(key => cache.delete(key));
    
    await Promise.all(deletePromises);
  }
}

// 定期的なキャッシュクリーンアップ
setInterval(() => {
  limitCacheSize(DYNAMIC_CACHE, 100); // 最大100アイテム
}, 24 * 60 * 60 * 1000); // 24時間ごと

// エラーレポート
self.addEventListener('error', event => {
  console.error('[SW] エラー:', event.error);
  // 必要に応じてエラーレポートサービスに送信
});

self.addEventListener('unhandledrejection', event => {
  console.error('[SW] 未処理のPromise拒否:', event.reason);
  // 必要に応じてエラーレポートサービスに送信
});

console.log('[SW] Service Worker読み込み完了');