# Furkan Petshop Command Center — Demo

Bu sürüm yalnızca tasarım ve kullanıcı deneyimini Vercel üzerinde test etmek içindir. PostgreSQL, Neon, giriş bilgisi veya environment variable gerekmez.

## GitHub / Vercel
1. Bu klasörün içeriğini GitHub'da Private bir depoya yükleyin.
2. Vercel > Add New > Project ile depoyu import edin.
3. Framework: Next.js. Build command: `npm run build`.
4. Environment Variables eklemeden Deploy'a basın.

## Demo özellikleri
- Genel bakış ve örnek KPI'lar
- Akıllı stok asistanı için örnek satış hızları ve sipariş önerileri
- Ürün/barkod arama ve demo ürün ekleme
- Pendik, Kartal ve Merkez Depo lokasyonları
- CSV dışa aktarma

## Önemli
Bu demo sürümünde örnek ürünler ve tahmini satışlar kullanılır. Eklenen ürünler tarayıcının localStorage alanında tutulur; başka cihazlarda görünmez ve tarayıcı verileri silinirse kaybolur. Gerçek çok kullanıcılı veri, güvenli giriş, PostgreSQL ve canlı satış kanalı entegrasyonları sonraki üretim sürümünde eklenmelidir.
