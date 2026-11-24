import React, { type ReactNode } from 'react';
import { FileSearch, ServerCrash, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

interface EmptyStateProps { title: string; description?: string; action?: ReactNode; }
interface ErrorStateProps { message: string; code?: string | number; onRetry?: () => void; }
interface LoadingStateProps { rows?: number; message?: string; }

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <FileSearch className="w-10 h-10 text-text-muted" strokeWidth={1.5} />
      <p className="text-sm font-medium text-text">{title}</p>
      {description && <p className="text-sm text-text-muted max-w-xs">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, code, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <ServerCrash className="w-10 h-10 text-danger" strokeWidth={1.5} />
      <p className="text-sm font-medium text-text">Something went wrong</p>
      <p className="text-sm text-text-muted max-w-xs">{message}</p>
      {code && <p className="font-mono text-xs text-text-muted">Error {code}</p>}
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </Button>
      )}
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex gap-4 px-4 py-3 border-b border-border">
      <div className="h-4 bg-neutral-soft rounded flex-1" />
      <div className="h-4 bg-neutral-soft rounded w-24" />
      <div className="h-4 bg-neutral-soft rounded w-20" />
      <div className="h-4 bg-neutral-soft rounded w-16" />
    </div>
  );
}

export function LoadingState({ rows = 8, message }: LoadingStateProps) {
  return (
    <div className="space-y-3">
      {message && <p className="text-sm text-text-muted">{message}</p>}
      <div className="rounded border border-border overflow-hidden">
        {Array.from({ length: rows }).map((_, i) => <SkeletonRow key={i} />)}
      </div>
    </div>
  );
}
