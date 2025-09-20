import { Loader2, RotateCcw } from 'lucide-react';
import { cn } from '@/utils';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse' | 'icon';
  color?: 'primary' | 'secondary' | 'white' | 'gray';
  className?: string;
  message?: string;
}

export default function LoadingSpinner({ 
  size = 'md', 
  variant = 'spinner',
  color = 'primary',
  className,
  message
}: LoadingSpinnerProps) {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const colorClasses = {
    primary: 'text-primary-600',
    secondary: 'text-gray-600 dark:text-gray-400',
    white: 'text-white',
    gray: 'text-gray-500',
  };

  const renderSpinner = () => {
    switch (variant) {
      case 'icon':
        return <Loader2 className={cn('animate-spin', sizeClasses[size], colorClasses[color])} />;
      
      case 'dots':
        return (
          <div className="flex gap-1">
            <div className={cn('w-2 h-2 rounded-full animate-bounce', colorClasses[color].replace('text-', 'bg-'))}></div>
            <div className={cn('w-2 h-2 rounded-full animate-bounce', colorClasses[color].replace('text-', 'bg-'))} style={{ animationDelay: '0.1s' }}></div>
            <div className={cn('w-2 h-2 rounded-full animate-bounce', colorClasses[color].replace('text-', 'bg-'))} style={{ animationDelay: '0.2s' }}></div>
          </div>
        );
      
      case 'pulse':
        return (
          <div className={cn('rounded-full animate-pulse', sizeClasses[size], colorClasses[color].replace('text-', 'bg-'))}></div>
        );
      
      default:
        return (
          <div
            className={cn(
              'animate-spin rounded-full border-2 border-gray-300',
              sizeClasses[size],
              color === 'primary' && 'border-t-primary-600',
              color === 'secondary' && 'border-t-gray-600',
              color === 'white' && 'border-t-white',
              color === 'gray' && 'border-t-gray-500'
            )}
          />
        );
    }
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
      {renderSpinner()}
      {message && (
        <span className={cn('text-sm font-medium', colorClasses[color])}>
          {message}
        </span>
      )}
    </div>
  );
}
