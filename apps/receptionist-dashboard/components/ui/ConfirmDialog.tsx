'use client';

import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { Button } from './Button';
import { clsx } from 'clsx';

interface ConfirmDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void;
  children?: React.ReactNode;
  trigger?: React.ReactNode;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'default',
  onConfirm,
  children,
  trigger,
}: ConfirmDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onOpenChange?.(false);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmButtonClass = clsx(
    'flex-1',
    variant === 'destructive'
      ? 'bg-red-600 hover:bg-red-700 text-white'
      : 'bg-primary-500 hover:bg-primary-600 text-white'
  );

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-dark-800 rounded-xl shadow-2xl w-full max-w-md p-6 z-50 animate-in zoom-in-95 fade-in">
          <div className="flex items-start justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors">
                <X size={20} className="text-gray-500" />
              </button>
            </Dialog.Close>
          </div>

          {description && (
            <Dialog.Description className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              {description}
            </Dialog.Description>
          )}

          {children}

          <div className="flex gap-3 mt-6">
            <Dialog.Close asChild>
              <Button variant="outline" className="flex-1">
                {cancelText}
              </Button>
            </Dialog.Close>
            <Button
              onClick={handleConfirm}
              loading={isLoading}
              className={confirmButtonClass}
              variant={variant === 'destructive' ? 'destructive' : 'default'}
            >
              {confirmText}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
