# Shintea — Şantiye Depo Yönetim Sistemi

Şantiye ve depo operasyonları için geliştirilmiş, gerçek zamanlı stok takibi, malzeme hareketleri ve zimmet yönetimi sunan web uygulaması.

---

## Özellikler

### Stok Yönetimi
- Malzeme ekleme, düzenleme ve silme
- Kritik stok seviyesi takibi ve uyarıları
- Birim fiyat ve stok değeri hesaplama
- Stok özeti ve fiyat analizi sayfaları

### Malzeme Hareketleri
- Giriş / Çıkış işlemleri (irsaliye no, firma adı, teslim alan bilgileriyle)
- Tüm hareketlerin filtrelenebilir listesi (Tümü / Giriş / Çıkış)
- Tarih, firma ve malzeme bazında arama

### İrsaliyeler
- İrsaliye numarası bazında gruplanmış giriş listesi
- Satıra tıklayarak akordion detay görünümü
- Tarih, firma, ürün sayısı ve teslim alan bilgileri

### Zimmet Takibi
- Personele zimmet atama
- Zimmet listesi ve detay görünümü

### Kullanıcı Yönetimi
- Firebase Authentication ile e-posta / şifre girişi
- Rol bazlı yetki sistemi: **Yönetici** / **İzleyici**
- Sayfa bazında yetki kontrolü (Gizli / İzle / Düzenle)
- Giriş Ekle, Çıkış Ekle, Zimmet Ekle işlemleri için ayrı yetki seçenekleri

### Dashboard
- Toplam malzeme, kritik stok, bugünkü giriş/çıkış istatistikleri
- Son stok hareketleri özeti
- Modal üzerinden detay listesi

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
| Desktop | Electron (opsiyonel) |

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
# Build al ve Firebase Hosting'e deploy et
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

| Yetki | Yönetici | İzleyici |
|-------|----------|----------|
| Dashboard | Tam erişim | Görüntüle |
| Stok Özeti | Tam erişim | Görüntüle |
| Tüm Hareketler | Tam erişim | Görüntüle + Filtrele |
| İrsaliyeler | Tam erişim | Görüntüle |
| Zimmet | Tam erişim | Görüntüle |
| Giriş / Çıkış / Zimmet Ekle | Evet | Hayır (yönetici verebilir) |
| Kullanıcı Yönetimi | Evet | Hayır |
| Ayarlar | Evet | Hayır |

---

## Lisans

Özel kullanım. Tüm hakları saklıdır.
