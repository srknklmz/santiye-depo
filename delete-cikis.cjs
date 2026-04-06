const { initializeApp } = require("firebase/app");
const { getDatabase, ref, get, remove } = require("firebase/database");

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

async function deleteCikisIslemleri() {
    console.log("Firebase'e bağlanılıyor...");

    const movementsRef = ref(db, 'movements');
    const snapshot = await get(movementsRef);

    if (!snapshot.exists()) {
        console.log("Hiç hareket kaydı bulunamadı.");
        process.exit(0);
    }

    const data = snapshot.val();
    const keys = Object.keys(data);
    const outKeys = keys.filter(k => data[k].type === 'out');

    console.log(`Toplam hareket: ${keys.length}`);
    console.log(`Çıkış işlemi (type: 'out'): ${outKeys.length} adet`);

    if (outKeys.length === 0) {
        console.log("Silinecek çıkış işlemi yok.");
        process.exit(0);
    }

    let silinen = 0;
    for (const key of outKeys) {
        await remove(ref(db, `movements/${key}`));
        silinen++;
        if (silinen % 10 === 0) console.log(`${silinen}/${outKeys.length} silindi...`);
    }

    console.log(`\n✅ Tamamlandı! ${silinen} adet çıkış işlemi silindi.`);
    process.exit(0);
}

deleteCikisIslemleri().catch(err => {
    console.error("HATA:", err);
    process.exit(1);
});
