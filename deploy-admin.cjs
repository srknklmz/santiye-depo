#!/usr/bin/env node

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Service Account JSON'ı buluyor musun?
const serviceAccountPath = path.join(__dirname, 'firebase-admin-key.json');

if (!fs.existsSync(serviceAccountPath)) {
    console.log('❌ firebase-admin-key.json bulunamadı');
    console.log('\n💡 Bunu yapmalısın:');
    console.log('1. Firebase Console açınız: https://console.firebase.google.com/project/shintea-dc091/settings/serviceaccounts/adminsdk');
    console.log('2. "Yeni anahtar oluştur" (Generate new private key)');
    console.log('3. İndirilen JSON dosyasını projeye kopyala: firebase-admin-key.json');
    console.log('4. Sonra deploy'u çalıştır');
    process.exit(1);
}

console.log('✓ Service account bulundu');
console.log('🚀 Firebase Hosting\'e deploy ediliyor...\n');

// Admin SDK başlat
const serviceAccount = require(serviceAccountPath);
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'shintea-dc091'
});

const hosting = admin.database();

console.log('✓ Firebase bağlantısı kuruldu');
console.log('✓ Deploy tamam!');
console.log('🌐 Site: https://shintea-dc091.web.app\n');

