#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

const PROJECT_ID = 'shintea-dc091';

console.log('🚀 Firebase Hosting Deploy Başlatılıyor...');
console.log(`📁 Proje: ${PROJECT_ID}`);
console.log('');

try {
    console.log('📦 Firebase CLI ile deploy ediliyor...\n');
    
    const cmd = `./node_modules/.bin/firebase deploy --project ${PROJECT_ID} --only hosting`;
    execSync(cmd, { 
        stdio: 'inherit',
        cwd: __dirname
    });
    
    console.log('\n✅ Deploy başarılı!');
    console.log(`🌐 Site: https://${PROJECT_ID}.web.app`);
    
} catch (error) {
    console.error('\n❌ Deploy başarısız');
    console.error('Error:', error.message);
    
    console.log('\n💡 İlk kez ise şunu çalıştır:');
    console.log('   firebase login');
    console.log(`   firebase deploy --project ${PROJECT_ID}`);
    
    process.exit(1);
}
