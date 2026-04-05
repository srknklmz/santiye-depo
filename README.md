# Shintea — Şantiye Depo Yönetim Sistemi

Şantiye ve depo operasyonları için geliştirilmiş, gerçek zamanlı stok takibi, malzeme hareketleri, zimmet ve sarfiyat analizi sunan web uygulaması.

**Canlı:** https://shintea-dc091.web.app

---

## Özellikler

### Stok Özeti
- Malzeme bazında toplam giriş, çıkış ve kalan miktarlar
- Kritik stok seviyesi uyarıları
- Stok değeri hesabı (ağırlıklı ortalama birim fiyat × kalan miktar)
- Kategori ve malzeme adı bazında filtreleme
- Detay modalında hareket geçmişi ve birim fiyat görünümü

### Depo Yönetimi
- Çoklu depo desteği (Büyük / Orta / Küçük Depo)
- Depolar arası malzeme transferi
- Depo bazında stok dağılımı kartları

### Malzeme Hareketleri — Tüm Hareketler
- Giriş / Çıkış / Zimmet hareketlerinin tek listede takibi
- Tarih, malzeme, firma, irsaliye no ve tür bazında filtreleme
- Sütun bazında sıralama (tarih formatından bağımsız doğru sıralama)
- Satır renklendirme, toplu silme ve düzenleme
- Excel / PDF export

### Giriş Ekle
- Çoklu satır desteği (tek işlemde birden fazla malzeme)
- Birim fiyat, irsaliye no, firma adı, teslim alan
- Geçmişe yönelik tarih girişi

### Çıkış Ekle
- Çoklu satır desteği
- Ekip / taşeron ve personel atama
- Geçmişe yönelik tarih girişi

### İrsaliyeler
- İrsaliye numarası bazında gruplanmış giriş listesi
- Akordion detay görünümü (malzeme, miktar, birim fiyat, toplam tutar)
- Tarih bazında sıralama

### Zimmet
- Personele malzeme zimmet atama
- Zimmet iade takibi
- Zimmette / iade edildi durumları

### Sarfiyat
- Ekip / taşeron bazında masraf kartları (toplam tutar, hareket sayısı, % pay, progress bar)
- Personel bazında harcama özeti tablosu
- Toplam çıkış tutarı göstergesi (Stok Özeti ile tutarlı hesaplama)
- Ekip filtresi ve arama

### Fiyat Analizi
- Malzeme bazında ağırlıklı ortalama birim fiyat
- Toplam harcama ve stok değeri hesapları

### Kullanıcı Yönetimi
- Firebase Authentication ile e-posta / şifre girişi
- Rol bazlı yetki sistemi: **Yönetici** / **İzleyici**
- Sayfa bazında yetki kontrolü (Gizli / İzle / Düzenle)
- Giriş / Çıkış / Zimmet Ekle aksiyonları için ayrı yetki seçenekleri

---

## Teknolojiler

| Katman | Teknoloji |
|--------|-----------|
| Frontend | React 18 + Vite |
| Veritabanı | Firebase Realtime Database |
| Auth | Firebase Authentication |
| Stil | CSS (custom, dark/light mode) |
| İkonlar | Lucide React |
| PDF Export | jsPDF + jspdf-autotable |
| Excel Export | SheetJS (xlsx) |
| Deploy | Firebase Hosting |

---

## Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev

# Production build
npm run build
```

### Firebase Yapılandırması

`src/firebase.js` dosyasında Firebase proje bilgileri tanımlıdır. Kendi projeniz için bu dosyayı Firebase Console'dan aldığınız config ile güncelleyin.

---

## Deploy

```bash
npm run build
./node_modules/.bin/firebase deploy --project <PROJECT_ID> --only hosting
```

---

## Proje Yapısı

```
src/
├── App.jsx          # Ana uygulama (tüm sayfalar ve bileşenler)
├── firebase.js      # Firebase yapılandırması
├── index.css        # Global stiller
└── main.jsx         # React giriş noktası
```

---

## Roller ve Yetkiler

| Sayfa | Yönetici | İzleyici |
|-------|----------|----------|
| Stok Özeti | Tam erişim | Görüntüle |
| Depo | Tam erişim | Görüntüle |
| Tüm Hareketler | Tam erişim | Görüntüle + Filtrele |
| İrsaliyeler | Tam erişim | Görüntüle |
| Zimmet | Tam erişim | Görüntüle |
| Sarfiyat | Tam erişim | Görüntüle |
| Fiyat Analizi | Tam erişim | Görüntüle |
| Giriş / Çıkış / Zimmet Ekle | Evet | Hayır (yönetici verebilir) |
| Kullanıcı Yönetimi | Evet | Hayır |

---

## Lisans

Özel kullanım. Tüm hakları saklıdır.
