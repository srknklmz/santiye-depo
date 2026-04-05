import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get } from 'firebase/database';

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
const items = snap.val() || {};
const names = Object.values(items).map(i => i.name).sort((a,b) => a.localeCompare(b,'tr'));
names.forEach(n => console.log(JSON.stringify(n)));
process.exit(0);
