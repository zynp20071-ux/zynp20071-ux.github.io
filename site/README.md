# Kişisel Portfolyo Sitesi — İçerik Yönetim Sistemleri Vize Projesi

Statik (WordPress'siz), iki dilli (TR / EN), responsive ve scrollytelling animasyonlu kişisel tanıtım sitesi. Blog içeriği açık kaynaklı **Decap CMS** ile yönetilir (`/admin` paneli).

## Sayfalar

| Dosya | İçerik |
|---|---|
| `index.html` | Anasayfa: hero, hakkımda özeti (kaydırdıkça kelime kelime dolar), yatay kayan projeler, galeri önizlemesi (paralaks), blog özeti |
| `hakkimda.html` | Vesikalık fotoğraf, özgeçmiş, eğitim (kaydırdıkça çizilen zaman çizelgesi), yetenekler, ilgi alanları |
| `projeler.html` + `projeler/*.html` | Projeler (CMS'ten): üst üste yığılan kartlar ve her projenin detay sayfası (süreç, video, galeri) |
| `galeri.html` | Açıklamalı fotoğraflar + büyütme (lightbox, ok tuşlarıyla gezinme) |
| `blog.html` + `blog/*.html` | Blog yazıları (CMS'ten), kategori ve etiketlerle; kategori filtresi |
| `admin/` | Decap CMS yönetim paneli: yazı ekleme, düzenleme, silme, görsel yükleme |
| `iletisim.html` | Adres, telefon, iletişim formu, Google Harita |
| `404.html` | Yanlış adreste çıkan sayfa: karakterle mini koşu oyunu |
| `sitemap.xml`, `robots.txt` | Arama motorları için (otomatik üretilir) |

## Kullanılan teknolojiler

- HTML5, CSS3, JavaScript
- [GSAP + ScrollTrigger](https://gsap.com): kaydırmaya bağlı animasyonlar
- [Lenis](https://lenis.darkroom.engineering): yumuşak kaydırma
- Yazı tipleri: Bricolage Grotesque, Hanken Grotesk ve Space Mono (Google Fonts)
- Kütüphaneler `assets/js/vendor/` klasöründe; internet olmadan da çalışır (yalnızca fontlar ve harita internet ister)

## İçerik Yönetim Sistemi (Decap CMS)

WordPress yerine **Decap CMS** kullanıldı: açık kaynaklı, Git tabanlı ("headless") bir içerik yönetim sistemi. Veritabanı yoktur; içerik, sitenin deposunda dosya olarak tutulur.

Nasıl çalışır:

1. `site-adresin/admin/` adresinden GitHub hesabınla panele girersin.
2. **Blog yazısı** ya da **proje** eklersin / düzenlersin:
   - Yazı: TR/EN başlık, tarih, kategoriler, etiketler, kapak görseli, Markdown metin.
   - Proje: başlık, ders, yıl, sıra, kısa anlatım, araçlar, kapak, isteğe bağlı kısa önizleme videosu (.mp4) ve YouTube/Vimeo bağlantısı, galeri, süreç metni.
3. *Yayınla* deyince CMS içeriği `icerik/blog/*.json` ya da `icerik/projeler/*.json` olarak GitHub deposuna kaydeder. Yüklenen görseller `site/assets/img/blog/` ve `site/assets/img/projeler/` klasörlerine gider.
4. Netlify değişikliği görür, `python3 kaynak/build.py` komutunu çalıştırır (bkz. `netlify.toml`) ve siteyi yeniden üretir. Bir dakika içinde yazı sitede görünür: blog listesinde, ana sayfadaki "son yazılar"da ve kendi sayfasında. Kategori filtreleri ve "sonraki yazı" bağlantısı da otomatik güncellenir.

İlgili dosyalar:

- `site/admin/config.yml`: panel ayarları (alanlar, kategoriler, depo adı)
- `icerik/blog/*.json`: yazılar
- `icerik/projeler/*.json`: projeler (şu anki 6 proje ve süreç metinleri ÖRNEKTİR; kendi projelerinle değiştir)
- `kaynak/blog_cms.py`, `kaynak/proj_cms.py`: içeriği sayfaya dönüştüren kod (Markdown → HTML)

Yazı yazarken: bir kelimeyi `*yıldız*` içine alırsan başlıkta vurgulanır. `> **İpucu:** …` yazarsan sarı ipucu kutusu çıkar. İki dilli etiket için `video kurgu | video editing` yaz.

## Tasarım

- **Tema:** Riso baskı. Floresan pembe, riso mavisi ve parlak sarı, kâğıt dokusu üzerinde. Fotoğraflar tek renkli raster baskı gibi görünür, üzerine gelince renklenir.
- **Yazı tipleri:** Bricolage Grotesque (başlık), Hanken Grotesk (metin), Space Mono (etiketler).
- **Oyun katmanı:**
  - Anasayfada sürüklenebilir çıkartmalar var. Boş bir yere tıklayınca konfeti patlar; parçalar yere düşer, Piksel Zeynep koşup toplar.
  - **Piksel Zeynep:** kafesten çıkarılınca sitede gezer; konfetiye, gizli yıldızlara ve gece/gündüze küçük konuşma baloncuklarıyla tepki verir.
  - **Gece / gündüz:** 20:00–07:00 arası site kendiliğinden gece temasına geçer (yıldızlar, ay); gündüz arka planda piksel güneş, kayan bulutlar ve renkli pırıltılar var. Üstteki ay/güneş düğmesiyle elle değiştirilebilir.
  - **Gizli yıldızlar:** her sayfada bir sarı yıldız saklı; karakter kaç tane kaldığını söyler, 6'sını bulana sırrını verir.
  - **Galeri:** büyütülen her fotoğraf "albüme" toplanır (sayaç + damga, hepsi → başarım); fotoğraf açılınca flaş patlar ve Piksel Zeynep yorum yapar. Sayfanın altında galerideki fotoğraflarla "Eşini bul" hafıza oyunu var (hamle, süre, rekor).
  - Geri gelen ziyaretçiye "Yine geldin!" kartı kaldığı sayfayı hatırlatır. Başlıkların yanındaki süslemeler kaydırdıkça kendini çizer.
  - 17 başarım var; üst menüdeki "Başarımlar" düğmesinden görülebilir.
  - Gizli kod: klavyede ↑↑↓↓←→←→BA ya da anasayfada logoya hızlıca 5 kez tıkla.

## Kendine göre düzenleme

> **Önemli:** Sayfalar `../kaynak/pages/` klasöründeki parçalardan üretiliyor. Metinleri orada düzenle, sonra `python kaynak/build.py` komutunu çalıştır. `site/*.html` dosyalarını doğrudan düzenlersen bir sonraki üretimde değişikliklerin silinir.

Kaynak dosyalarda `DÜZENLE` yazan yorumları ara. Bunlar kişisel bilgilerin olduğu yerleri gösterir.

1. **Fotoğraflar** (`assets/img/`): aynı dosya adlarıyla değiştir.
   - `vesikalik.jpg` → vesikalık fotoğrafın (4:5 oran önerilir)
   - `g1.jpg … g12.jpg` → galeri fotoğrafların (açıklamaları `kaynak/pages/galeri.html` içinde). Yeni fotoğraf eklemek için oradaki bir `<figure>` bloğunu kopyala; albüm sayacı ve hafıza oyunu kendiliğinden güncellenir.
   - Proje ve blog görsellerini CMS panelinden yükle (ya da `icerik/` içindeki JSON'da yolu değiştir).
   - Fotoğrafları ekledikten sonra **`python kaynak/gorsel_optimize.py`** çalıştır: büyük telefon fotoğraflarını siteye uygun boyuta (en fazla 1600 px) küçültür ve fotoğraflardaki **konum (GPS) ve cihaz bilgisini siler**.
2. **Metinler:** her metin iki dilde yazılı: `<span lang="tr">…</span><span lang="en">…</span>`. İkisini birlikte güncelle.
3. **İletişim bilgileri:** e-posta ve konum üç yerde (telefon numarası bilerek konmadı): `iletisim.html`, `hakkimda.html` (PDF özgeçmiş başlığı) ve `kaynak/build.py` (her sayfanın altındaki footer). Değiştirirken üçünü birlikte güncelle.
4. **Harita:** `iletisim.html` içindeki iframe adresinde `q=` kısmına kendi adresini yaz.
5. **Yetenek yüzdeleri:** `hakkimda.html` içinde `data-val="85"` değerleri.
6. **Site adresi:** Netlify'da site adını belirleyince `kaynak/build.py` içindeki `SITE_URL` satırını güncelle (paylaşım kartı, site haritası, arama motorları bunu kullanır).
7. **Paylaşım kartı** (`assets/img/og.png`): link WhatsApp/LinkedIn'de paylaşılınca çıkan görsel. Tasarımı `kaynak/og_kart.html`; değiştirirsen tarayıcıda 1200×630 ekran görüntüsünü alıp aynı adla kaydet.
8. **Özgeçmiş (PDF):** Hakkımda sayfasındaki "Özgeçmişi indir" düğmesi sayfayı A4 özgeçmiş olarak yazdırır / PDF'e kaydeder. Bilgiler sayfadakilerle aynıdır; ayrıca bir dosya güncellemen gerekmez.

## Yayınlama (GitHub + Netlify, ücretsiz)

CMS panelinin yazı kaydedebilmesi için site bir GitHub deposundan yayınlanmalı. Netlify Drop ile sürükle-bırak yayınlarsan site görünür ama panelden kayıt yapılamaz.

1. **GitHub:** https://github.com adresinde ücretsiz hesap aç. `zeynep-portfolyo` adında yeni bir depo oluştur. Proje klasörünün tamamını (`site`, `kaynak`, `icerik`, `netlify.toml`, `.gitignore`) bu depoya yükle. En kolay yol: GitHub Desktop uygulaması.
2. **Netlify:** https://app.netlify.com → *Add new site → Import an existing project → GitHub* → depoyu seç. Ayarları `netlify.toml` dosyasından kendisi okur; *Deploy* de. Sonra *Site configuration → Change site name* ile adı `adin-soyadin` yap.
3. **Panel girişi (bir kerelik):**
   - GitHub'da *Settings → Developer settings → OAuth Apps → New OAuth App* yolunu izle:
     - Homepage URL: `https://adin-soyadin.netlify.app`
     - Authorization callback URL: `https://api.netlify.com/auth/done`
   - Oluşan *Client ID* ve *Client Secret* değerlerini Netlify'da *Site configuration → Access & security → OAuth → Install provider → GitHub* bölümüne yapıştır.
4. `site/admin/config.yml` içinde `repo:` satırına `github-kullanici-adin/zeynep-portfolyo`, `site_url:` ve `display_url:` satırlarına site adresini yaz. Değişikliği GitHub'a gönder.
5. `https://adin-soyadin.netlify.app/admin/` adresine gir, *GitHub ile Giriş* de. Artık yazı ekleyebilirsin.

Formdan gelen mesajlar Netlify panelinde *Forms* sekmesinde görünür.

**Bilgisayarda denemek için (isteğe bağlı):** Node.js kuruluysa proje klasöründe `npx decap-server` çalıştır. Ardından `site` klasörünü yerel sunucuyla aç (`python -m http.server` → `http://localhost:8000/admin/`). Panel GitHub'a değil, doğrudan bilgisayardaki dosyalara yazar. Sonra `python kaynak/build.py` ile sayfaları üret.

> Hoca, siteye erişilemezse diye bir YouTube tanıtım videosu öneriyor. Sitede gezinirken ekranını kaydet (Windows: Win+Alt+R veya OBS) ve videoyu "Liste dışı" olarak YouTube'a yükle.

## Teslim (Teams)

1. Proje klasörünün tamamını (`site`, `kaynak`, `icerik`, `netlify.toml`) zip'le ki CMS'in kaynakları da görünsün. Zip'in adını öğrenci numaran yap. Örnek PowerShell komutu (proje klasöründeyken):
   ```powershell
   Compress-Archive -Path .\site, .\kaynak, .\icerik, .\netlify.toml -DestinationPath .\2024123456.zip
   ```
2. Teams `.zip` kabul etmediği için uzantıyı `.pdf` yap: `2024123456.zip` → `2024123456.pdf`
3. Proje şu anda yaklaşık 4 MB. Kendi fotoğraflarını ekledikten sonra da 500 MB sınırının çok altında kalır.

## Erişilebilirlik ve performans

- Cihazında "hareketi azalt" ayarı açık olan ziyaretçiler için animasyonlar kapanır.
- Klavye ile gezinme ve odak göstergeleri, `alt` metinleri ve `aria` etiketleri var.
- JavaScript yüklenemezse içerik yine görünür.
- Renk kontrastı (WCAG AA), başlık sırası, görsel açıklamaları ve form etiketleri tüm sayfa türlerinde kontrol edildi.
- Ağır işler ölçülüp düzeltildi: kaydırma ve fare hareketinde kare süresi ~7 ms; karakter görselleri ekran çözünürlüğüne göre küçültüldü (6 MB → 0,5 MB).
- Yayınladıktan sonra Chrome'da sağ tık → *İncele* → **Lighthouse** sekmesinden hız, erişilebilirlik ve SEO puanlarını ölçüp ekran görüntüsünü sunumda gösterebilirsin.
