export default function useDB() {
  const api = window.api;

  if (!api) {
    console.error('useDB: window.api not available (preload not loaded)');
  }

  const handleResult = (result) => {
    if (!result) return null;
    if (result.error) throw new Error(result.error);
    return result.data ?? result;
  };

  const buildSearchClause = (search, columns) => {
    if (!search) return { clause: '', params: [] };
    const like = `%${search}%`;
    const clause = columns.map((c) => `${c} LIKE ?`).join(' OR ');
    return { clause: `WHERE (${clause})`, params: columns.map(() => like) };
  };

  const fetchAll = async (handler, ...args) => {
    try {
      const result = await handler(...args);
      return handleResult(result);
    } catch (err) {
      console.error('useDB: fetch error:', err);
      throw err;
    }
  };

  return {
    Books: {
      getBooks: async (search) => {
        if (!api) return [];
        const data = await fetchAll(api.books.search, search);
        return data || [];
      },
      getBook: async (id) => {
        if (!api) return null;
        return fetchAll(api.books.getById, id);
      },
      addBook: async (data) => {
        if (!api) throw new Error('window.api not available');
        const result = await fetchAll(api.books.add, data);
        return result?.id || result;
      },
      updateBook: async (id, data) => {
        if (!api) throw new Error('window.api not available');
        const result = await fetchAll(() => api.books.update({ id, ...data }));
        return result;
      },
      deleteBook: async (id) => {
        if (!api) return;
        await fetchAll(api.books.delete, id);
      },
    },
    Members: {
      getMembers: async (search) => {
        if (!api) return [];
        const data = await fetchAll(api.members.search, search);
        return data || [];
      },
      getMember: async (id) => {
        if (!api) return null;
        return fetchAll(api.members.getById, id);
      },
      addMember: async (data) => {
        if (!api) throw new Error('window.api not available');
        const result = await fetchAll(api.members.add, data);
        return result?.id || result;
      },
      updateMember: async (id, data) => {
        if (!api) throw new Error('window.api not available');
        const result = await fetchAll(() => api.members.update({ id, ...data }));
        return result;
      },
      deleteMember: async (id) => {
        if (!api) return;
        await fetchAll(api.members.deactivate, id);
      },
    },
    Issues: {
      issueBook: async (book_id, member_id, due_date) => {
        if (!api) throw new Error('window.api not available');
        const result = await fetchAll(() => api.transactions.issue(book_id, member_id, due_date));
        return result?.id || result;
      },
      returnBook: async (issue_id) => {
        if (!api) return;
        await fetchAll(() => api.transactions.return(issue_id, 0, 0));
      },
      getActiveIssues: async () => {
        if (!api) return [];
        const data = await fetchAll(() => api.transactions.getRecent());
        return data?.filter(t => t.status === 'issued') || [];
      },
      getOverdueIssues: async () => {
        if (!api) return [];
        const data = await fetchAll(() => api.transactions.getOverdue());
        return (data || []).map(item => ({ ...item, issue_id: item.id }));
      },
      getCurrentlyIssued: async () => {
        if (!api) return [];
        const data = await fetchAll(() => api.transactions.getAllIssued());
        return data || [];
      },
      getMemberIssues: async (member_id) => {
        if (!api) return [];
        const data = await fetchAll(() => api.transactions.getByMember(member_id, true));
        return data || [];
      },
    },
    Dashboard: {
      getStats: async () => {
        if (!api) return { totalBooks: 0, issuedBooks: 0, totalMembers: 0, overdueCount: 0 };
        const result = await api.stats.getDashboard();
        if (result.success && result.data) {
          return {
            totalBooks: result.data.totalBooks || 0,
            issuedBooks: result.data.issuedBooks || 0,
            totalMembers: result.data.totalMembers || 0,
            overdueCount: result.data.overdueCount || 0,
          };
        }
        return { totalBooks: 0, issuedBooks: 0, totalMembers: 0, overdueCount: 0 };
      },
      getRecentActivity: async (limit = 10) => {
        if (!api) return [];
        const data = await fetchAll(() => api.transactions.getRecent());
        return (data || []).slice(0, limit).map(t => ({
          id: t.id,
          type: t.status === 'returned' ? 'return' : 'issue',
          description: `${t.book_title || 'Book'} - ${t.member_name || 'Member'}`,
          timestamp: t.return_date || t.issue_date || new Date().toISOString(),
        }));
      },
    },
  };
}
