# Furkan Petshop Command Center — Vercel başlangıç paketi

Bu paket, Furkan Petshop için özel yönetici girişi, ürün/barkod kataloğu, çok lokasyonlu stok modeli ve satış hızına dayalı Akıllı Stok Asistanı içeren ilk çalışan web uygulaması iskeletidir.

## Bu sürümde bulunanlar

1. Tek yönetici hesabı ve imzalı, HTTP-only oturum çerezi.
2. Ürün oluşturma, barkodla arama ve ürün fiyatlarını görüntüleme.
3. Pendik, Kartal ve Merkez Depo lokasyon modeli.
4. Lokasyon bazında stok kayıtları.
5. Satış API'si: stok kontrolü, stok düşümü ve stok hareketi kaydı aynı veritabanı transaction'ında.
6. Akıllı stok asistanı:
   - Seçilen 7/14/30/60/90 günlük satış geçmişi
   - Günlük ortalama satış hızı
   - Tedarik süresine göre yeniden sipariş noktası
   - Güvenlik stoğu
   - Hedef stok gününe göre önerilen satın alma miktarı
   - Tahmini stokta kalma günü
   - Ürün alış maliyeti üzerinden satın alma bütçesi tahmini
   - CSV dışa aktarma
7. Koyu, cam efektli, hafif 3D görsel dil ve mobil uyum.

## Önemli sınırlar

- Getir Çarşı, Yemeksepeti ve Shopify canlı API bağlantıları bu ilk pakette **aktif değildir**. API erişimleri, mağaza/partner yetkileri ve gerçek alan eşleştirmeleri alındıktan sonra ayrı adaptörler olarak eklenecek.
- Satış ekranı bu ilk sürümde tam mali POS değildir. Ödeme tahsilatı, e-fatura/e-arşiv, mali fiş yazıcısı, iade/değişim ve vardiya kapanışı sonraki fazdır.
- Barkod okuyucuların çoğu USB HID klavye gibi davranır; ürün sayfasındaki barkod alanına odaklanıp okutma bu yöntemle çalışır.
- Tahmin, kayıtlı satış geçmişine dayanır. Gerçek satış verisi yoksa model doğru tahmin üretemez. Örnek seed verisi ürün/lokasyon oluşturur ama geçmiş satış oluşturmaz.
- Öneri otomatik satın alma siparişi vermez. Satın alma önerisi onay akışına dönüştürülmelidir.
- Vercel sürümünde veri PostgreSQL'de tutulur. Bilgisayarda yerel saklama için sonraki Electron + SQLite ve senkronizasyon aşaması gerekir.

## Yerel çalıştırma

Gereksinimler: Node.js 20+, PostgreSQL.

1. ZIP'i açın.
2. `.env.example` dosyasını `.env` olarak kopyalayın.
3. `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SESSION_SECRET` alanlarını doldurun.
   - `SESSION_SECRET` en az 32 karakter olmalı.
   - Yönetici parolasını güçlü ve benzersiz seçin.
4. Terminalde proje klasöründe:

```bash
npm install
npx prisma db push
npm run db:seed
npm run dev
```

5. `http://localhost:3000/login` adresine gidin.

## Vercel'e dağıtım

1. Projeyi özel (private) GitHub deposuna yükleyin.
2. Vercel'de **Add New → Project** ile bu depoyu içe aktarın.
3. Vercel Project Settings → Environment Variables alanına `.env.example` içindeki değişkenleri girin.
4. PostgreSQL için Neon veya Supabase gibi yönetilen bir PostgreSQL sağlayıcısı oluşturun; bağlantı adresini `DATABASE_URL` olarak girin.
5. Build komutu `prisma generate && next build` olarak tanımlıdır.
6. İlk şema kurulumu için güvenli bir ortamda `npx prisma db push` çalıştırın. Seed için `npm run db:seed` komutunu bir defa çalıştırın.
7. Deploy edin ve `/login` üzerinden giriş yapın.

**Güvenlik:** Veritabanı bağlantı dizisini veya yönetici parolasını istemci koduna koymayın. Bunları yalnızca Vercel Environment Variables içinde saklayın. Demo/örnek ürünleri gerçek stok kabul etmeyin.

## Stok tahmini formülü

- `ortalama günlük satış = seçilen dönemdeki satılan adet / gün sayısı`
- `güvenlik stoğu = max(minimum stok, günlük satış × max(2, tedarik süresi × 0.5))`
- `yeniden sipariş noktası = günlük satış × tedarik süresi + güvenlik stoğu`
- `hedef stok = günlük satış × hedef stok günü + güvenlik stoğu`
- `önerilen sipariş = max(0, hedef stok − eldeki stok)`

Bu başlangıç modeli anlaşılır ve denetlenebilir bir temel sağlar. Daha sonra mevsimsellik, haftanın günü, kampanyalar, kanal talebi, tedarikçi minimum sipariş miktarı, koli içi adet ve mağazalar arası transfer optimizasyonu eklenebilir.

## Sonraki geliştirme sırası

1. Stok giriş/çıkış ve sayım ekranları.
2. Satış/POS arayüzü ve ödeme türleri.
3. Satın alma önerisini taslak siparişe dönüştürme, tedarikçi ve koli/MOQ kuralları.
4. Shopify sipariş/stok entegrasyonu.
5. Getir Çarşı ve Yemeksepeti partner entegrasyonları.
6. Bildirimler (e-posta/WhatsApp), SKT/lot takibi.
7. Electron + SQLite masaüstü sürümü ve çevrimdışı senkronizasyon.
