'use client';

import { Listbox, Transition } from '@headlessui/react';
import clsx from 'clsx';
import { Fragment } from 'react';

export interface SelectOption<TValue = string> {
  label: string;
  value: TValue;
  description?: string;
}

interface SelectProps<TValue> {
  label?: string;
  value: SelectOption<TValue> | null;
  options: SelectOption<TValue>[];
  placeholder?: string;
  onChange: (value: SelectOption<TValue>) => void;
  disabled?: boolean;
  error?: string;
}

export function Select<TValue>({
  label,
  value,
  options,
  placeholder,
  onChange,
  disabled,
  error,
}: SelectProps<TValue>) {
  const selectedLabel = value?.label || placeholder || 'Chọn một mục';

  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <Listbox value={value} onChange={onChange} disabled={disabled}>
        {({ open }) => (
          <div className="relative">
            <Listbox.Button
              className={clsx(
                'flex w-full items-center justify-between rounded-lg border bg-white px-4 py-2.5 text-left text-sm shadow-sm transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/20 focus-visible:ring-offset-1',
                disabled && 'cursor-not-allowed bg-gray-50 text-gray-400',
                error && 'border-danger-500 focus-visible:ring-danger-500/20'
              )}
            >
              <span className={clsx('block truncate', !value && 'text-gray-400')}>{selectedLabel}</span>
              <span className="ml-2 inline-flex text-gray-400">⌄</span>
            </Listbox.Button>
            <Transition
              as={Fragment}
              show={open}
              enter="transition ease-out duration-100"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-75"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute z-10 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-gray-100 bg-white py-2 text-sm shadow-elevated focus:outline-none">
                {options.map((option) => (
                  <Listbox.Option
                    key={`${option.label}-${option.value}`}
                    value={option}
                    className={({ active }) =>
                      clsx(
                        'relative cursor-pointer select-none px-4 py-2.5',
                        active ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
                      )
                    }
                  >
                    {({ selected }) => (
                      <div className="flex flex-col">
                        <span className={clsx('truncate', selected && 'font-medium')}>{option.label}</span>
                        {option.description && (
                          <span className="text-xs text-gray-400">{option.description}</span>
                        )}
                      </div>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        )}
      </Listbox>
      {error && <p className="text-sm text-danger-600">{error}</p>}
    </div>
  );
}
