import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/format';

type AlertType = 'error' | 'success' | 'info' | 'warning';

interface InlineAlertProps {
  type: AlertType;
  message: string;
  className?: string;
}

const alertStyles: Record<AlertType, { bg: string; text: string; icon: React.ComponentType<{ className?: string }> }> = {
  error:   { bg: 'bg-danger-soft border border-danger/20',   text: 'text-danger-dark',   icon: AlertCircle },
  success: { bg: 'bg-success-soft border border-success/20', text: 'text-success',       icon: CheckCircle },
  info:    { bg: 'bg-info-soft border border-info/20',       text: 'text-info',          icon: Info },
  warning: { bg: 'bg-warning-soft border border-warning/20', text: 'text-warning-dark',  icon: AlertTriangle },
};

export function InlineAlert({ type, message, className }: InlineAlertProps) {
  const { bg, text, icon: Icon } = alertStyles[type];
  return (
    <div className={cn('flex items-start gap-2 rounded px-3 py-2.5 text-sm', bg, text, className)} role="alert">
      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}
