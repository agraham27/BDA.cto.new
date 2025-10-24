import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes, DetailedHTMLProps } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'link' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = DetailedHTMLProps<
  ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  asChild?: boolean;
};

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  type = 'button',
  children,
  disabled,
  asChild = false,
  ...rest
}: ButtonProps) {
  const classes = cn(
    'inline-flex items-center justify-center rounded-xl font-medium transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-70',
    {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-5 py-3 text-base',
    }[size],
    {
      primary:
        'bg-primary-600 text-white shadow-sm hover:bg-primary-700 hover:shadow-md focus-visible:outline-primary-600',
      secondary:
        'bg-white text-gray-900 border border-gray-200 shadow-sm hover:border-primary-300 hover:text-primary-700 focus-visible:outline-primary-400',
      ghost:
        'bg-transparent text-gray-600 hover:bg-gray-100 focus-visible:outline-gray-300 shadow-none border border-transparent',
      link: 'bg-transparent text-primary-600 hover:text-primary-700 underline-offset-4 hover:underline shadow-none',
      danger:
        'bg-danger-600 text-white shadow-sm hover:bg-danger-700 focus-visible:outline-danger-600',
    }[variant],
    className
  );

  if (asChild) {
    return (
      <Slot className={classes} aria-disabled={disabled || loading} aria-busy={loading} {...rest}>
        {loading && (
          <span
            className="mr-2 inline-flex h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
            aria-hidden
          />
        )}
        {children}
      </Slot>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={classes}
      {...rest}
    >
      {loading && (
        <span className="mr-2 inline-flex h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />
      )}
      {children}
    </button>
  );
}
