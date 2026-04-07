import type { Vardiya } from '../types';

const colors: Record<Vardiya, string> = {
  '00:00-08:00': 'bg-indigo-100 text-indigo-800',
  '08:00-16:00': 'bg-amber-100 text-amber-800',
  '16:00-00:00': 'bg-slate-100 text-slate-800',
};

export default function ShiftBadge({ vardiya }: { vardiya: Vardiya }) {
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${colors[vardiya]}`}>
      {vardiya}
    </span>
  );
}
