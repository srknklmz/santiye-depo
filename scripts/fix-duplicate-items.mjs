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

const snap = await get(ref(db, 'items'));
const data = snap.val();
if (!data) { console.log('No items'); process.exit(0); }

const entries = Object.entries(data).map(([key, val]) => ({ key, ...val }));
console.log(`Toplam item sayısı: ${entries.length}`);

// ID bazında grupla
const byId = {};
entries.forEach(e => {
    const id = String(e.id ?? e.key);
    if (!byId[id]) byId[id] = [];
    byId[id].push(e);
});

// Duplicate ID'leri bul
const duplicates = Object.entries(byId).filter(([, arr]) => arr.length > 1);
console.log(`Duplicate ID'li grup sayısı: ${duplicates.length}`);

let totalDeleted = 0;
for (const [id, arr] of duplicates) {
    console.log(`\nID: ${id} — ${arr.length} kopya — İsim: "${arr[0].name}"`);
    // İlk kopyayı tut, diğerlerini sil
    const toDelete = arr.slice(1);
    for (const item of toDelete) {
        console.log(`  Siliniyor: key=${item.key}`);
        await remove(ref(db, `items/${item.key}`));
        totalDeleted++;
    }
}

console.log(`\nToplam silinen: ${totalDeleted} duplicate item`);
process.exit(0);
