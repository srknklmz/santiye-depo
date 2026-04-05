import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, update } from 'firebase/database';

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
    const [itemsSnap, movementsSnap] = await Promise.all([
        get(ref(db, 'items')),
        get(ref(db, 'movements')),
    ]);
    const items = itemsSnap.val() || {};
    const movements = movementsSnap.val() || {};
    const updates = {};

    const findItem = (name) =>
        Object.entries(items).find(([, v]) => v.name && v.name.trim() === name.trim());

    const mergeInto = (keeperName, dupName) => {
        const keeperEntry = findItem(keeperName);
        const dupEntry    = findItem(dupName);
        if (!keeperEntry) { console.log(`UYARI: "${keeperName}" bulunamadı`); return; }
        if (!dupEntry)    { console.log(`UYARI: "${dupName}" bulunamadı`);    return; }

        const [keeperKey, keeperItem] = keeperEntry;
        const [dupKey, dupItem]       = dupEntry;

        const currentQty = updates[`items/${keeperKey}/quantity`] ?? Number(keeperItem.quantity) ?? 0;
        const newQty = currentQty + (Number(dupItem.quantity) || 0);

        const allPrices = [
            ...Object.values(movements).filter(m => String(m.itemId) === String(keeperItem.id) && Number(m.birimFiyat) > 0),
            ...Object.values(movements).filter(m => String(m.itemId) === String(dupItem.id)    && Number(m.birimFiyat) > 0),
        ].map(m => Number(m.birimFiyat));
        const avgPrice = allPrices.length > 0
            ? Math.round((allPrices.reduce((a, b) => a + b, 0) / allPrices.length) * 100) / 100
            : (keeperItem.avgPrice ?? null);

        updates[`items/${keeperKey}/quantity`]   = newQty;
        updates[`items/${keeperKey}/avgPrice`]   = avgPrice;
        updates[`items/${keeperKey}/priceLabel`] = avgPrice !== null ? avgPrice : 'fiyat belirtilmemiş';
        updates[`items/${dupKey}`] = null;

        let moved = 0;
        for (const [mk, mv] of Object.entries(movements)) {
            if (String(mv.itemId) === String(dupItem.id)) {
                updates[`movements/${mk}/itemId`]   = keeperItem.id;
                updates[`movements/${mk}/itemName`] = keeperItem.name;
                moved++;
            }
        }
        console.log(`  "${dupName}" → "${keeperName}" | qty ${currentQty}+${dupItem.quantity}=${newQty}, ${moved} hareket`);
    };

    mergeInto('EPOKSİ TABANCASI', 'EPOKSİ TABANCASI - MUADİL METAL 410ML');

    const count = Object.keys(updates).length;
    if (count === 0) { console.log('Değişiklik yok.'); process.exit(0); }
    console.log(`\n${count} güncelleme uygulanıyor...`);
    await update(ref(db), updates);
    console.log('✅ Tamamlandı!');
    process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
