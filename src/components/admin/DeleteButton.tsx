'use client';

import { useTransition } from 'react';

interface Props {
  action: (id: string) => Promise<void>;
  id: string;
  label?: string;
  confirmText?: string;
}

export default function DeleteButton({ action, id, label = 'Удалить', confirmText = 'Удалить запись?' }: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm(confirmText)) {
          startTransition(() => action(id));
        }
      }}
      className="rounded-lg px-3 py-1.5 text-sm font-medium text-crimson transition-colors hover:bg-crimson/10 disabled:opacity-50"
    >
      {pending ? '…' : label}
    </button>
  );
}
