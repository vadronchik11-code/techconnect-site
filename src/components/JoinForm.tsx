'use client';

import { useState } from 'react';

const ROLES = ['Дизайнер', 'Фандрайзер', 'СММщик', 'Сценарист', 'МТО'];

export default function JoinForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [error, setError] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('loading');
    setError('');
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Не удалось отправить заявку');
      }
      setStatus('ok');
      form.reset();
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Ошибка');
    }
  }

  if (status === 'ok') {
    return (
      <div className="card grid place-items-center p-10 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-flame-gradient text-3xl text-white">✓</div>
        <h3 className="mt-5 text-2xl font-extrabold text-ink">Заявка отправлена!</h3>
        <p className="mt-2 max-w-sm text-ink/60">
          Мы свяжемся с тобой в ближайшее время. А пока загляни в наш Telegram.
        </p>
        <button onClick={() => setStatus('idle')} className="btn-outline mt-6">
          Отправить ещё одну
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-7 sm:p-8">
      <h3 className="display text-2xl text-ink">Стать частью TechConnect</h3>
      <p className="text-ink/60">Оставь заявку — расскажем, с чего начать.</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-ink">Имя *</span>
          <input name="name" required maxLength={100} className="tc-input" placeholder="Как тебя зовут" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-ink">Контакт *</span>
          <input name="contact" required maxLength={120} className="tc-input" placeholder="Telegram / email / телефон" />
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-ink">Направление</span>
        <select name="role" className="tc-input" defaultValue="">
          <option value="" disabled>
            Выбери направление
          </option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-ink">Сообщение</span>
        <textarea name="message" rows={4} maxLength={1000} className="tc-input resize-none" placeholder="Пара слов о себе и что тебе интересно" />
      </label>

      {status === 'error' && <p className="text-sm font-medium text-crimson">{error}</p>}

      <button type="submit" disabled={status === 'loading'} className="btn-primary w-full disabled:opacity-60">
        {status === 'loading' ? 'Отправляем…' : 'Отправить заявку'}
      </button>
    </form>
  );
}
