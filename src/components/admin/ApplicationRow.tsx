'use client';

import { useTransition } from 'react';
import { setApplicationStatus, deleteApplication } from '@/lib/actions/applications';
import { APPLICATION_STATUS } from '@/lib/constants';
import { formatDate } from '@/lib/utils';

interface App {
  id: string;
  name: string;
  contact: string;
  role: string;
  message: string;
  status: string;
  createdAt: Date | string;
}

const STATUS_TONE: Record<string, string> = {
  NEW: 'bg-flame text-white',
  REVIEWED: 'bg-amber/20 text-crimson',
  ACCEPTED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-ink/10 text-ink/50',
};

export default function ApplicationRow({ app }: { app: App }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-ink">{app.name}</p>
            <span className={`chip ${STATUS_TONE[app.status] ?? 'bg-cream text-crimson'}`}>
              {APPLICATION_STATUS[app.status as keyof typeof APPLICATION_STATUS] ?? app.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-ink/60">
            <span className="font-medium">{app.contact}</span>
            {app.role ? ` · ${app.role}` : ''} · {formatDate(app.createdAt)}
          </p>
          {app.message && <p className="mt-2 max-w-2xl text-sm text-ink/70">{app.message}</p>}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <select
            value={app.status}
            disabled={pending}
            onChange={(e) => startTransition(() => setApplicationStatus(app.id, e.target.value))}
            className="rounded-lg border border-ink/12 bg-white px-3 py-1.5 text-sm outline-none focus:border-flame"
          >
            {Object.entries(APPLICATION_STATUS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (confirm(`Удалить заявку от ${app.name}?`)) {
                startTransition(() => deleteApplication(app.id));
              }
            }}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-crimson hover:bg-crimson/10 disabled:opacity-50"
          >
            Удалить
          </button>
        </div>
      </div>
    </div>
  );
}
