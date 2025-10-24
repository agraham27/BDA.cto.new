import { cn } from '@/lib/utils';
import { HTMLAttributes, ReactNode } from 'react';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: ReactNode;
}

const variantStyles: Record<AlertVariant, string> = {
  info: 'border-primary-200 bg-primary-50 text-primary-900',
  success: 'border-success-200 bg-success-50 text-success-900',
  warning: 'border-warning-200 bg-warning-50 text-warning-900',
  error: 'border-danger-200 bg-danger-50 text-danger-900',
};

const variantIcons: Record<AlertVariant, string> = {
  info: 'ℹ️',
  success: '✅',
  warning: '⚠️',
  error: '❌',
};

export function Alert({ variant = 'info', title, children, className, ...props }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn('flex gap-3 rounded-xl border p-4', variantStyles[variant], className)}
      {...props}
    >
      <div className="flex-shrink-0 text-lg">{variantIcons[variant]}</div>
      <div className="flex-1">
        {title && <div className="mb-1 font-semibold">{title}</div>}
        {children && <div className="text-sm">{children}</div>}
      </div>
    </div>
  );
}
