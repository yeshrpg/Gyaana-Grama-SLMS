import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import {
  ArrowUpRight,
  ArrowDownLeft,
  BookPlus,
  UserPlus,
  AlertCircle,
} from 'lucide-react';

export default function ActivityFeed({ activities = [], maxItems = 10 }) {
  const { t } = useTranslation();
  const displayActivities = activities.slice(0, maxItems);

  const getIcon = (type) => {
    switch (type) {
      case 'issue':
        return { Icon: ArrowUpRight, color: 'text-accent', bg: 'bg-accent/10' };
      case 'return':
        return { Icon: ArrowDownLeft, color: 'text-success', bg: 'bg-green-900/30' };
      case 'add_book':
        return { Icon: BookPlus, color: 'text-blue-400', bg: 'bg-blue-900/30' };
      case 'add_member':
        return { Icon: UserPlus, color: 'text-purple-400', bg: 'bg-purple-900/30' };
      case 'overdue':
        return { Icon: AlertCircle, color: 'text-danger', bg: 'bg-red-900/30' };
      default:
        return { Icon: AlertCircle, color: 'text-gray-400', bg: 'bg-gray-800/30' };
    }
  };

  if (displayActivities.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 text-sm">{t('dashboard.noActivity')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {displayActivities.map((activity) => {
        const { Icon, color, bg } = getIcon(activity.type);
        return (
          <div key={activity.id} className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${bg}`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-300">{activity.description}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
