import { app, BrowserWindow, shell, dialog, ipcMain } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { initializeDatabase, getDb } from './db.js';
import { registerIpcHandlers } from './ipc.js';
import { autoDailyBackup } from './backup.js';
import initSqlJs from 'sql.js';

process.env.DIST_ELECTRON = __dirname;
process.env.DIST = path.join(__dirname, '../dist');
// VITE_DEV_SERVER_URL is set by vite-plugin-electron in dev mode; leave it as-is

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    title: 'Gyaana Grama SLMS',
    icon: path.join(app.getAppPath(), 'assets', 'icon.ico'),
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: process.env.VITE_DEV_SERVER_URL ? false : true,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url);
    return { action: 'deny' };
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(process.env.DIST, 'index.html'));
  }
}

app.on('ready', async () => {
  await initializeDatabase();
  console.log('Database initialized.');
  registerIpcHandlers();
  console.log('IPC handlers registered.');
  await autoDailyBackup();
  console.log('Daily backup check completed.');
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

let _androidSQL;
async function getAndroidSQL() {
  if (!_androidSQL) _androidSQL = await initSqlJs();
  return _androidSQL;
}

ipcMain.handle('import-android-db', async () => {
  try {
    const { filePaths, canceled } = await dialog.showOpenDialog({
      title: 'Select Android SQLite Database',
      filters: [{ name: 'SQLite DB', extensions: ['db'] }],
      properties: ['openFile'],
    });
    if (canceled || !filePaths.length) return { cancelled: true };

    const SQL = await getAndroidSQL();
    const buf = fs.readFileSync(filePaths[0]);
    const androidDb = new SQL.Database(buf);
    const rows = androidDb.exec('SELECT * FROM books');
    androidDb.close();

    if (!rows.length || !rows[0].values.length) return { added: 0, merged: 0 };
    const cols = rows[0].columns;
    const data = rows[0].values;

    const db = getDb();
    const result = db.transaction(() => {
      let added = 0, merged = 0;

      const getLastAccession = () => {
        const row = db.prepare("SELECT value FROM settings WHERE key = 'last_accession'").get();
        return row ? parseInt(row.value) : 0;
      };
      const setLastAccession = (val) => {
        db.prepare("UPDATE settings SET value = ? WHERE key = 'last_accession'").run(String(val));
      };

      const dupCheck = db.prepare("SELECT id, total_copies, available_copies FROM books WHERE LOWER(title)=LOWER(?) AND LOWER(COALESCE(author,''))=LOWER(COALESCE(?,''))");
      const updateCopies = db.prepare("UPDATE books SET total_copies = total_copies + 1, available_copies = available_copies + 1 WHERE id = ?");
      const insertBook = db.prepare("INSERT INTO books (accession_id, title, author, publisher, year, genre, language, total_copies, available_copies, status) VALUES (?, ?, ?, ?, ?, ?, 'Kannada', 1, 1, 'available')");

      for (const val of data) {
        const book = {};
        cols.forEach((c, i) => { book[c] = val[i]; });
        const title = book.title || '';
        const author = book.author || '';
        const existing = dupCheck.get(title, author);
        if (existing) {
          updateCopies.run(existing.id);
          merged++;
        } else {
          let accession = getLastAccession() + 1;
          setLastAccession(accession);
          const accessionId = `GG-${String(accession).padStart(4, '0')}`;
          insertBook.run(accessionId, title, author, book.publisher || '', book.year || '', book.genre || '');
          added++;
        }
      }
      return { added, merged };
    });

    return result;
  } catch (err) {
    return { error: err.message };
  }
});