import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, remove } from 'firebase/database';

const firebaseConfig = {
    apiKey: "AIzaSyAOSvWbObTRgqlJ7QWDnyGuWUDlFEUMuv8",
    authDomain: "shintea-dc091.firebaseapp.com",
    databaseURL: "https://shintea-dc091-default-rtdb.europe-west1.firebasedatabase.app/",
    projectId: "shintea-dc091",
    storageBucket: "shintea-dc091.firebasestorage.app",
    messagingSenderId: "5412538263",
    appId: "1:5412538263:web:fb3cdb792250af9b23e6d2"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 1. Movements'tan aktif firma adlarını çek (type=in, firmaAdi >= 3 karakter)
const movSnap = await get(ref(db, 'movements'));
const movements = movSnap.val() || {};
const activeFirms = new Set(
    Object.values(movements)
        .filter(m => m.firmaAdi && m.firmaAdi.trim().length >= 3)
        .map(m => m.firmaAdi.trim().toLowerCase())
);

console.log(`Movements'ta bulunan geçerli firma sayısı: ${activeFirms.size}`);
console.log([...activeFirms].sort().map(f => `  - ${f}`).join('\n'));

// 2. firmalar koleksiyonunu çek
const firmSnap = await get(ref(db, 'firmalar'));
const firmalar = firmSnap.val() || {};

const toDelete = [];
const toKeep = [];

for (const [key, firma] of Object.entries(firmalar)) {
    const name = (firma.name || '').trim();
    if (!name || name.length < 3 || !activeFirms.has(name.toLowerCase())) {
        toDelete.push({ key, name });
    } else {
        toKeep.push({ key, name });
    }
}

console.log(`\nSilinecekler (${toDelete.length}):`);
toDelete.forEach(f => console.log(`  ❌ "${f.name}" (key: ${f.key})`));

console.log(`\nKalacaklar (${toKeep.length}):`);
toKeep.forEach(f => console.log(`  ✓ "${f.name}"`));

if (toDelete.length === 0) {
    console.log('\nSilinecek firma yok.');
    process.exit(0);
}

// 3. Sil
for (const f of toDelete) {
    await remove(ref(db, `firmalar/${f.key}`));
    console.log(`Silindi: "${f.name}"`);
}

console.log(`\n✓ ${toDelete.length} geçersiz firma silindi.`);
process.exit(0);
