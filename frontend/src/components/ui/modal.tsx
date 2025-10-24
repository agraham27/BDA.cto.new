'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment, ReactNode } from 'react';

import { Button } from './button';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  showCloseButton?: boolean;
}

export function Modal({ open, onClose, title, description, children, showCloseButton = true }: ModalProps) {
  return (
    <Transition show={open} as={Fragment} appear>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 backdrop-overlay" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-elevated transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    {title && (
                      <Dialog.Title as="h3" className="text-xl font-semibold text-gray-900">
                        {title}
                      </Dialog.Title>
                    )}
                    {description && <Dialog.Description className="text-sm text-gray-500">{description}</Dialog.Description>}
                  </div>
                  {showCloseButton && (
                    <Button variant="ghost" onClick={onClose} className="px-2 py-1 text-gray-500 hover:text-gray-700">
                      ✕
                    </Button>
                  )}
                </div>
                <div className="mt-4">{children}</div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
