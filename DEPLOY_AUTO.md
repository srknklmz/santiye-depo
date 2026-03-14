# 🚀 Otomatik Deploy Guide

## Kurulum (Bir kez yap)

```bash
# Firebase CLI kur
npm install -g firebase-tools

# Firebase'e giriş yap
firebase login

# Artık istediğin zaman deploy edebilirsin!
```

## Deploy Et

Kod değişikliği yaptıktan sonra:

```bash
# Proje dizininde
cd /sessions/serene-fervent-ride/mnt/santiye-depo

# Deploy script'i çalıştır
./deploy.sh
```

Ya da manuel:

```bash
npm run build && firebase deploy --project shintea-dc091 --only hosting
```

## GitHub Actions ile Otomatik Deploy

Alternatif olarak, GitHub repo'da `.github/workflows/deploy.yml` dosyası var. 
Her `main` branch'e push'ta otomatik build ve deploy olacak.

Gerekli:
1. GitHub repo → Settings → Secrets
2. `FIREBASE_SERVICE_ACCOUNT_SHINTEA_DC091` secret'ı ekle
   - Value: Firebase Console'dan indirilen service account JSON

## Site URL

✅ https://shintea-dc091.web.app

## Sorun Giderme

### "Firebase CLI bulunamadı"
```bash
npm install -g firebase-tools
firebase login
```

### "Deploy başarısız - auth hatası"
```bash
firebase logout
firebase login
```

### Build hatası
```bash
npm install
npm run build
```

---

**İpucu:** `./deploy.sh` script'i her zaman çalıştır, elle `npm run build` yapma! 
Script otomatik dependency'leri kontrol eder, build eder, deploy eder.
