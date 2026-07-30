# Gyaana Grama SLMS (ಜ್ಞಾನ ಗ್ರಾಮ ಗ್ರಂಥಾಲಯ)

> Offline bilingual library management system for Sathnur village library.

## About

Gyaana Grama SLMS is a desktop library management application built for the Gyaana Grama community library in Sathnur village. Designed to run on modest hardware (Pentium G630, 4GB DDR3), it provides a complete offline workflow for cataloguing books, managing members, and tracking issue/return transactions. The interface is fully bilingual (English / Kannada).

## Features

- **Book Catalogue** — Add, edit, search, and filter books by title, author, genre, language, and status. Quick-add mode for batch cataloguing.
- **Member Management** — Add, edit, search, and deactivate members. Auto-generates MEM-XXXX IDs.
- **Issue / Return** — Three-step guided flow: select member, select book (with real-time overdue detection), confirm with fine calculation. Optional custom due date.
- **Barcode Scanner** — Look up books by accession ID and members by ID/name/phone. Quick issue and return via barcode.
- **Dashboard** — At-a-glance stats (total books, members, issued, overdue) plus list of currently issued books with days remaining.
- **Reports** — Transaction log and genre breakdown.
- **Settings** — Fine per day, loan period (days), PIN lock.
- **Backup & Restore** — Manual and automatic backups with restore from backup folder.
- **Android DB Import** — Import book catalogue exported from the companion Flutter app.
- **Bilingual UI** — Full English/Kannada toggle via i18next. Kannada virtual keyboard for data entry.
- **Accession IDs** — Auto-generated GG-XXXX format.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Electron 31.7.7 |
| UI | React 18 |
| Build | Vite 5.4.21 |
| Database | sql.js (SQLite compiled to WASM/JS) |
| Styling | Tailwind CSS |
| Icons | lucide-react |
| Dates | date-fns |
| i18n | i18next |
| Packager | electron-builder (portable .exe) |

## Installation

### Prerequisites

- Windows 7+
- No external database engine required (sql.js runs in-process)

### Download

Download the latest portable `.exe` from the [releases page](https://github.com/your-org/gyaana-grama-slms/releases).

Run `GyaanaGrama-SLMS.exe` — no installation needed.

## Build from Source

### Prerequisites

- Node.js 18+
- npm

### Steps

```bash
git clone <repo-url>
cd GyaanaGrama-SLMS
npm install
npm run build
```

The portable `.exe` will be written to `release/GyaanaGrama-SLMS.exe` (~75.7 MB).

### Development

```bash
npm run dev     # Vite dev server
npm run electron # Launch Electron pointing at the dev server
```

## Project Structure

```
GyaanaGrama-SLMS/
├── assets/                  # App icons
├── db/
│   └── schema.sql           # Database schema
├── release/                 # Build output (portable .exe)
├── src/
│   ├── main/
│   │   ├── db.js            # sql.js database wrapper
│   │   ├── ipc.js           # IPC handlers (books, members, transactions, etc.)
│   │   ├── index.js         # Electron main process entry
│   │   └── backup.js        # Backup/restore logic
│   ├── renderer/
│   │   ├── components/      # Reusable UI components
│   │   ├── hooks/           # Custom hooks (useDB, useDebounce, etc.)
│   │   ├── pages/           # Page components (Books, Members, IssueReturn, etc.)
│   │   ├── i18n/            # Localization files (en.json, kn.json)
│   │   ├── App.jsx          # App root with router
│   │   └── main.jsx         # React entry point
│   └── preload.js           # Context bridge (renderer ↔ main)
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

### Database

- **Engine:** sql.js (SQLite compiled to JavaScript/WASM)
- **Location:** `%APPDATA%\gyaana-grama-slms\database\library.db`
- **Schema:** `db/schema.sql`

## Credits

- **YESH** — Lead developer (Electron/React frontend & backend)
## License

MIT
