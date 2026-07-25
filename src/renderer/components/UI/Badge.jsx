function Badge({ variant = 'default', children }) {
  const variantStyles = {
    available: 'bg-green-900/40 text-green-400 border border-green-800',
    issued: 'bg-amber-900/40 text-accent border border-amber-800',
    overdue: 'bg-red-900/40 text-red-400 border border-red-800',
    success: 'bg-green-900/40 text-green-400 border border-green-800',
    warning: 'bg-amber-900/40 text-accent border border-amber-800',
    danger: 'bg-red-900/40 text-red-400 border border-red-800',
    default: 'bg-gray-800 text-gray-300 border border-gray-700',
  };

  return (
    <span
      className={`
        inline-flex items-center rounded-full text-xs font-medium
        px-2.5 py-0.5
        ${variantStyles[variant] || variantStyles.default}
      `}
    >
      {children}
    </span>
  );
}

export default Badge;
export { Badge };
