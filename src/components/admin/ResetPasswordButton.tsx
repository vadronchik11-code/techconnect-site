'use client';

import { useState, useTransition } from 'react';

interface Props {
  action: (userId: string) => Promise<string>;
  id: string;
  name: string;
}

export default function ResetPasswordButton({ action, id, name }: Props) {
  const [pending, startTransition] = useTransition();
  const [newPass, setNewPass] = useState<string | null>(null);

  return (
    <div className="flex shrink-0 items-center gap-2">
      {newPass && (
        <code className="rounded-md bg-cream px-2 py-1 font-mono text-xs font-bold text-crimson" title="Новый пароль — скопируйте и передайте пользователю">
          {newPass}
        </code>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (confirm(`Сбросить пароль для ${name}? Старый пароль перестанет работать.`)) {
            startTransition(async () => {
              const pass = await action(id);
              setNewPass(pass);
            });
          }
        }}
        className="rounded-lg px-3 py-1.5 text-sm font-medium text-ink/70 transition-colors hover:bg-cream disabled:opacity-50"
      >
        {pending ? '…' : 'Сбросить пароль'}
      </button>
    </div>
  );
}
