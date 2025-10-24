import { cn } from '@/lib/utils';
import { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined';
}

export function Card({ className, variant = 'default', children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-white transition-shadow',
        {
          default: 'border-gray-200 shadow-sm',
          elevated: 'border-transparent shadow-card',
          outlined: 'border-gray-300 shadow-none hover:border-primary-400',
        }[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: ReactNode;
  description?: ReactNode;
}

export function CardHeader({ className, title, description, children, ...props }: CardHeaderProps) {
  return (
    <div className={cn('border-b border-gray-100 p-5', className)} {...props}>
      {title && <h3 className="font-semibold text-gray-900">{title}</h3>}
      {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      {children}
    </div>
  );
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5', className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('border-t border-gray-100 p-5', className)} {...props} />;
}
