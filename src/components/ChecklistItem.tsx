import { useRef } from 'react';
import type { ChecklistItemDef, CheckResult, CheckType } from '../types';

interface Props {
  item: ChecklistItemDef;
  value: CheckResult | undefined;
  onChange: (id: number, value: CheckResult) => void;
  yesNo?: boolean;
  noteValue?: string;
  onNoteChange?: (id: number, note: string) => void;
  photoValue?: string | null;
  onPhotoChange?: (id: number, photo: string | null) => void;
}

const turColors: Record<CheckType, string> = {
  'Görsel':    'bg-blue-100 text-blue-700',
  'Fonksiyon': 'bg-purple-100 text-purple-700',
  'Kontrol':   'bg-orange-100 text-orange-700',
  'Genel':     'bg-gray-100 text-gray-700',
};

function compressImage(file: File, maxSize = 600, quality = 0.6): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve(null);
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => resolve(null);
      img.onload = () => {
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) { height = Math.round((height / width) * maxSize); width = maxSize; }
          else { width = Math.round((width / height) * maxSize); height = maxSize; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function ChecklistItem({ item, value, onChange, yesNo = false, noteValue, onNoteChange, photoValue, onPhotoChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onPhotoChange) return;
    const compressed = await compressImage(file);
    if (compressed === null) return; // bozuk/desteklenmeyen dosya, sessizce geç
    onPhotoChange(item.id, compressed);
    e.target.value = '';
  };

  const showNegativeSection = value === 'uygun_degil' && (onNoteChange || onPhotoChange);

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

      {showNegativeSection && (
        <div className="space-y-2">
          {onNoteChange && (
            <textarea
              className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-red-300"
              placeholder="Açıklama giriniz..."
              rows={3}
              value={noteValue || ''}
              onChange={e => onNoteChange(item.id, e.target.value)}
            />
          )}

          {onPhotoChange && (
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />
              {!photoValue ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 w-full justify-center border-2 border-dashed border-red-300 rounded-lg py-2.5 text-sm text-red-600 font-medium active:scale-95 transition-transform"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Fotoğraf Ekle
                </button>
              ) : (
                <div className="relative">
                  <img
                    src={photoValue}
                    alt="Fotoğraf"
                    className="w-full max-h-48 object-cover rounded-lg border border-red-200"
                  />
                  <button
                    type="button"
                    onClick={() => onPhotoChange(item.id, null)}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shadow"
                  >
                    ✕
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-1 text-xs text-red-500 underline w-full text-center"
                  >
                    Fotoğrafı Değiştir
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
