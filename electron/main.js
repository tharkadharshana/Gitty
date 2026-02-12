const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = !app.isPackaged;
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

// Configure logging
log.transports.file.level = 'info';
autoUpdater.logger = log;

console.log = log.info;
console.error = log.error;

log.info('App starting...');

// Import the backend server
let serverProcess;

function startBackend() {
    log.info('Starting backend server...');
    if (isDev) {
        return;
    } else {
        try {
            // In production, the dist folder is top-level in the asar or alongside main.js
            const serverPath = path.join(__dirname, '../server/dist/index.js');
            log.info(`Loading server from: ${serverPath}`);
            serverProcess = require(serverPath);
        } catch (err) {
            log.error('Failed to start backend server:', err);
        }
    }
}

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        title: 'Gitty',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        autoHideMenuBar: true
    });

    if (isDev) {
        win.loadURL('http://localhost:5180');
        win.webContents.openDevTools();
    } else {
        const indexPath = path.join(__dirname, '../client/dist/index.html');
        log.info(`Loading frontend from: ${indexPath}`);
        win.loadFile(indexPath).catch(err => {
            log.error('Failed to load index.html:', err);
        });
    }

    // Send log path to frontend once ready
    win.webContents.on('did-finish-load', () => {
        const logPath = log.transports.file.getFile().path;
        log.info(`Sending log path to frontend: ${logPath}`);
        win.webContents.send('log-path', logPath);
    });

    // Auto-updater events
    autoUpdater.on('update-available', () => {
        win.webContents.send('update_available');
    });

    autoUpdater.on('update-downloaded', () => {
        win.webContents.send('update_downloaded');
    });

    // Check for updates
    if (!isDev) {
        autoUpdater.checkForUpdatesAndNotify();
    }
}

app.whenReady().then(() => {
    startBackend();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('restart_app', () => {
    autoUpdater.quitAndInstall();
});
