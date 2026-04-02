import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, set, update } from 'firebase/database';

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

async function main() {
    const itemsSnap = await get(ref(db, 'items'));
    const movementsSnap = await get(ref(db, 'movements'));

    const items = itemsSnap.val() || {};
    const movements = movementsSnap.val() || {};

    // Helper: find item by name (case-insensitive trim)
    const findItem = (name) => {
        const norm = name.trim().toLowerCase();
        return Object.entries(items).find(([, v]) => v.name && v.name.trim().toLowerCase() === norm);
    };

    const updates = {};

    // ─── 1. Bardak karton sil ─────────────────────────────────────────────────
    const bardakEntry = findItem('BARDAK KARTON 7 OZ (3000/AD)');
    if (bardakEntry) {
        const [bardakKey, bardakItem] = bardakEntry;
        console.log(`Siliniyor: bardak karton (id=${bardakItem.id})`);
        updates[`items/${bardakKey}`] = null;
        // ilgili hareketleri de sil
        let deletedMov = 0;
        for (const [mk, mv] of Object.entries(movements)) {
            if (String(mv.itemId) === String(bardakItem.id)) {
                updates[`movements/${mk}`] = null;
                deletedMov++;
            }
        }
        console.log(`  ${deletedMov} hareket silindi.`);
    } else {
        console.log('UYARI: bardak karton bulunamadı');
    }

    // ─── Helper: merge two items ──────────────────────────────────────────────
    // keeper = korunan, dup = silinecek
    const mergeItems = (keeperName, dupName) => {
        const keeperEntry = findItem(keeperName);
        const dupEntry = findItem(dupName);
        if (!keeperEntry) { console.log(`UYARI: "${keeperName}" bulunamadı`); return; }
        if (!dupEntry) { console.log(`UYARI: "${dupName}" bulunamadı`); return; }

        const [keeperKey, keeperItem] = keeperEntry;
        const [dupKey, dupItem] = dupEntry;

        console.log(`\nBirleştiriliyor: "${dupName}" → "${keeperName}"`);
        console.log(`  Keeper id=${keeperItem.id} qty=${keeperItem.quantity}`);
        console.log(`  Dup    id=${dupItem.id}    qty=${dupItem.quantity}`);

        // yeni miktar = toplam
        const newQty = (Number(keeperItem.quantity) || 0) + (Number(dupItem.quantity) || 0);

        // ortalama fiyat: ağırlıklı ortalama
        const keeperMovs = Object.values(movements).filter(m => String(m.itemId) === String(keeperItem.id) && m.birimFiyat > 0);
        const dupMovs    = Object.values(movements).filter(m => String(m.itemId) === String(dupItem.id) && m.birimFiyat > 0);
        const allPrices  = [...keeperMovs, ...dupMovs].map(m => Number(m.birimFiyat)).filter(p => p > 0);
        const avgPrice   = allPrices.length > 0
            ? Math.round((allPrices.reduce((a, b) => a + b, 0) / allPrices.length) * 100) / 100
            : keeperItem.avgPrice;

        updates[`items/${keeperKey}/quantity`] = newQty;
        updates[`items/${keeperKey}/avgPrice`] = avgPrice;
        updates[`items/${keeperKey}/priceLabel`] = avgPrice !== null ? avgPrice : 'fiyat belirtilmemiş';
        updates[`items/${dupKey}`] = null;

        // dup'a ait hareketleri keeper'a yönlendir
        let reassigned = 0;
        for (const [mk, mv] of Object.entries(movements)) {
            if (String(mv.itemId) === String(dupItem.id)) {
                updates[`movements/${mk}/itemId`] = keeperItem.id;
                updates[`movements/${mk}/itemName`] = keeperItem.name;
                reassigned++;
            }
        }
        console.log(`  Yeni qty=${newQty}, avgPrice=${avgPrice}, ${reassigned} hareket taşındı.`);
    };

    // ─── 2. BATTANİYE- YORGAN + YORGAN → YORGAN ─────────────────────────────
    mergeItems('YORGAN', 'BATTANİYE- YORGAN');

    // ─── 3. KONTROL KALEMİ - 190 MM + İZELTAŞ KONTROL KALEMİ 190 MM ────────
    mergeItems('KONTROL KALEMİ - 190 MM', 'İZELTAŞ KONTROL KALEMİ 190 MM');

    // ─── Uygula ───────────────────────────────────────────────────────────────
    if (Object.keys(updates).length === 0) {
        console.log('\nHiçbir değişiklik yok.');
        process.exit(0);
    }

    console.log(`\nToplam ${Object.keys(updates).length} güncelleme uygulanıyor...`);
    await update(ref(db), updates);
    console.log('✅ Tamamlandı!');
    process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
