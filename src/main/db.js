import path from 'node:path';
import fs from 'node:fs';
import { app } from 'electron';
import initSqlJs from 'sql.js';

let db;
let dbPath;
let SQL;

function findSchemaPath() {
  const candidates = [
    path.join(app.getAppPath(), 'db', 'schema.sql'),
    path.join(process.env.DIST_ELECTRON || '', 'db', 'schema.sql'),
    path.join(__dirname, '..', '..', 'db', 'schema.sql'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('schema.sql not found in any expected location');
}

function createStatement(sql) {
  const stmt = db.prepare(sql);
  return {
    all: (...args) => {
      stmt.reset();
      const params = args.filter(a => typeof a === 'string' || typeof a === 'number' || typeof a === 'boolean' || a === null);
      if (params.length) stmt.bind(params);
      const rows = [];
      while (stmt.step()) rows.push(stmt.getAsObject());
      return rows;
    },
    get: (...args) => {
      stmt.reset();
      const params = args.filter(a => typeof a === 'string' || typeof a === 'number' || typeof a === 'boolean' || a === null);
      if (params.length) stmt.bind(params);
      const row = stmt.step() ? stmt.getAsObject() : undefined;
      return row;
    },
    run: (...args) => {
      stmt.reset();
      const params = args.filter(a => typeof a === 'string' || typeof a === 'number' || typeof a === 'boolean' || a === null);
      if (params.length) stmt.bind(params);
      stmt.step();
      const changes = db.getRowsModified();
      const rowidStmt = db.prepare('SELECT last_insert_rowid() as id');
      const lastInsertRowid = rowidStmt.step() ? rowidStmt.getAsObject().id : 0;
      rowidStmt.free();
      return { lastInsertRowid, changes };
    },
  };
}

function saveDb() {
  try {
    const data = db.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  } catch (err) {
    console.error('sql.js: save error:', err);
  }
}

export async function initializeDatabase() {
  SQL = await initSqlJs();

  const userDataPath = app.getPath('userData');
  const dbDir = path.join(userDataPath, 'database');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  dbPath = path.join(dbDir, 'library.db');

  console.log(`Database path: ${dbPath}`);

  try {
    if (fs.existsSync(dbPath)) {
      const buffer = fs.readFileSync(dbPath);
      db = new SQL.Database(buffer);
    } else {
      db = new SQL.Database();
    }

    db.run('PRAGMA cache_size = -4000');
    db.run('PRAGMA foreign_keys = ON');

    const schemaPath = findSchemaPath();
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.run(schema);
    console.log('Database schema executed successfully.');

    saveDb();

    const lastAccession = createStatement("SELECT value FROM settings WHERE key = 'last_accession'").get();
    if (!lastAccession || isNaN(parseInt(lastAccession.value))) {
      createStatement("INSERT OR REPLACE INTO settings (key, value) VALUES ('last_accession', '0')").run();
    }
    const lastMemberId = createStatement("SELECT value FROM settings WHERE key = 'last_member_id'").get();
    if (!lastMemberId || isNaN(parseInt(lastMemberId.value))) {
      createStatement("INSERT OR REPLACE INTO settings (key, value) VALUES ('last_member_id', '0')").run();
    }

  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

export function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  const transaction = (fn) => {
    const wrapped = (...args) => {
      try {
        db.run('BEGIN TRANSACTION');
        const result = fn(...args);
        db.run('COMMIT');
        saveDb();
        return result;
      } catch (err) {
        try { db.run('ROLLBACK'); } catch (_) {}
        throw err;
      }
    };
    return wrapped;
  };

  return {
    prepare: (sql) => createStatement(sql),
    exec: (sql) => { db.run(sql); saveDb(); },
    transaction,
    close: () => { db.close(); },
    export: () => db.export(),
    save: () => saveDb(),
  };
}

export function getDbPath() {
  if (!dbPath) {
    throw new Error('Database path not set. Call initializeDatabase() first.');
  }
  return dbPath;
}

export async function reloadDbConnection() {
  if (db) {
    db.close();
    console.log('Database connection closed.');
  }
  return initializeDatabase();
}