import { FileClock } from 'lucide-react';

export function EmptyState({ title, text }) {
  return (
    <div className="rounded-3xl border border-dashed border-white/12 bg-white/[0.04] px-5 py-10 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/8 text-mint">
        <FileClock size={24} />
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-white/55">{text}</p>
    </div>
  );
}
