import Link from 'next/link';

interface Props {
  title: string;
  description?: string;
  action?: { href: string; label: string };
  back?: { href: string; label: string };
}

export default function AdminHeader({ title, description, action, back }: Props) {
  return (
    <div className="mb-8">
      {back && (
        <Link href={back.href} className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-flame hover:gap-2">
          <span aria-hidden>←</span> {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">{title}</h1>
          {description && <p className="mt-1.5 text-ink/55">{description}</p>}
        </div>
        {action && (
          <Link href={action.href} className="btn-primary !py-2.5 text-sm">
            {action.label}
          </Link>
        )}
      </div>
    </div>
  );
}
