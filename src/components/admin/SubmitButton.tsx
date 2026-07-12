'use client';

import { useFormStatus } from 'react-dom';

export default function SubmitButton({ label = 'Сохранить' }: { label?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary disabled:opacity-60">
      {pending ? 'Сохранение…' : label}
    </button>
  );
}
