import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function createWindow() {
  const win = new BrowserWindow({
    fullscreen: true, // Tam ekran
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      zoomFactor: 0.9 // Senin istediğin o küçük ekran ayarı
    }
  });

  win.removeMenu(); // Üst menüyü siler

  // Build alınmış dosyayı açmaya çalışır, yoksa localhost açar
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  win.loadFile(indexPath).catch(() => {
    win.loadURL('http://localhost:5173');
  });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });