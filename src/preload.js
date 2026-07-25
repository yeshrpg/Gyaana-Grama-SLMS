import { contextBridge, ipcRenderer } from 'electron';

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('api', {
  books: {
    getAll: (filters) => ipcRenderer.invoke('books:getAll', filters),
    search: (searchTerm, genre, language, status) => ipcRenderer.invoke('books:search', searchTerm, genre, language, status),
    getById: (id) => ipcRenderer.invoke('books:getById', id),
    add: (book) => ipcRenderer.invoke('books:add', book),
    update: (book) => ipcRenderer.invoke('books:update', book),
    delete: (id) => ipcRenderer.invoke('books:delete', id),
    getCount: () => ipcRenderer.invoke('books:getCount'), // ADD THIS LINE
  },
  members: {
    getAll: () => ipcRenderer.invoke('members:getAll'),
    search: (searchTerm) => ipcRenderer.invoke('members:search', searchTerm),
    getById: (id) => ipcRenderer.invoke('members:getById', id),
    add: (member) => ipcRenderer.invoke('members:add', member),
    update: (member) => ipcRenderer.invoke('members:update', member),
    deactivate: (id) => ipcRenderer.invoke('members:deactivate', id),
  },
  transactions: {
    issue: (bookId, memberId, dueDate) => ipcRenderer.invoke('transactions:issue', bookId, memberId, dueDate),
    return: (transactionId, fineAmount, finePaid) => ipcRenderer.invoke('transactions:return', transactionId, fineAmount, finePaid),
    getOverdue: () => ipcRenderer.invoke('transactions:getOverdue'),
    getByMember: (memberId, includeReturned) => ipcRenderer.invoke('transactions:getByMember', memberId, includeReturned),
    getRecent: () => ipcRenderer.invoke('transactions:getRecent'),
    getAllIssued: () => ipcRenderer.invoke('transactions:getAllIssued'),
    getMemberLoanCounts: (memberIds) => ipcRenderer.invoke('transactions:getMemberLoanCounts', memberIds),
  },
  settings: {
    get: (key) => ipcRenderer.invoke('settings:get', key),
    set: (key, value) => ipcRenderer.invoke('settings:set', key, value),
    setPinHash: (pinHash) => ipcRenderer.invoke('settings:setPinHash', pinHash),
    getPinHashInternal: () => ipcRenderer.invoke('settings:getPinHashInternal'), // For main process PIN verification only
  },
  backup: {
    runManual: () => ipcRenderer.invoke('backup:runManual'),
    runNow: () => ipcRenderer.invoke('backup:now'),
    restore: () => ipcRenderer.invoke('backup:restore'),
    getFolderInfo: () => ipcRenderer.invoke('backup:getFolderInfo'),
  },
  stats: {
    getDashboard: () => ipcRenderer.invoke('stats:getDashboard'),
  },
  utils: {
    getAppVersion: () => ipcRenderer.invoke('utils:getAppVersion'),
  },
  importAndroidDb: () => ipcRenderer.invoke('import-android-db'),
  barcodeLookupBook: (accessionId) => ipcRenderer.invoke('barcode:lookupBook', accessionId),
  barcodeLookupMember: (memberId) => ipcRenderer.invoke('barcode:lookupMember', memberId),
  barcodeAddBook: (fields) => ipcRenderer.invoke('barcode:addBook', fields),
  barcodeIssueBook: (payload) => ipcRenderer.invoke('barcode:issueBook', payload),
  barcodeReturnBook: (payload) => ipcRenderer.invoke('barcode:returnBook', payload),
  // Renderer to Main communication (e.g., for toasts or modals that might need main process interaction)
  // Currently, toasts are handled in renderer, but keep this for potential future expansion.
  // Example: ipcRenderer.send('show-notification', 'Title', 'Message');
  // Or: ipcRenderer.on('main-process-message', (event, message) => console.log(message));
});
