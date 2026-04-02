import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set } from 'firebase/database';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

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

const wb = XLSX.readFile('/Users/serkankalmaz/Desktop/TOPLU GİRİS-2.xlsx');
const ws = wb.Sheets['TOPLU GİRİŞ'];
const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
const dataRows = rawRows.slice(1).filter(r => r[3]);

const itemMap = {};
const priceMap = {};
const qtyMap = {};

dataRows.forEach(r => {
    const [, , , malzeme, miktar, birim, birimFiyat, , kategori] = r;
    if (!malzeme) return;
    const name = String(malzeme).trim();
    if (!itemMap[name]) {
        itemMap[name] = { unit: birim || 'ADET', category: kategori || 'GENEL' };
        priceMap[name] = [];
        qtyMap[name] = 0;
    }
    if (birimFiyat && Number(birimFiyat) > 0) priceMap[name].push(Number(birimFiyat));
    qtyMap[name] += Number(miktar) || 0;
});

async function run() {
    console.log('Eski veriler siliniyor...');
    await Promise.all([
        set(ref(db, 'items'), null),
        set(ref(db, 'movements'), null),
        set(ref(db, 'categories'), null),
        set(ref(db, 'zimmet'), null),
        set(ref(db, 'irsaliyeler'), null),
        set(ref(db, 'sevkiyat'), null),
        set(ref(db, 'requests'), null),
        set(ref(db, 'pendingActions'), null),
    ]);
    console.log('Eski veriler silindi.');

    const cats = ['HIRDAVAT', 'ELEKTRİK', 'MEKANİK', 'YAPI MALZEMESİ', 'DEMİRBAŞ', 'İSG', 'MUTFAK'];
    await set(ref(db, 'categories'), cats);
    console.log('Kategoriler yazıldı.');

    const itemsObj = {};
    let itemIndex = 1;
    const itemNameToId = {};
    for (const [name, info] of Object.entries(itemMap)) {
        const prices = priceMap[name];
        const avgPrice = prices.length > 0
            ? Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100
            : null;
        const id = itemIndex++;
        itemNameToId[name] = id;
        itemsObj[String(id)] = {
            id,
            name,
            unit: info.unit,
            category: info.category,
            quantity: qtyMap[name],
            minStock: 0,
            avgPrice: avgPrice,
            priceLabel: avgPrice !== null ? avgPrice : 'fiyat belirtilmemiş',
        };
    }
    await set(ref(db, 'items'), itemsObj);
    console.log(`${Object.keys(itemsObj).length} malzeme yazıldı.`);

    const movementsObj = {};
    dataRows.forEach((r, i) => {
        const [tarih, firma, irsaliye, malzeme, miktar, birim, birimFiyat, toplam, kategori] = r;
        if (!malzeme) return;
        const name = String(malzeme).trim();
        const itemId = itemNameToId[name];

        let dateStr = '';
        if (typeof tarih === 'number') {
            const d = XLSX.SSF.parse_date_code(tarih);
            dateStr = `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
        } else if (tarih) {
            dateStr = String(tarih).substring(0, 10);
        }

        const id = 1700000000000 + i * 1000;
        movementsObj[String(id)] = {
            id,
            itemId,
            itemName: name,
            type: 'in',
            normalizedType: 'in',
            amount: Number(miktar) || 0,
            unit: birim || 'ADET',
            date: dateStr,
            recipient: firma || '',
            note: `İrsaliye: ${irsaliye || ''} | Birim Fiyat: ${birimFiyat || '-'} | Toplam: ${toplam || '-'}`,
            source: firma || '',
            irsaliyeNo: irsaliye || '',
            birimFiyat: Number(birimFiyat) || 0,
            toplamFiyat: Number(toplam) || 0,
            category: kategori || 'GENEL',
        };
    });
    await set(ref(db, 'movements'), movementsObj);
    console.log(`${Object.keys(movementsObj).length} hareket yazıldı.`);

    console.log('✅ Tamamlandı!');
    process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
