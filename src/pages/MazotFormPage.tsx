import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getSession } from '../lib/session';
import type { Vardiya } from '../types';

const KALMAR_LISTESI = ['HYSTER', '2008', '2019', '2020', '2021', '2024-1', '2024-2'];

function detectVardiya(): Vardiya {
  const now = new Date();
  const m = now.getHours() * 60 + now.getMinutes();
  if (m >= 23 * 60 + 45 || m < 7 * 60 + 45) return '00:00-08:00';
  if (m < 15 * 60 + 45) return '08:00-16:00';
  return '16:00-00:00';
}

// 23:45'ten sonra vardiya 00:00-08:00'e geçer, form tarihi ertesi güne ait.
function getFormDate(): string {
  const now = new Date();
  const m = now.getHours() * 60 + now.getMinutes();
  if (m >= 23 * 60 + 45) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }
  return now.toISOString().split('T')[0];
}

const HOME_PATHS: Record<string, string> = {
  traktor: '/home/traktor',
  forklift: '/home/forklift',
  tir: '/home/tir',
  kalmar: '/home/kalmar',
};

export default function MazotFormPage() {
  const navigate = useNavigate();
  const session = getSession()!;
  const isKmBased = session.role === 'traktor' || session.role === 'tir';
  const isKalmar = session.role === 'kalmar';
  const homePath = HOME_PATHS[session.role] ?? '/';

  const [vardiya] = useState<Vardiya>(detectVardiya());
  const [forkliftNo, setForkliftNo] = useState('');
  const [kalmarNo, setKalmarNo] = useState('');
  const [calismaSaati, setCalismaSaati] = useState('');
  const [kilometre, setKilometre] = useState('');
  const [litre, setLitre] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const allFilled = isKmBased
    ? kilometre.trim() !== '' && litre.trim() !== ''
    : isKalmar
      ? kalmarNo.trim() !== '' && calismaSaati.trim() !== '' && litre.trim() !== ''
      : forkliftNo.trim() !== '' && calismaSaati.trim() !== '' && litre.trim() !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allFilled) { setError('Lütfen tüm alanları doldurunuz.'); return; }

    setLoading(true);
    setError(null);

    const { error: dbError } = await supabase.from('mazot_submissions').insert({
      operator_id: session.operator_id,
      sicil_no: session.sicil_no,
      ad_soyad: session.ad_soyad,
      vehicle_type: session.role,
      vardiya,
      form_date: getFormDate(),
      forklift_no: isKmBased ? null : isKalmar ? kalmarNo : forkliftNo,
      calisma_saati: isKmBased ? null : calismaSaati,
      kilometre: isKmBased ? kilometre : null,
      litre,
    });

    setLoading(false);

    if (dbError) {
      setError('Form gönderilemedi: ' + dbError.message);
      return;
    }

    setSubmitted(true);
  };

  const vehicleLabel = isKalmar ? 'Kalmar' : session.role === 'forklift' ? 'Forklift' : '';

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center space-y-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Kaydedildi!</h2>
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm text-left">
            {isKmBased ? (
              <div className="flex justify-between">
                <span className="text-gray-500">Kilometre</span>
                <span className="font-medium text-gray-800">{kilometre}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-500">{vehicleLabel} No</span>
                  <span className="font-medium text-gray-800">{isKalmar ? kalmarNo : forkliftNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Çalışma Saati</span>
                  <span className="font-medium text-gray-800">{calismaSaati}</span>
                </div>
              </>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Alınan Mazot</span>
              <span className="font-medium text-gray-800">{litre} litre</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Vardiya</span>
              <span className="font-semibold text-[#003F87]">{vardiya}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setSubmitted(false);
                setForkliftNo(''); setKalmarNo(''); setCalismaSaati(''); setKilometre(''); setLitre('');
              }}
              className="flex-1 border-2 border-[#003F87] text-[#003F87] font-bold py-3 rounded-xl text-sm"
            >
              Yeni Kayıt
            </button>
            <button
              onClick={() => navigate(homePath, { replace: true })}
              className="flex-1 bg-[#003F87] text-white font-bold py-3 rounded-xl text-sm"
            >
              Ana Ekran
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-[#003F87] text-white px-4 pb-3 header-safe flex items-center justify-between sticky top-0 z-10">
        <div>
          <div className="font-bold text-sm">Mazot Alım Formu</div>
          <div className="text-xs opacity-75">{session.ad_soyad} · {session.sicil_no}</div>
        </div>
        <button
          onClick={() => navigate(homePath, { replace: true })}
          className="text-xs opacity-75 bg-white/10 px-3 py-1.5 rounded-lg"
        >
          Geri
        </button>
      </div>

      <div className="flex-1 px-4 py-4 space-y-4 max-w-lg mx-auto w-full">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Ad Soyad</span>
            <span className="font-medium text-gray-800">{session.ad_soyad}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Vardiya</span>
            <span className="font-semibold text-[#003F87] bg-blue-50 px-3 py-0.5 rounded-full">{vardiya}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
            <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Mazot Alım Bilgileri</h2>

            {isKmBased ? (
              <div>
                <label className="text-sm text-gray-500 block mb-1">
                  {session.role === 'tir' ? 'Tır Kilometresi' : 'Traktör Kilometresi'}
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={kilometre}
                  onChange={e => setKilometre(e.target.value)}
                  placeholder="Örn: 45230"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003F87]/30"
                />
              </div>
            ) : isKalmar ? (
              <>
                <div>
                  <label className="text-sm text-gray-500 block mb-1">Kalmar Numarası</label>
                  <select
                    value={kalmarNo}
                    onChange={e => setKalmarNo(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003F87]/30 bg-white"
                  >
                    <option value="">Seçiniz...</option>
                    {KALMAR_LISTESI.map(k => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-500 block mb-1">Kalmar Çalışma Saati</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={calismaSaati}
                    onChange={e => setCalismaSaati(e.target.value)}
                    placeholder="Örn: 1250"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003F87]/30"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="text-sm text-gray-500 block mb-1">Forklift Numarası</label>
                  <select
                    value={forkliftNo}
                    onChange={e => setForkliftNo(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003F87]/30 bg-white"
                  >
                    <option value="">Seçiniz...</option>
                    {Array.from({ length: 160 }, (_, i) => i + 1).map(n => (
                      <option key={n} value={String(n)}>{n}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-500 block mb-1">Forklift Çalışma Saati</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={calismaSaati}
                    onChange={e => setCalismaSaati(e.target.value)}
                    placeholder="Örn: 1250"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003F87]/30"
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-sm text-gray-500 block mb-1">Kaç Litre Mazot Alındı</label>
              <input
                type="number"
                inputMode="decimal"
                value={litre}
                onChange={e => setLitre(e.target.value)}
                placeholder="Örn: 45"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003F87]/30"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !allFilled}
            className="w-full bg-[#003F87] text-white font-bold py-4 rounded-xl text-base disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-transform shadow-md"
          >
            {loading ? 'Kaydediliyor...' : 'Kaydet'}
          </button>

          <div className="h-6" />
        </form>
      </div>
    </div>
  );
}
