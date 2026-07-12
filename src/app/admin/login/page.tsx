'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AnimatedLogo from '@/components/AnimatedLogo';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get('from') ?? '/admin';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Ошибка входа');
      router.push(from);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card w-full max-w-sm space-y-4 p-8">
      <div className="flex flex-col items-center text-center">
        <AnimatedLogo variant="mark" animated={false} className="h-16 w-16" />
        <h1 className="mt-4 font-display text-2xl font-extrabold text-ink">Панель управления</h1>
        <p className="mt-1 text-sm text-ink/50">Войдите, чтобы управлять контентом</p>
      </div>

      <label className="block">
        <span className="tc-label">Email</span>
        <input name="email" type="email" required className="tc-input" placeholder="admin@techconnect.ru" autoComplete="username" />
      </label>
      <label className="block">
        <span className="tc-label">Пароль</span>
        <input name="password" type="password" required className="tc-input" placeholder="••••••••" autoComplete="current-password" />
      </label>

      {error && <p className="text-sm font-medium text-crimson">{error}</p>}

      <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
        {loading ? 'Вход…' : 'Войти'}
      </button>

      <Link href="/" className="block text-center text-sm text-ink/50 hover:text-flame">
        ← На сайт
      </Link>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[linear-gradient(155deg,#FF511C_-10%,#A81313_60%)] px-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
