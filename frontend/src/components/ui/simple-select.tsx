import { cn } from '@/lib/utils';
import { SelectHTMLAttributes } from 'react';

export interface SimpleSelectOption {
  value: string;
  label: string;
}

interface SimpleSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> {
  options: SimpleSelectOption[];
  error?: string;
  className?: string;
}

export function SimpleSelect({ options, error, className, ...props }: SimpleSelectProps) {
  return (
    <div className="space-y-1.5">
      <select
        className={cn(
          'w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm transition-colors',
          'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
          'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400',
          error && 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20',
          className
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-danger-600">{error}</p>}
    </div>
  );
}
