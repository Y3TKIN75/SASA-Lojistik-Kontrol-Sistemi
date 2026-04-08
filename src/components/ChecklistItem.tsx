import type { ChecklistItemDef, CheckResult, CheckType } from '../types';

interface Props {
  item: ChecklistItemDef;
  value: CheckResult | undefined;
  onChange: (id: number, value: CheckResult) => void;
  yesNo?: boolean;
  noteValue?: string;
  onNoteChange?: (id: number, note: string) => void;
}

const turColors: Record<CheckType, string> = {
  'Görsel':    'bg-blue-100 text-blue-700',
  'Fonksiyon': 'bg-purple-100 text-purple-700',
  'Kontrol':   'bg-orange-100 text-orange-700',
  'Genel':     'bg-gray-100 text-gray-700',
};

export default function ChecklistItem({ item, value, onChange, yesNo = false, noteValue, onNoteChange }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
      <div className="flex items-start gap-2">
        <span className="text-sm font-bold text-gray-400 min-w-[24px]">{item.id}.</span>
        <div className="flex-1">
          <p className="text-base font-medium text-gray-800 leading-snug">{item.soru}</p>
          <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${turColors[item.tur]}`}>
            {item.tur}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onChange(item.id, 'uygun')}
          className={`min-h-[48px] rounded-lg font-semibold text-sm transition-all ${
            value === 'uygun'
              ? 'bg-green-600 text-white shadow-md'
              : 'bg-green-50 text-green-700 border-2 border-green-300'
          }`}
        >
          {yesNo ? 'EVET' : 'UYGUN'}
        </button>
        <button
          type="button"
          onClick={() => onChange(item.id, 'uygun_degil')}
          className={`min-h-[48px] rounded-lg font-semibold text-sm transition-all ${
            value === 'uygun_degil'
              ? 'bg-red-600 text-white shadow-md'
              : 'bg-red-50 text-red-700 border-2 border-red-300'
          }`}
        >
          {yesNo ? 'HAYIR' : 'UYGUN DEĞİL'}
        </button>
      </div>
      {value === 'uygun_degil' && onNoteChange && (
        <textarea
          className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-red-300"
          placeholder="Açıklama giriniz..."
          rows={3}
          value={noteValue || ''}
          onChange={e => onNoteChange(item.id, e.target.value)}
        />
      )}
    </div>
  );
}
