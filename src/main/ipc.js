import { ipcMain, app } from 'electron';
import { getDb } from './db.js';
import { runManualBackup, runAutoBackupNow, restoreFromBackup, getBackupFolderInfo } from './backup.js';
import { format } from 'date-fns';

export function registerIpcHandlers() {
  let db;
  try {
    db = getDb();
  } catch (err) {
    console.error('IPC: Failed to get database:', err);
    return;
  }

  const executeQuery = (stmtOrFn, ...params) => {
    try {
      if (!db) throw new Error('Database not available');
      const result = typeof stmtOrFn === 'function' ? stmtOrFn(db, ...params) : stmtOrFn.run(...params);
      db.save();
      return { success: true, data: result };
    } catch (error) {
      console.error(`Database operation failed: ${error.message}`, error);
      return { success: false, error: error.message };
    }
  };

  ipcMain.handle('books:getAll', async () => executeQuery(db.prepare('SELECT * FROM books').all));
  ipcMain.handle('books:search', async (event, searchTerm, genre, language, status) => {
    let query = 'SELECT * FROM books WHERE 1=1';
    const params = [];

    if (searchTerm) {
      query += ' AND (title LIKE ? OR title_kn LIKE ? OR author LIKE ? OR author_kn LIKE ? OR accession_id LIKE ? OR publisher LIKE ? OR genre LIKE ? OR language LIKE ? OR notes LIKE ?)';
      params.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
    }
    if (genre && genre !== 'all') {
      query += ' AND genre = ?';
      params.push(genre);
    }
    if (language && language !== 'all') {
      query += ' AND language = ?';
      params.push(language);
    }
    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }
    query += ' ORDER BY title ASC';
    return executeQuery(db.prepare(query).all, ...params);
  });
  ipcMain.handle('books:getById', async (event, id) => executeQuery(db.prepare('SELECT * FROM books WHERE id = ?').get, id));
  ipcMain.handle('books:add', async (event, book) => {
    return executeQuery((dbInstance, newBook) => {
        let accessionId = newBook.accession_id;
        if (!accessionId) {
            const setting = dbInstance.prepare("SELECT value FROM settings WHERE key = 'last_accession'").get();
            let lastAccessionNum = parseInt(setting?.value || '0');
            lastAccessionNum++;
            accessionId = `GG-${String(lastAccessionNum).padStart(4, '0')}`;
            dbInstance.prepare("UPDATE settings SET value = ? WHERE key = 'last_accession'").run(lastAccessionNum.toString());
        }

        const genre = newBook.genre || newBook.category || '';
        const stmt = dbInstance.prepare(`
            INSERT INTO books (accession_id, title, title_kn, author, author_kn, genre, language, publisher, year, total_copies, available_copies, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(
            accessionId, newBook.title || '', newBook.title_kn || '', newBook.author || '', newBook.author_kn || '',
            genre, newBook.language || '', newBook.publisher || '', newBook.year || '',
            newBook.total_copies || 1, newBook.total_copies || 1, newBook.notes || ''
        );
        return { id: result.lastInsertRowid, accession_id: accessionId, ...newBook };
    }, book);
  });
  ipcMain.handle('books:update', async (event, book) => {
    const existing = db.prepare('SELECT * FROM books WHERE id = ?').get(book.id);
    if (!existing) return { success: false, error: 'Book not found' };
    const stmt = db.prepare(`
        UPDATE books
        SET accession_id = ?, title = ?, title_kn = ?, author = ?, author_kn = ?, genre = ?, language = ?, publisher = ?, year = ?, total_copies = ?, available_copies = ?, status = ?, notes = ?
        WHERE id = ?
    `);
    return executeQuery(stmt,
      book.accession_id ?? existing.accession_id,
      book.title, book.title_kn, book.author, book.author_kn, book.genre, book.language,
      book.publisher, book.year, book.total_copies,
      book.available_copies ?? existing.available_copies,
      book.status ?? existing.status,
      book.notes, book.id
    );
  });
  ipcMain.handle('books:delete', async (event, id) => {
    const stmt = db.prepare('UPDATE books SET status = \'damaged\' WHERE id = ?');
    return executeQuery(stmt, id);
  });

  ipcMain.handle('members:getAll', async () => executeQuery(db.prepare('SELECT * FROM members').all));
  ipcMain.handle('members:search', async (event, searchTerm) => {
    let query = 'SELECT * FROM members WHERE 1=1';
    const params = [];
    if (searchTerm) {
      query += ' AND (name LIKE ? OR name_kn LIKE ? OR phone LIKE ? OR member_id LIKE ? OR address LIKE ? OR address_kn LIKE ? OR notes LIKE ?)';
      params.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
    }
    query += ' ORDER BY name ASC';
    return executeQuery(db.prepare(query).all, ...params);
  });
  ipcMain.handle('members:getById', async (event, id) => executeQuery(db.prepare('SELECT * FROM members WHERE id = ?').get, id));
  ipcMain.handle('members:add', async (event, member) => {
    return executeQuery((dbInstance, newMember) => {
        const setting = dbInstance.prepare("SELECT value FROM settings WHERE key = 'last_member_id'").get();
        let lastMemberNum = parseInt(setting.value || '0');
        lastMemberNum++;
        const memberId = `MEM-${String(lastMemberNum).padStart(4, '0')}`;

        dbInstance.prepare("UPDATE settings SET value = ? WHERE key = 'last_member_id'").run(lastMemberNum.toString());

        const stmt = dbInstance.prepare(`
            INSERT INTO members (member_id, name, name_kn, phone, address, address_kn, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(
            memberId, newMember.name, newMember.name_kn, newMember.phone,
            newMember.address, newMember.address_kn, newMember.notes
        );
        return { id: result.lastInsertRowid, member_id: memberId, ...newMember };
    }, member);
  });
  ipcMain.handle('members:update', async (event, member) => {
    const existing = db.prepare('SELECT * FROM members WHERE id = ?').get(member.id);
    if (!existing) return { success: false, error: 'Member not found' };
    const stmt = db.prepare(`
        UPDATE members
        SET member_id = ?, name = ?, name_kn = ?, phone = ?, address = ?, address_kn = ?, is_active = ?, notes = ?
        WHERE id = ?
    `);
    return executeQuery(stmt,
      member.member_id, member.name, member.name_kn, member.phone, member.address, member.address_kn,
      member.is_active ?? existing.is_active,
      member.notes, member.id
    );
  });
  ipcMain.handle('members:deactivate', async (event, id) => {
    const activeIssues = db.prepare('SELECT COUNT(*) AS count FROM transactions WHERE member_id = ? AND status = \'issued\'').get(id);
    if (activeIssues.count > 0) {
      return { success: false, error: 'Cannot deactivate member with active issued books.' };
    }
    const stmt = db.prepare('UPDATE members SET is_active = 0 WHERE id = ?');
    return executeQuery(stmt, id);
  });

  ipcMain.handle('books:getCount', async () => executeQuery((dbInstance) => {
    const stmt = dbInstance.prepare('SELECT COUNT(*) AS count FROM books WHERE status != \'damaged\'');
    return stmt.get();
  }));

  ipcMain.handle('transactions:issue', async (event, bookId, memberId, dueDate) => {
    try {
      // Validate book
      const book = db.prepare('SELECT id, title, available_copies FROM books WHERE id = ?').get(bookId);
      if (!book) return { success: false, error: 'Book not found (id=' + bookId + ')' };
      if (book.available_copies < 1) return { success: false, error: '"' + book.title + '" has no available copies' };

      // Validate member
      const member = db.prepare('SELECT id, name, is_active FROM members WHERE id = ?').get(memberId);
      if (!member) return { success: false, error: 'Member not found (id=' + memberId + ')' };
      if (!member.is_active) return { success: false, error: 'Member is inactive' };

      // Resolve due date
      const issueDate = format(new Date(), 'yyyy-MM-dd');
      let finalDueDate = dueDate;
      if (!finalDueDate) {
        const setting = db.prepare("SELECT value FROM settings WHERE key = 'loan_days'").get();
        const loanDays = parseInt(setting && setting.value ? setting.value : '14');
        const d = new Date();
        d.setDate(d.getDate() + loanDays);
        finalDueDate = format(d, 'yyyy-MM-dd');
      }

      // Atomic transaction
      const doIssue = db.transaction(() => {
        const info = db.prepare(
          "INSERT INTO transactions (book_id, member_id, issue_date, due_date, status) VALUES (?, ?, ?, ?, 'issued')"
        ).run(bookId, memberId, issueDate, finalDueDate);

        // available_copies - 1; if it hits 0 mark book as 'issued'
        db.prepare(
          "UPDATE books SET available_copies = available_copies - 1, status = CASE WHEN available_copies - 1 <= 0 THEN 'issued' ELSE 'available' END WHERE id = ?"
        ).run(bookId);

        return info.lastInsertRowid;
      });

      const txnId = doIssue();
      return { success: true, data: { transactionId: txnId } };
    } catch (err) {
      console.error('transactions:issue error:', err.message, err.stack);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('transactions:return', async (event, transactionId, fineAmount, finePaid) => {
    try {
      const txn = db.prepare('SELECT id, book_id, status FROM transactions WHERE id = ?').get(transactionId);
      if (!txn) return { success: false, error: 'Transaction not found (id=' + transactionId + ')' };
      if (txn.status === 'returned') return { success: false, error: 'Book already returned' };

      const returnDate = format(new Date(), 'yyyy-MM-dd');

      const doReturn = db.transaction(() => {
        // Always set status = 'returned'; store fine info in dedicated columns
        db.prepare(
          "UPDATE transactions SET return_date = ?, status = 'returned', fine_amount = ?, fine_paid = ? WHERE id = ?"
        ).run(returnDate, fineAmount || 0, finePaid ? 1 : 0, transactionId);

        // Restore book availability
        db.prepare(
          "UPDATE books SET available_copies = available_copies + 1, status = 'available' WHERE id = ?"
        ).run(txn.book_id);
      });

      doReturn();
      return { success: true };
    } catch (err) {
      console.error('transactions:return error:', err.message, err.stack);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('transactions:getOverdue', async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const query = `
      SELECT
        t.id,
        t.issue_date,
        t.due_date,
        m.id AS member_id,
        m.name AS member_name,
        m.name_kn AS member_name_kn,
        b.id AS book_id,
        b.title AS book_title,
        b.title_kn AS book_title_kn,
        t.fine_amount
      FROM transactions t
      JOIN members m ON t.member_id = m.id
      JOIN books b ON t.book_id = b.id
      WHERE t.status = 'issued' AND t.due_date < ?
      ORDER BY t.due_date ASC
    `;
    return executeQuery(db.prepare(query).all, today);
  });

  ipcMain.handle('transactions:getByMember', async (event, memberId, includeReturned = false) => {
    let query = `
      SELECT
        t.id, t.book_id, t.member_id, t.issue_date, t.due_date, t.return_date, t.status, t.fine_amount, t.fine_paid,
        b.title AS book_title, b.title_kn AS book_title_kn, b.accession_id,
        m.name AS member_name, m.name_kn AS member_name_kn
      FROM transactions t
      JOIN books b ON t.book_id = b.id
      JOIN members m ON t.member_id = m.id
      WHERE t.member_id = ?
    `;
    const params = [memberId];
    if (!includeReturned) {
      query += ` AND t.status = 'issued'`;
    }
    query += ' ORDER BY t.issue_date DESC';
    return executeQuery(db.prepare(query).all, ...params);
  });

  ipcMain.handle('transactions:getRecent', async () => {
    const query = `
      SELECT
        t.id, t.status, t.issue_date, t.return_date,
        b.title AS book_title, b.title_kn AS book_title_kn,
        m.name AS member_name, m.name_kn AS member_name_kn
      FROM transactions t
      JOIN books b ON t.book_id = b.id
      JOIN members m ON t.member_id = m.id
      ORDER BY t.id DESC
      LIMIT 15
    `;
    return executeQuery(db.prepare(query).all);
  });

  ipcMain.handle('transactions:getAllIssued', async () => {
    const query = `
      SELECT
        t.id, t.issue_date, t.due_date,
        b.id AS book_id, b.title AS book_title, b.title_kn AS book_title_kn, b.accession_id,
        m.id AS member_pk, m.member_id, m.name AS member_name, m.name_kn AS member_name_kn,
        m.phone AS member_phone
      FROM transactions t
      JOIN books b ON t.book_id = b.id
      JOIN members m ON t.member_id = m.id
      WHERE t.status = 'issued'
      ORDER BY t.due_date ASC
    `;
    return executeQuery(db.prepare(query).all);
  });

  ipcMain.handle('settings:get', async (event, key) => {
    if (key === 'pin_hash') {
        const result = executeQuery(db.prepare('SELECT value FROM settings WHERE key = ?').get, key);
        if (result.success && result.data) {
            return { success: true, data: { key: 'pin_set', value: !!result.data.value } };
        }
        return { success: true, data: { key: 'pin_set', value: false } };
    }
    return executeQuery(db.prepare('SELECT value FROM settings WHERE key = ?').get, key);
  });

  ipcMain.handle('settings:set', async (event, key, value) => {
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    return executeQuery(stmt, key, value);
  });

  ipcMain.handle('settings:setPinHash', async (event, pinHash) => {
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    return executeQuery(stmt, 'pin_hash', pinHash);
  });

  ipcMain.handle('settings:getPinHashInternal', async () => {
    return executeQuery(db.prepare('SELECT value FROM settings WHERE key = \'pin_hash\'').get);
  });

  ipcMain.handle('backup:runManual', async () => runManualBackup());
  ipcMain.handle('backup:now', async () => runAutoBackupNow());
  ipcMain.handle('backup:restore', async () => restoreFromBackup());
  ipcMain.handle('backup:getFolderInfo', async () => getBackupFolderInfo());

  ipcMain.handle('transactions:getMemberLoanCounts', async (event, memberIds) => {
    try {
      if (!memberIds || memberIds.length === 0) return { success: true, data: {} };
      const placeholders = memberIds.map(() => '?').join(',');
      const rows = db.prepare(`
        SELECT member_id, COUNT(*) as active_count
        FROM transactions
        WHERE member_id IN (${placeholders}) AND status = 'issued'
        GROUP BY member_id
      `).all(...memberIds);
      const map = {};
      for (const r of rows) map[r.member_id] = r.active_count;
      return { success: true, data: map };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('stats:getDashboard', async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    try {
      const totalBooks = db.prepare('SELECT COUNT(*) AS count FROM books WHERE status != \'damaged\'').get().count;
      const totalMembers = db.prepare('SELECT COUNT(*) AS count FROM members WHERE is_active = 1').get().count;
      const issuedBooks = db.prepare("SELECT COUNT(*) AS count FROM transactions WHERE status = 'issued'").get().count;
      const overdueCount = db.prepare("SELECT COUNT(*) AS count FROM transactions WHERE status = 'issued' AND due_date < ?").get(today).count;

      return {
        success: true,
        data: { totalBooks, totalMembers, issuedBooks, overdueCount }
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('utils:getAppVersion', async () => {
    return { success: true, data: app.getVersion() };
  });

  /**
   * Import books from an external SQLite database (e.g. from Android).
   * Opens a file dialog, reads the external db, and inserts missing books.
   */
  ipcMain.handle('books:importDB', async () => {
    try {
      const { filePaths, canceled } = await dialog.showOpenDialog({
        title: 'Select SQLite database exported from Gyaana Grama SLMS',
        filters: [{ name: 'SQLite Database', extensions: ['db', 'sqlite', 'sqlite3'] }],
        properties: ['openFile'],
      });
      if (canceled || filePaths.length === 0) return { success: false, error: 'No file selected' };

      const externalPath = filePaths[0];
      const extDb = new Database(externalPath, { readonly: true });

      // Determine table names (support both 'books' and old 'titles')
      const tables = extDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r => r.name);
      const bookTable = tables.includes('books') ? 'books' : (tables.includes('titles') ? 'titles' : null);
      if (!bookTable) {
        extDb.close();
        return { success: false, error: 'No books/titles table found in the selected database.' };
      }

      const rows = extDb.prepare(`SELECT * FROM ${bookTable}`).all();
      extDb.close();

      if (rows.length === 0) return { success: false, error: 'No books found in the selected database.' };

      const insert = db.prepare(`
        INSERT OR IGNORE INTO books (accession_id, title, title_kn, author, author_kn, publisher, genre, notes, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'available')
      `);

      const batch = db.transaction((items) => {
        let inserted = 0;
        for (const row of items) {
          const acc = row.accession_id || row.accession || row.id?.toString() || '';
          const info = insert.run(
            acc,
            row.title || '',
            row.title_kn || row.kannada_title || '',
            row.author || '',
            row.author_kn || row.kannada_author || '',
            row.publisher || '',
            row.genre || row.category || '',
            row.notes || ''
          );
          if (info.changes > 0) inserted++;
        }
        return inserted;
      });

      const inserted = batch(rows);
      const firstAcc = rows[0]?.accession_id || rows[0]?.accession || rows[0]?.id || '?';

      return {
        success: true,
        count: inserted,
        range: `${firstAcc} … ${rows.length} rows, ${inserted} new`
      };
    } catch (error) {
      console.error('Error importing database:', error);
      return { success: false, error: error.message };
    }
  });

  /**
   * Check if an accession_id already exists (for duplicate detection).
   */
  ipcMain.handle('books:checkAccession', async (_event, accessionId) => {
    try {
      const row = db.prepare('SELECT id FROM books WHERE accession_id = ?').get(accessionId);
      return { success: true, exists: !!row };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('books:getOverdueCount', async () => {
    try {
      const result = db.prepare("SELECT COUNT(*) as c FROM transactions WHERE due_date < date('now') AND return_date IS NULL").get();
      return result?.c || 0;
    } catch (error) {
      console.error('Error in getOverdueCount:', error);
      return 0;
    }
  });

  // Barcode scanner handlers
  ipcMain.handle('barcode:lookupBook', async (_event, accessionId) => {
    try {
      const book = db.prepare('SELECT * FROM books WHERE accession_id = ?').get(accessionId);
      if (!book) return { success: false, message: 'Book not found' };
      return { success: true, book };
    } catch (e) {
      return { success: false, message: e.message };
    }
  });

  ipcMain.handle('barcode:lookupMember', async (_event, memberId) => {
    try {
      const numId = parseInt(memberId);
      const member = db.prepare("SELECT * FROM members WHERE member_id = ? OR id = ? OR phone = ? OR name LIKE ? OR name_kn LIKE ?").get(memberId, isNaN(numId) ? 0 : numId, memberId, `%${memberId}%`, `%${memberId}%`);
      if (!member) return { success: false, message: 'Member not found' };
      return { success: true, member };
    } catch (e) {
      return { success: false, message: e.message };
    }
  });

  ipcMain.handle('barcode:addBook', async (_event, fields) => {
    return executeQuery((dbInstance) => {
      const { accessionId, title, author, publisher, year, genre } = fields;
      const existing = dbInstance.prepare('SELECT id FROM books WHERE accession_id = ?').get(accessionId);
      if (existing) throw new Error(`Accession ID ${accessionId} already exists`);
      const stmt = dbInstance.prepare(`
        INSERT INTO books (accession_id, title, author, publisher, year, genre, total_copies, available_copies, status)
        VALUES (?, ?, ?, ?, ?, ?, 1, 1, 'available')
      `);
      stmt.run(accessionId, title, author, publisher, year, genre);
      return { success: true, message: `Book "${title}" added successfully` };
    });
  });

  ipcMain.handle('barcode:issueBook', async (_event, { accessionId, memberId }) => {
    return executeQuery((dbInstance) => {
      const book = dbInstance.prepare('SELECT id, title, available_copies FROM books WHERE accession_id = ?').get(accessionId);
      if (!book) throw new Error('Book not found');
      if (book.available_copies < 1) throw new Error(`"${book.title}" is currently issued to another member`);

      const member = dbInstance.prepare("SELECT id, name FROM members WHERE member_id = ? OR id = ? OR phone = ? OR name LIKE ? OR name_kn LIKE ?").get(memberId, parseInt(memberId) || 0, memberId, `%${memberId}%`, `%${memberId}%`);
      if (!member) throw new Error('Member not found');

      const loanDaysRes = dbInstance.prepare("SELECT value FROM settings WHERE key = 'loan_days'").get();
      const loanDays = parseInt(loanDaysRes?.value || '14');
      const issueDate = format(new Date(), 'yyyy-MM-dd');
      const dueDate = format(new Date().setDate(new Date().getDate() + loanDays), 'yyyy-MM-dd');

      dbInstance.prepare(`
        INSERT INTO transactions (book_id, member_id, issue_date, due_date, status)
        VALUES (?, ?, ?, ?, 'issued')
      `).run(book.id, member.id, issueDate, dueDate);

      dbInstance.prepare('UPDATE books SET available_copies = available_copies - 1, status = CASE WHEN available_copies - 1 = 0 THEN \'issued\' ELSE status END WHERE id = ?').run(book.id);

      return { success: true, message: `"${book.title}" issued to ${member.name}. Due: ${dueDate}` };
    });
  });

  ipcMain.handle('barcode:returnBook', async (_event, { accessionId }) => {
    return executeQuery((dbInstance) => {
      const book = dbInstance.prepare('SELECT id, title FROM books WHERE accession_id = ?').get(accessionId);
      if (!book) throw new Error('Book not found');

      const activeIssue = dbInstance.prepare("SELECT id FROM transactions WHERE book_id = ? AND status = 'issued'").get(book.id);
      if (!activeIssue) throw new Error(`"${book.title}" has no active issue to return`);

      const returnDate = format(new Date(), 'yyyy-MM-dd');
      dbInstance.prepare("UPDATE transactions SET return_date = ?, status = 'returned' WHERE id = ?").run(returnDate, activeIssue.id);
      dbInstance.prepare('UPDATE books SET available_copies = available_copies + 1, status = \'available\' WHERE id = ?').run(book.id);

      return { success: true, message: `"${book.title}" returned successfully` };
    });
  });

  ipcMain.handle('reports:getGenreBreakdown', async () => {
    try {
      const data = db.prepare('SELECT genre, COUNT(*) as count FROM books GROUP BY genre ORDER BY count DESC').all();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('reports:getTransactionLog', async (_event, limit = 50) => {
    try {
      const query = `
        SELECT t.id, t.status, t.issue_date, t.return_date, t.due_date,
               b.title AS book_title, b.title_kn AS book_title_kn,
               m.name AS member_name, m.name_kn AS member_name_kn
        FROM transactions t
        JOIN books b ON t.book_id = b.id
        JOIN members m ON t.member_id = m.id
        ORDER BY t.id DESC
        LIMIT ?
      `;
      const data = db.prepare(query).all(limit);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}