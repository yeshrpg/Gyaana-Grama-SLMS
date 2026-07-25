CREATE TABLE IF NOT EXISTS books (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  accession_id     TEXT UNIQUE NOT NULL,      -- Format: GG-0001
  title            TEXT NOT NULL,
  title_kn         TEXT,
  author           TEXT,
  author_kn        TEXT,
  genre            TEXT,
  language         TEXT DEFAULT 'Kannada',
  publisher        TEXT,
  year             INTEGER,
  total_copies     INTEGER DEFAULT 1,
  available_copies INTEGER DEFAULT 1,
  status           TEXT DEFAULT 'available',  -- available | issued | lost | damaged
  cover_url        TEXT,
  added_date       TEXT DEFAULT (date('now')),
  notes            TEXT
);

CREATE TABLE IF NOT EXISTS members (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id   TEXT UNIQUE NOT NULL,           -- Format: MEM-0001
  name        TEXT NOT NULL,
  name_kn     TEXT,
  phone       TEXT,
  address     TEXT,
  address_kn  TEXT,
  joined_date TEXT DEFAULT (date('now')),
  is_active   INTEGER DEFAULT 1,
  notes       TEXT
);

CREATE TABLE IF NOT EXISTS transactions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id     INTEGER REFERENCES books(id),
  member_id   INTEGER REFERENCES members(id),
  issue_date  TEXT NOT NULL,
  due_date    TEXT NOT NULL,                  -- issue_date + loan_days
  return_date TEXT,
  status      TEXT DEFAULT 'issued',          -- issued | returned | overdue | lost
  fine_amount REAL DEFAULT 0,
  fine_paid   INTEGER DEFAULT 0,
  notes       TEXT
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT
);

-- Seed default settings
INSERT OR IGNORE INTO settings VALUES ('pin_hash',        '');
INSERT OR IGNORE INTO settings VALUES ('library_name',    'Gyaana Grama Library');
INSERT OR IGNORE INTO settings VALUES ('library_name_kn', 'ಜ್ಞಾನ ಗ್ರಾಮ ಗ್ರಂಥಾಲಯ');
INSERT OR IGNORE INTO settings VALUES ('loan_days',       '14');
INSERT OR IGNORE INTO settings VALUES ('fine_per_day',    '1');
INSERT OR IGNORE INTO settings VALUES ('language',        'en');
INSERT OR IGNORE INTO settings VALUES ('last_accession',  '0');
INSERT OR IGNORE INTO settings VALUES ('last_member_id',  '0');
