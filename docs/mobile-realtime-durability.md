# Mobile Realtime Dayaniklilik (Gün 3)

## Realtime durum matrisi

| Durum | Tetikleyici | Görsel / metin (RealtimeStatusBadge) | Beklenen davranış |
|------|-------------|--------------------------------------|-------------------|
| `connecting` | İlk `connect()`, veya tam tur retry öncesi bekleme bitti | Baslik: **Sunucuya baglaniliyor**; alt satir: hub açiliyor; **spinner** | REST sorguları çalışır; event akışı henüz yok |
| `connected` | WebSocket veya LongPolling `start()` başarılı; `onreconnected` | Baslik: **Canli baglanti**; sol **yeşil** vurgu çizgisi | `cart.changed` / sipariş eventleri dinlenir; query invalidate |
| `degraded` | WS başarısız → LP denemesi sırasında; `onreconnecting`; ara tur `connect()` hataları | Baslik: **Yeniden baglaniyor veya yedek kanal**; **turuncu** vurgu; **spinner** | Oturaklı bağlantı için SignalR backoff + WS→LP fallback |
| `offline` | Logout / `disconnect` / hub `onclose` (reconnect tükendi veya iptal); **tüm başlangıç turları başarısız** | Baslik: **Realtime kapali**; **kirmizi** vurgu | Salt REST; kullanıcıya alert ile bilgi |

## Bağlantı sırası (ilk açılış)

1. `connecting` yayınlanır.
2. Bir **tur**: önce **WebSockets**, başarısızsa **LongPolling** ile tekrar dene (aynı tur içinde transport fallback).
3. Tur başarısızsa `degraded`, bağlantı temizlenir; tabloya göre bekleme → tekrar `connecting`.
4. Tüm turlar biterse `offline` ve hata üst kata fırlatılır (`useMobileAppController` alert).

## Reconnect / backoff politikası

### SignalR otomatik yeniden bağlanma (bağlantı düştükten sonra)

`withAutomaticReconnect([...AUTOMATIC_RECONNECT_DELAYS_MS])`:

`0, 2000, 5000, 10000, 20000, 30000, 60000, 60000` ms

- İlk deneme anında; sonraki denemeler kademeli; son iki tur 60 sn ile mobil ağ kopukluklarında sakinleştirme.

### İlk bağlantı – tam tur yeniden deneme

`INITIAL_CONNECT_RETRY_DELAYS_MS`: `1500, 4000, 8000, 15000`

- İlk tur gecikmesiz; sonraki turlarda bu gecikmeler uygulanır (toplam tur: `INITIAL_CONNECT_MAX_ROUNDS`).
- Kod: `src/services/realtimePolicy.ts`, uygulama: `src/services/realtimeService.ts`.

## Event dedup kuralları

- Son **25** event tutulur (FIFO; en eski anahtar `Set`/`order` dizisinden çıkarılınca aynı olay anahtarı tekrar listelenebilir).
- Tekrar gelen **aynı anahtar** hemen düşürülür:
  - Cart: `action:productId:quantity`
  - OrderCreated: `orderId:status:totalAmount`
  - OrderStatus: `orderId:previousStatus:newStatus`
- Birim test: `__tests__/realtimeDedup.test.ts`, çağrı: `pushUniqueEvent` (`src/features/realtime/eventDedup.ts`).

## Doğrulama notları (manuel)

- Giriş sonrası rozet **baglaniliyor → baglı** sırası.
- Uçak modu / Wi‑Fi kapatma: **zayıf / yeniden bağlanıyor** ve kısa süre sonra **baglı** veya kalıcı **kapalı** (sunucu yoksa).
- Logout: anında **Realtime kapali**.
- Aynı sunucu olayı tekrar yayınlansa liste şişmez (dedup).
- Otomatik: `npm run lint`, `npm run typecheck`, `npm run test -- --watch=false` (politika + dedup testleri).
