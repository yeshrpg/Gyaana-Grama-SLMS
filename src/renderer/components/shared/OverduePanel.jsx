import { useTranslation } from 'react-i18next';
import { differenceInDays } from 'date-fns';
import { CheckCircle2, Clock } from 'lucide-react';
import Badge from '../UI/Badge';
import Button from '../UI/Button';

export default function OverduePanel({ items = [], onMarkReturn }) {
  const { t } = useTranslation();
  const getDaysBadge = (days) => {
    if (days > 14) return <Badge variant="danger">{days} days</Badge>;
    if (days >= 8) return <Badge variant="warning">{days} days</Badge>;
    return <Badge variant="default">{days} days</Badge>;
  };

  if (items.length === 0) {
    return (
      <div className="bg-card-bg rounded-xl border border-border p-8 text-center">
        <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-3" />
        <p className="text-success text-sm">{t('overduePanel.noOverdue')}</p>
      </div>
    );
  }

  return (
    <div className="bg-card-bg rounded-xl border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-accent font-semibold">{t('dashboard.overdueBooks')}</h3>
        <Badge variant="danger">{items.length}</Badge>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-card-bg text-gray-400 text-xs uppercase tracking-wider">
              <th className="px-4 py-3 border-b border-border font-medium">{t('overduePanel.book')}</th>
              <th className="px-4 py-3 border-b border-border font-medium">{t('overduePanel.member')}</th>
              <th className="px-4 py-3 border-b border-border font-medium">{t('overduePanel.dueDate')}</th>
              <th className="px-4 py-3 border-b border-border font-medium">{t('overduePanel.days')}</th>
              <th className="px-4 py-3 border-b border-border font-medium">{t('overduePanel.action')}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const days = differenceInDays(new Date(), new Date(item.due_date));
              return (
                <tr key={item.issue_id}
                  className={`
                    border-b border-border/50 transition-colors duration-150
                    ${index % 2 === 0 ? 'bg-app-bg' : 'bg-card-bg'}
                    hover:bg-card-bg
                  `}
                >
                  <td className="px-4 py-3 text-gray-200 font-medium">{item.book_title}</td>
                  <td className="px-4 py-3 text-gray-300">
                    {item.member_name} <span className="text-gray-500 text-xs">(#{item.member_id})</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(item.due_date).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-4 py-3">{getDaysBadge(days)}</td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onMarkReturn(item.issue_id)}
                    >
                      {t('overduePanel.return')}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
