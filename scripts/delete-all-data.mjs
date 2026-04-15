import { initializeApp } from 'firebase/app';
import { getDatabase, ref, remove } from 'firebase/database';

const firebaseConfig = {
    apiKey: "AIzaSyAOSvWbObTRgqlJ7QWDnyGuWUDlFEUMuv8",
    authDomain: "shintea-dc091.firebaseapp.com",
    projectId: "shintea-dc091",
    storageBucket: "shintea-dc091.firebasestorage.app",
    messagingSenderId: "5412538263",
    appId: "1:5412538263:web:fb3cdb792250af9b23e6d2",
    databaseURL: "https://shintea-dc091-default-rtdb.europe-west1.firebasedatabase.app/"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const collections = [
    'items',
    'movements',
    'transfers',
    'zimmet',
    'irsaliyeListesi',
    'irsaliyeMeta',
    'firmalar',
    'personel',
    'teslimAlanlar',
    'verilenBirimler',
    'pendingActions',
    'backups',
    'presence',
    'categories',
    'birimler',
    'malzemeTurleri',
    'kullanimAlanlari',
];

console.log('Silme işlemi başlıyor... (users korunacak)\n');

for (const col of collections) {
    try {
        await remove(ref(db, col));
        console.log(`✓ ${col} silindi`);
    } catch (err) {
        console.error(`✗ ${col} silinemedi:`, err.message);
    }
}

console.log('\nTamamlandı. users koleksiyonu korundu.');
process.exit(0);
