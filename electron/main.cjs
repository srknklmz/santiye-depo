const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
    const isDev = process.env.NODE_ENV === 'development';

    const win = new BrowserWindow({
        width: 1100,
        height: 800,
        title: "Shintea",
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.cjs')
        },
    });

    if (isDev) {
        const devUrl = 'http://localhost:5173';
        win.loadURL(devUrl).catch(() => {
            win.loadFile(path.join(__dirname, '../dist/index.html'));
        });

        win.webContents.on('did-fail-load', () => {
            win.loadFile(path.join(__dirname, '../dist/index.html'));
        });

        win.webContents.openDevTools();
    } else {
        win.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    // Remove menu bar on Windows/Linux, keep it standard on Mac
    if (process.platform !== 'darwin') {
        win.setMenuBarVisibility(false);
    }
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
