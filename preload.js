const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    saveBackup: (data, fileName) => ipcRenderer.send('save-backup', { data, fileName }),
    setBackupPath: (path) => ipcRenderer.send('set-backup-path', path),
    onSaveSuccess: (callback) => ipcRenderer.on('save-backup-success', (event, path) => callback(path)),
    onSaveError: (callback) => ipcRenderer.on('save-backup-error', (event, err) => callback(err))
});
