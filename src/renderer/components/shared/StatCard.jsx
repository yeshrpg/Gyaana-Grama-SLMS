export default function StatCard({ label, value, icon, trend, variant = 'default' }) {
  const variantStyles = {
    default: 'border-border',
    warning: 'border-amber-800/50',
    danger: 'border-red-800/50',
  };

  const iconBgStyles = {
    default: 'bg-accent/10 text-accent',
    warning: 'bg-amber-900/30 text-amber-400',
    danger: 'bg-red-900/30 text-red-500',
  };

  return (
    <div className={`bg-card-bg rounded-xl p-5 border ${variantStyles[variant]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-400 mb-1">{label}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {trend && (
            <p className={`text-xs mt-2 ${trend.positive ? 'text-success' : 'text-danger'}`}>
              {trend.positive ? '+' : ''}{trend.value} {trend.label || ''}
            </p>
          )}
        </div>
        <div className={`rounded-lg p-2.5 flex-shrink-0 ${iconBgStyles[variant]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
