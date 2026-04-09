import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, set, remove } from 'firebase/database';

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

// 1. Personel listesini çek
const personelSnap = await get(ref(db, 'personel'));
const personelData = personelSnap.val() || {};
const personelNames = new Set(
    Object.values(personelData)
        .map(p => (p.adSoyad || '').toLowerCase().trim())
        .filter(n => n.length >= 2)
);
console.log(`Personel sayısı: ${personelNames.size}`);

// 2. Giriş hareketlerinde miktarı + olan satırlardan firmaAdi + recipient topla
const movSnap = await get(ref(db, 'movements'));
const movements = movSnap.val() || {};
const firmaSet = new Set();

const addIfValid = (val) => {
    const v = (val || '').trim();
    if (v.length >= 3 && !personelNames.has(v.toLowerCase())) firmaSet.add(v);
};

for (const m of Object.values(movements)) {
    if (m.type !== 'in') continue;
    if (Number(m.amount) <= 0) continue;
    addIfValid(m.firmaAdi);
    addIfValid(m.recipient);
}

const firmalar = [...firmaSet].sort((a, b) => a.localeCompare(b, 'tr'));
console.log(`\nToplam ${firmalar.length} geçerli firma bulundu:`);
firmalar.forEach(f => console.log(`  ✓ ${f}`));

// 3. Eski firmalar koleksiyonunu temizle
await remove(ref(db, 'firmalar'));
console.log('\nEski firmalar silindi.');

// 4. Yeni firmalar yaz
let i = 0;
for (const name of firmalar) {
    const id = String(Date.now() + i++);
    await set(ref(db, `firmalar/${id}`), { id, name });
}

console.log(`✓ ${firmalar.length} firma firmalar koleksiyonuna yazıldı.`);
process.exit(0);
