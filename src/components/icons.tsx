import { Mic, Zap, Target, CalendarDays, type LucideIcon } from 'lucide-react';

type IconProps = { className?: string };

export function TelegramIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212-.07-.062-.174-.041-.249-.024-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

export function VkIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M15.07 2H8.93C3.33 2 2 3.33 2 8.93v6.14C2 20.67 3.33 22 8.93 22h6.14c5.6 0 6.93-1.33 6.93-6.93V8.93C22 3.33 20.66 2 15.07 2zm3.15 14.27h-1.46c-.55 0-.72-.44-1.71-1.44-.86-.83-1.24-.94-1.45-.94-.29 0-.38.08-.38.49v1.31c0 .35-.11.56-1.03.56-1.52 0-3.2-.92-4.39-2.64-1.79-2.5-2.28-4.38-2.28-4.77 0-.21.08-.4.49-.4h1.46c.37 0 .51.17.65.56.71 2.07 1.91 3.88 2.4 3.88.18 0 .27-.08.27-.55V11.1c-.06-1.02-.6-1.11-.6-1.47 0-.17.15-.35.38-.35h2.29c.31 0 .42.17.42.53v2.86c0 .31.14.42.23.42.18 0 .33-.11.66-.44 1.02-1.14 1.75-2.9 1.75-2.9.1-.21.27-.4.64-.4h1.46c.44 0 .53.23.44.53-.18.85-1.97 3.37-1.97 3.37-.15.25-.21.36 0 .64.15.21.66.65 1 1.04.62.71 1.09 1.31 1.22 1.72.14.41-.07.62-.48.62z" />
    </svg>
  );
}

const EVENT_ICON: Record<string, LucideIcon> = {
  MEETUP: Mic,
  HACKATHON: Zap,
  FORUM: Target,
  OTHER: CalendarDays,
};

export function EventTypeIcon({ type, className }: { type: string; className?: string }) {
  const Icon = EVENT_ICON[type] ?? CalendarDays;
  return <Icon className={className} aria-hidden="true" />;
}
