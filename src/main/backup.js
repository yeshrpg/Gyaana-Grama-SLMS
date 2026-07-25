import { app, dialog } from 'electron';
import path from 'node:path';
import fsPromises from 'node:fs/promises';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { getDbPath, reloadDbConnection } from './db.js';
import { format } from 'date-fns';

const BACKUP_DIR_NAME = 'backups';
const MAX_AUTO_BACKUPS = 7;

function getBackupsPath() {
    const userDataPath = app.getPath('userData');
    const backupDirPath = path.join(userDataPath, BACKUP_DIR_NAME);
    if (!existsSync(backupDirPath)) {
        mkdirSync(backupDirPath, { recursive: true });
    }
    return backupDirPath;
}

export async function autoDailyBackup() {
    const backupDirPath = getBackupsPath();
    const today = format(new Date(), 'yyyy-MM-dd');
    const dbFilePath = getDbPath();

    try {
        const files = await fsPromises.readdir(backupDirPath);
        const todayBackupExists = files.some(file => file.startsWith(`gyaana_grama_backup_${today}`));

        if (!todayBackupExists) {
            const backupFileName = `gyaana_grama_backup_${today}.db`;
            const destinationPath = path.join(backupDirPath, backupFileName);
            await fsPromises.copyFile(dbFilePath, destinationPath);
            console.log(`Auto daily backup created: ${destinationPath}`);
        } else {
            console.log(`Auto daily backup for ${today} already exists. Skipping.`);
        }

        await cleanupOldBackups(backupDirPath);

    } catch (error) {
        console.error('Error during auto daily backup:', error);
    }
}

async function cleanupOldBackups(backupDirPath) {
    try {
        const files = (await fsPromises.readdir(backupDirPath))
            .filter(file => file.startsWith('gyaana_grama_backup_') && file.endsWith('.db'))
            .map(file => ({
                name: file,
                path: path.join(backupDirPath, file),
                mtime: statSync(path.join(backupDirPath, file)).mtime.getTime()
            }))
            .sort((a, b) => b.mtime - a.mtime);

        if (files.length > MAX_AUTO_BACKUPS) {
            for (let i = MAX_AUTO_BACKUPS; i < files.length; i++) {
                await fsPromises.unlink(files[i].path);
                console.log(`Deleted old backup: ${files[i].name}`);
            }
        }
    } catch (error) {
        console.error('Error cleaning up old backups:', error);
    }
}

export async function runAutoBackupNow() {
  const backupDirPath = getBackupsPath();
  const dbFilePath = getDbPath();
  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
  const backupFileName = `gyaana_grama_backup_${timestamp}.db`;
  const destinationPath = path.join(backupDirPath, backupFileName);

  try {
    await fsPromises.copyFile(dbFilePath, destinationPath);
    console.log(`Manual backup saved to: ${destinationPath}`);
    await cleanupOldBackups(backupDirPath);
    return { success: true, path: destinationPath };
  } catch (error) {
    console.error('Error during auto backup now:', error);
    return { success: false, error: error.message };
  }
}

export async function runManualBackup() {
    try {
        const { canceled, filePaths } = await dialog.showOpenDialog({
            properties: ['openDirectory'],
            title: 'Select a folder to save backup',
        });

        if (canceled || filePaths.length === 0) {
            return { success: false, error: 'Backup cancelled by user.' };
        }

        const destinationFolder = filePaths[0];
        const dbFilePath = getDbPath();
        const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
        const backupFileName = `gyaana_grama_backup_${timestamp}.db`;
        const destinationPath = path.join(destinationFolder, backupFileName);

        await fsPromises.copyFile(dbFilePath, destinationPath);
        console.log(`Manual backup saved to: ${destinationPath}`);
        return { success: true, path: destinationPath };

    } catch (error) {
        console.error('Error during manual backup:', error);
        return { success: false, error: error.message };
    }
}

export async function restoreFromBackup() {
    try {
        const { canceled, filePaths } = await dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [{ name: 'Database Files', extensions: ['db'] }],
            title: 'Select a backup file to restore from',
        });

        if (canceled || filePaths.length === 0) {
            return { success: false, error: 'Restore cancelled by user.' };
        }

        const sourcePath = filePaths[0];
        const dbFilePath = getDbPath();

        await fsPromises.copyFile(sourcePath, dbFilePath);
        await reloadDbConnection();
        console.log(`Database restored from: ${sourcePath}`);
        return { success: true };

    } catch (error) {
        console.error('Error during database restore:', error);
        return { success: false, error: error.message };
    }
}

export async function getBackupFolderInfo() {
    try {
        const backupDirPath = getBackupsPath();
        const files = (await fsPromises.readdir(backupDirPath))
            .filter(file => file.startsWith('gyaana_grama_backup_') && file.endsWith('.db'));

        return { success: true, data: { path: backupDirPath, count: files.length } };
    } catch (error) {
        console.error('Error getting backup folder info:', error);
        return { success: false, error: error.message };
    }
}