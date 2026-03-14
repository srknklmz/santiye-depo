#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const PROJECT_ID = 'shintea-dc091';
const DIST_DIR = path.join(__dirname, 'dist');

console.log('🚀 Firebase Hosting Deploy Başlatılıyor...');
console.log(`📁 Proje: ${PROJECT_ID}`);
console.log(`📂 Dizi: ${DIST_DIR}`);
console.log('');

// Kontrol: dist klasörü var mı?
if (!fs.existsSync(DIST_DIR)) {
    console.error('❌ dist/ klasörü bulunamadı!');
    process.exit(1);
}

console.log('✓ dist/ klasörü bulundu');

// Firebase tools yüklü mü?
try {
    const firebaseVersion = execSync('./node_modules/.bin/firebase --version', { encoding: 'utf-8' });
    console.log(`✓ Firebase Tools: ${firebaseVersion.trim()}`);
} catch (e) {
    console.error('❌ Firebase Tools bulunamadı. npm install -g firebase-tools çalıştırın.');
    process.exit(1);
}

// Eğer tokenli deploy yapılabiliyorsa deneme:
console.log('\n⏳ Firebase API ile bağlantı test ediliyor...');

const options = {
    hostname: 'firebasehosting.googleapis.com',
    path: `/v1beta1/projects/${PROJECT_ID}/sites`,
    method: 'GET',
    headers: {
        'User-Agent': 'firebase-cli'
    }
};

https.request(options, (res) => {
    if (res.statusCode === 401) {
        console.log('⚠️  Auth gerekli. Firebase CLI kullan:');
        console.log('   firebase login');
        console.log('   firebase deploy --project ' + PROJECT_ID);
        process.exit(1);
    }
    console.log('API kontrol: ' + res.statusCode);
}).on('error', (err) => {
    console.log('API hatası (beklenen): ' + err.message);
    console.log('\n💡 Çözüm: Senin makinede şunu çalıştır:');
    console.log(`   firebase deploy --project ${PROJECT_ID} --only hosting`);
}).end();

