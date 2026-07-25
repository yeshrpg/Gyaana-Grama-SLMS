import { Loader2 } from 'lucide-react';

function Table({ columns, data, onRowClick, loading, emptyMessage = 'No data', className = '' }) {
  if (loading) {
    return (
      <div className={`w-full overflow-x-auto ${className}`}>
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-card-bg text-gray-400 text-xs uppercase tracking-wider">
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 border-b border-border/50 font-medium" style={col.width ? { width: col.width } : undefined}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center">
                <Loader2 className="h-6 w-6 animate-spin text-accent mx-auto" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={`w-full overflow-x-auto ${className}`}>
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-card-bg text-gray-400 text-xs uppercase tracking-wider">
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 border-b border-border/50 font-medium" style={col.width ? { width: col.width } : undefined}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="bg-app-bg">
              <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                {emptyMessage}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <table className="w-full text-sm text-left border-collapse">
        <thead>
          <tr className="bg-card-bg text-gray-400 text-xs uppercase tracking-wider">
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 border-b border-border/50 font-medium" style={col.width ? { width: col.width } : undefined}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={`
                border-b border-border/50 transition-colors duration-150
                ${rowIndex % 2 === 0 ? 'bg-app-bg' : 'bg-card-bg'}
                hover:bg-card-bg
                ${onRowClick ? 'cursor-pointer' : ''}
              `}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => {
                const value = row[col.key];
                return (
                  <td key={col.key} className="px-4 py-3 text-gray-200">
                    {col.render ? col.render(value, row) : value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
export { Table };
