import React, { type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/format';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  footer?: ReactNode;
  danger?: boolean;
}

const sizeMap = { sm: 'max-w-[400px]', md: 'max-w-[560px]', lg: 'max-w-[720px]' };

export function Modal({ open, onClose, title, size = 'md', children, footer, danger }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="absolute inset-0 bg-navy/50" onClick={onClose} />
      <div className={cn('relative bg-surface rounded shadow-modal w-full flex flex-col', sizeMap[size])}>
        {/* Header */}
        <div className={cn('flex items-center justify-between px-6 py-4 border-b border-border', danger && 'border-danger/20')}>
          <div className="flex items-center gap-2">
            <h3 id="modal-title" className={cn('text-base font-semibold', danger && 'text-danger')}>{title}</h3>
          </div>
          <button onClick={onClose} className="btn-ghost p-1 rounded" aria-label="Close modal">
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto max-h-[70vh]">{children}</div>
        {/* Footer */}
        {footer && <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">{footer}</div>}
      </div>
    </div>
  );
}
