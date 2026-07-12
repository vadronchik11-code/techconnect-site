'use client';

import { useEffect, useState, useTransition, type ReactNode } from 'react';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SortableItem {
  id: string;
  content: ReactNode;
}

interface Props {
  items: SortableItem[];
  /** Persists the new order (array of ids, in the new order) to the server. */
  onReorder: (orderedIds: string[]) => Promise<void>;
}

/**
 * Native HTML5 drag-and-drop list. Reorders optimistically in local state,
 * then persists via a server action; on failure the previous order is restored.
 */
export default function SortableAdminList({ items, onReorder }: Props) {
  const [order, setOrder] = useState(items);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Re-sync when the server-provided list changes (create/delete elsewhere),
  // but never fight an in-progress drag.
  useEffect(() => {
    if (!dragId) setOrder(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  function commit(next: SortableItem[]) {
    setOrder(next);
    startTransition(async () => {
      try {
        await onReorder(next.map((i) => i.id));
      } catch {
        setOrder(items); // revert on failure
      }
    });
  }

  function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setOverId(null);
      return;
    }
    const from = order.findIndex((i) => i.id === dragId);
    const to = order.findIndex((i) => i.id === targetId);
    if (from === -1 || to === -1) return;
    const next = [...order];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setDragId(null);
    setOverId(null);
    commit(next);
  }

  return (
    <div className={cn('card divide-y divide-ink/[0.06] overflow-hidden', pending && 'opacity-70')}>
      {order.map((item) => (
        <div
          key={item.id}
          draggable
          onDragStart={() => setDragId(item.id)}
          onDragOver={(e) => {
            e.preventDefault();
            if (overId !== item.id) setOverId(item.id);
          }}
          onDragLeave={() => setOverId((v) => (v === item.id ? null : v))}
          onDrop={(e) => {
            e.preventDefault();
            handleDrop(item.id);
          }}
          onDragEnd={() => {
            setDragId(null);
            setOverId(null);
          }}
          className={cn(
            'flex items-center gap-2 p-4 transition-colors',
            dragId === item.id && 'opacity-40',
            overId === item.id && dragId !== item.id && 'bg-cream/60'
          )}
        >
          <span
            className="cursor-grab touch-none text-ink/30 transition-colors hover:text-crimson active:cursor-grabbing"
            aria-label="Перетащить, чтобы изменить порядок"
          >
            <GripVertical className="h-5 w-5" aria-hidden />
          </span>
          <div className="flex min-w-0 flex-1 items-center gap-4">{item.content}</div>
        </div>
      ))}
    </div>
  );
}
