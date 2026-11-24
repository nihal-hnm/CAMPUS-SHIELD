import React from 'react';
import { cn } from '../../utils/format';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

interface StatusBadgeProps {
  variant: BadgeVariant;
  label: string;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'badge-success',
  warning: 'badge-warning',
  danger:  'badge-danger',
  neutral: 'badge-neutral',
  info:    'badge-info',
};

const dotColors: Record<BadgeVariant, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger:  'bg-danger',
  neutral: 'bg-text-muted',
  info:    'bg-info',
};

export function StatusBadge({ variant, label, dot = true }: StatusBadgeProps) {
  return (
    <span className={cn('badge', variantClasses[variant])}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', dotColors[variant])} />}
      {label}
    </span>
  );
}

export function ClassificationBadge({ classification }: { classification: string }) {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    public:       { variant: 'info',    label: 'Public' },
    internal:     { variant: 'neutral', label: 'Internal' },
    confidential: { variant: 'warning', label: 'Confidential' },
    restricted:   { variant: 'danger',  label: 'Restricted' },
  };
  const cfg = map[classification] ?? { variant: 'neutral' as BadgeVariant, label: classification };
  return <StatusBadge variant={cfg.variant} label={cfg.label} />;
}
