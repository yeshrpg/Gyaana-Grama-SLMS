import { forwardRef } from 'react';

const Input = forwardRef(({ label, error, icon, className = '', ...rest }, ref) => {
  const hasIcon = !!icon;
  const hasError = !!error;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-gray-300 text-sm mb-1">{label}</label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={`
            w-full bg-[#1A1D27] border border-gray-600 text-white placeholder-gray-400 rounded-lg px-3 py-2
            ${hasIcon ? 'pl-10' : ''}
            ${hasError
              ? 'border-red-500 text-red-400'
              : 'focus:border-[#F5A623]'}
            focus:outline-none text-sm
            ${className}
          `}
          {...rest}
        />
      </div>
      {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
export { Input };
