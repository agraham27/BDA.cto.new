import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes, DetailedHTMLProps } from 'react';

export type ButtonProps = DetailedHTMLProps<
  ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
> & {
  variant?: 'primary' | 'secondary' | 'ghost';
};

export function Button({ className, variant = 'primary', type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        {
          primary: 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:outline-blue-600',
          secondary:
            'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 focus-visible:outline-gray-300',
          ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus-visible:outline-gray-200',
        }[variant],
        className
      )}
      {...props}
    />
  );
}
