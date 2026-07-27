import React from 'react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: string;
  error?: string | null;
  helperText?: string;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  icon,
  error,
  helperText,
  className = '',
  id,
  type = 'text',
  ...props
}) => {
  const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="space-y-1">
      <label htmlFor={inputId} className="block text-xs font-semibold text-purple-200/80">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 text-[18px] pointer-events-none">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          type={type}
          className={`w-full ${
            icon ? 'pl-10' : 'pl-3.5'
          } pr-4 py-2.5 bg-[#120f24] border ${
            error ? 'border-rose-500 focus:ring-rose-500' : 'border-purple-500/20 focus:ring-purple-500'
          } rounded-xl text-xs font-medium text-white placeholder-purple-300/40 focus:ring-2 outline-none transition-all ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="text-[11px] text-rose-400 font-medium animate-in fade-in">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-[11px] text-purple-300/60 font-medium">{helperText}</p>
      )}
    </div>
  );
};
