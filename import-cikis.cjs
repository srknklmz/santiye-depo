const { initializeApp } = require("firebase/app");
const { getDatabase, ref, get, set } = require("firebase/database");
const XLSX = require("xlsx");
const path = require("path");

const firebaseConfig = {
    apiKey: "AIzaSyAOSvWbObTRgqlJ7QWDnyGuWUDlFEUMuv8",
    authDomain: "shintea-dc091.firebaseapp.com",
    projectId: "shintea-dc091",
    databaseURL: "https://shintea-dc091-default-rtdb.europe-west1.firebasedatabase.app/"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

function normalize(str) {
    return String(str || '').trim().toUpperCase()
        .replace(/İ/g, 'I').replace(/Ğ/g, 'G').replace(/Ü/g, 'U')
        .replace(/Ş/g, 'S').replace(/Ö/g, 'O').replace(/Ç/g, 'C')
        .replace(/\s+/g, ' ');
}

function excelDateToStr(val) {
    if (!val) return '';
    // If it's already a string like "2025-11-10"
    if (typeof val === 'string' && val.includes('-')) return val.slice(0, 10);
    // If it's a JS Date
    if (val instanceof Date) {
        const y = val.getFullYear();
        const m = String(val.getMonth() + 1).padStart(2, '0');
        const d = String(val.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
    // If it's an Excel serial number
    if (typeof val === 'number') {
        const date = new Date(Math.round((val - 25569) * 86400 * 1000));
        const y = date.getUTCFullYear();
        const m = String(date.getUTCMonth() + 1).padStart(2, '0');
        const d = String(date.getUTCDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
    return String(val).slice(0, 10);
}

async function main() {
    // 1. Firebase'den items çek
    console.log("Firebase items çekiliyor...");
    const itemsSnap = await get(ref(db, 'items'));
    const itemsData = itemsSnap.val() || {};
    const items = Object.values(itemsData);

    // itemName → item map (normalize edilmiş)
    const itemMap = {};
    items.forEach(item => {
        const key = normalize(item.name);
        itemMap[key] = item;
    });
    console.log(`${items.length} malzeme yüklendi.`);

    // 2. Excel oku
    const excelPath = "/Users/serkankalmaz/Desktop/çıkışar-1.xlsx";
    const wb = XLSX.readFile(excelPath, { cellDates: true });
    const ws = wb.Sheets['SAYFA 3'];
    // Ham veriyi al: row[0] = header, row[1+] = data
    const rawRows = XLSX.utils.sheet_to_json(ws, { defval: '', header: 1 });
    // Boş olan ilk kolonu temizle, sadece değeri olan header'ları al
    const headers = rawRows[0].filter(h => String(h).trim() !== '');
    const colOffset = rawRows[0].findIndex(h => String(h).trim() !== '');
    const rows = rawRows.slice(1).map(r => {
        const obj = {};
        headers.forEach((h, i) => { obj[h] = r[colOffset + i] !== undefined ? r[colOffset + i] : ''; });
        return obj;
    });

    // Sadece ÇIKIŞ satırları
    const cikisRows = rows.filter(r => {
        const islem = String(r['İŞLEM'] || r['ISLEM'] || '').trim().toUpperCase();
        return islem === 'ÇIKIŞ' || islem === 'CIKIS';
    });
    console.log(`Toplam ÇIKIŞ satırı: ${cikisRows.length}`);

    // 3. Mevcut movements'taki max ID bul
    const movSnap = await get(ref(db, 'movements'));
    const movData = movSnap.val() || {};
    const existingIds = Object.keys(movData).map(Number).filter(n => !isNaN(n));
    let baseId = existingIds.length > 0 ? Math.max(...existingIds) + 1000 : Date.now();

    // 4. Her satırı işle
    const notFound = [];
    let imported = 0;
    let skipped = 0;

    for (let i = 0; i < cikisRows.length; i++) {
        const row = cikisRows[i];
        const malzemeAdi = String(row['MALZEME'] || '').trim();
        const malzemeKey = normalize(malzemeAdi);

        // Item bul
        let item = itemMap[malzemeKey];

        // Bulunamazsa kısmi eşleştirme dene
        if (!item) {
            const keys = Object.keys(itemMap);
            const partial = keys.find(k => k.includes(malzemeKey) || malzemeKey.includes(k));
            if (partial) item = itemMap[partial];
        }

        if (!item) {
            notFound.push(malzemeAdi);
            skipped++;
            continue;
        }

        const tarih = excelDateToStr(row['TARİH'] || row['TARIH'] || '');
        const miktar = parseFloat(String(row['MİKTAR'] || row['MIKTAR'] || '0').replace(',', '.')) || 0;
        const birim = String(row['BİRİM'] || row['BIRIM'] || item.unit || '').trim();
        const ekip = String(row['EKİBİ'] || row['EKIBI'] || '').trim();
        const personel = String(row['PERSONEL'] || '').trim();
        const aciklama = String(row['AÇIKLAMA'] || row['ACIKLAMA'] || '').trim();

        const moveId = String(baseId + i);
        const moveData = {
            id: Number(moveId),
            itemId: Number(item.id),
            itemName: item.name,
            amount: miktar,
            unit: birim || item.unit || 'Adet',
            verilenBirim: ekip,
            recipient: personel,
            kullanimAlani: aciklama,
            note: aciklama,
            type: 'out',
            date: tarih,
            depo: '',
        };

        await set(ref(db, `movements/${moveId}`), moveData);
        imported++;

        if (imported % 50 === 0) {
            console.log(`${imported}/${cikisRows.length - skipped} eklendi...`);
        }
    }

    console.log(`\n✅ Tamamlandı!`);
    console.log(`   Eklenen: ${imported}`);
    console.log(`   Atlandı (eşleşme yok): ${skipped}`);

    if (notFound.length > 0) {
        const unique = [...new Set(notFound)];
        console.log(`\n⚠️  Firebase'de bulunamayan malzemeler (${unique.length} farklı):`);
        unique.forEach(n => console.log(`   - ${n}`));
    }

    process.exit(0);
}

main().catch(err => {
    console.error("HATA:", err);
    process.exit(1);
});
