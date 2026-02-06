const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        title: "OERA Sales CRM",
        icon: path.join(__dirname, 'logo.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    win.loadFile('index.html');
    win.setMenuBarVisibility(false);
}

let desktopBackupPath = 'C:\\OERA_CRM_Backups';

// IPC Listener to set custom backup path
ipcMain.on('set-backup-path', (event, newPath) => {
    desktopBackupPath = newPath;
    console.log("Backup path updated to:", desktopBackupPath);
});

// IPC Listener for Silent Backups (Unified)
ipcMain.on('save-backup', (event, { data, fileName }) => {
    try {
        const backupDir = desktopBackupPath;

        // Create directory if it doesn't exist
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        // Always use fixed name for Auto-backups to prevent clutter
        let finalFileName = fileName;
        if (fileName.includes('AUTO_SYNC') || fileName.includes('AUTO_BACKUP')) {
            finalFileName = 'OERA_LATEST_AUTO_SYNC.json';
        }

        const filePath = path.join(backupDir, finalFileName);

        // Force Overwrite (Silent)
        fs.writeFileSync(filePath, data);
        console.log("Silent Sync completed at:", filePath);
        event.reply('save-backup-success', { path: filePath, isAuto: fileName.includes('AUTO') });
    } catch (err) {
        console.error("Critical Save Error:", err);
        event.reply('save-backup-error', err.message);
    }
});

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
