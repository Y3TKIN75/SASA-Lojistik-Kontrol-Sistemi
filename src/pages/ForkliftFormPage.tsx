import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getSession, clearSession } from '../lib/session';
import type { CheckResult, Vardiya } from '../types';
import { forkliftChecklist } from '../data/checklists';
import ChecklistItem from '../components/ChecklistItem';

function detectVardiya(): Vardiya {
  const now = new Date();
  const m = now.getHours() * 60 + now.getMinutes();
  if (m >= 23 * 60 + 30 || m < 7 * 60 + 30) return '00:00-08:00';
  if (m < 15 * 60 + 30) return '08:00-16:00';
  return '16:00-00:00';
}

function getFormDate(): string {
  const now = new Date();
  const m = now.getHours() * 60 + now.getMinutes();
  if (m >= 23 * 60 + 30) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }
  return now.toISOString().split('T')[0];
}

export default function ForkliftFormPage() {
  const navigate = useNavigate();
  const session = getSession()!;

  const [vardiya] = useState<Vardiya>(detectVardiya());
  const [forkliftNo, setForkliftNo] = useState('');
  const [calismaSaati, setCalismaSaati] = useState('');
  const [answers, setAnswers] = useState<Record<number, CheckResult>>({});
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []);

  // Mükerrer kontrol
  useEffect(() => {
    const checkDuplicate = async () => {
      setChecking(true);
      const { data } = await supabase
        .from('form_submissions')
        .select('id')
        .eq('sicil_no', session.sicil_no)
        .eq('vardiya', vardiya)
        .eq('form_date', getFormDate())
        .maybeSingle();
      setChecking(false);
      setAlreadySubmitted(!!data);
    };
    checkDuplicate();
  }, [vardiya, session.sicil_no]);

  const handleAnswer = (id: number, value: CheckResult) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const handleNoteChange = (id: number, note: string) => {
    setNotes(prev => ({ ...prev, [id]: note }));
  };

  const allAnswered =
    forkliftNo.trim() !== '' &&
    calismaSaati.trim() !== '' &&
    forkliftChecklist.every(item => answers[item.id] !== undefined);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allAnswered) { setError('Lütfen tüm kontrol maddelerini işaretleyiniz.'); return; }

    setLoading(true);
    setError(null);

    const checklist = forkliftChecklist.map(item => ({
      id: item.id,
      soru: item.soru,
      tur: item.tur,
      sonuc: answers[item.id],
      aciklama: answers[item.id] === 'uygun_degil' ? (notes[item.id] || null) : null,
    }));

    const { error: dbError } = await supabase.from('form_submissions').insert({
      operator_id: session.operator_id,
      sicil_no: session.sicil_no,
      ad_soyad: session.ad_soyad,
      vardiya,
      vehicle_type: 'forklift',
      checklist,
      form_date: getFormDate(),
      forklift_no: forkliftNo,
      calisma_saati: calismaSaati,
    });

    setLoading(false);

    if (dbError) {
      if (dbError.code === '23505') {
        setAlreadySubmitted(true);
        return;
      }
      setError('Form gönderilemedi: ' + dbError.message);
      return;
    }

    setSubmitted(true);
  };

  const handleLogout = () => {
    clearSession();
    navigate('/', { replace: true });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center space-y-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Form Gönderildi!</h2>
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm text-left">
            <div className="flex justify-between">
              <span className="text-gray-500">Ad Soyad</span>
              <span className="font-medium text-gray-800">{session.ad_soyad}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Vardiya</span>
              <span className="font-semibold text-[#003F87]">{vardiya}</span>
            </div>
          </div>
          <p className="text-[#003F87] font-bold text-lg">İyi çalışmalar, {session.ad_soyad.split(' ')[0]}!</p>
          <button
            onClick={() => navigate('/', { replace: true })}
            className="w-full bg-[#003F87] text-white font-bold py-4 rounded-xl mt-2"
          >
            Tamam
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-[#003F87] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div>
          <div className="font-bold text-sm">Forklift Kontrol Formu</div>
          <div className="text-xs opacity-75">{session.ad_soyad} · {session.sicil_no}</div>
        </div>
        <button onClick={handleLogout} className="text-xs opacity-75 bg-white/10 px-3 py-1.5 rounded-lg">
          Çıkış
        </button>
      </div>

      {!isOnline && (
        <div className="bg-yellow-400 text-yellow-900 text-sm font-medium px-4 py-2 text-center">
          İnternet bağlantısı yok — form gönderilemeyebilir.
        </div>
      )}

      <div className="flex-1 px-4 py-4 space-y-4 max-w-lg mx-auto w-full">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
          <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wide">1. Personel Bilgileri</h2>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Ad Soyad</span>
            <span className="font-medium text-gray-800">{session.ad_soyad}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Vardiya</span>
            <span className="font-semibold text-[#003F87] bg-blue-50 px-3 py-0.5 rounded-full">{vardiya}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
          <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wide">2. Forklift Bilgileri</h2>
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
              type="text"
              value={calismaSaati}
              onChange={e => setCalismaSaati(e.target.value)}
              placeholder="Örn: 1250"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003F87]/30"
            />
          </div>
        </div>

        {checking && (
          <div className="bg-gray-100 rounded-xl p-4 text-center text-sm text-gray-500">Kontrol ediliyor...</div>
        )}

        {alreadySubmitted && !checking && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center space-y-2">
            <div className="text-amber-700 font-semibold">Bu vardiya için form zaten gönderilmiş.</div>
            <div className="text-sm text-amber-600">Bu vardiyada daha önce form kaydı oluşturdunuz.</div>
          </div>
        )}

        {!alreadySubmitted && !checking && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wide px-1">3. Kontrol Listesi</h2>

              <p className="text-xs text-gray-400 px-1">Her madde için Evet / Hayır seçiniz</p>
            </div>

            {forkliftChecklist.map(item => (
              <ChecklistItem
                key={item.id}
                item={item}
                value={answers[item.id]}
                onChange={handleAnswer}
                yesNo
                noteValue={notes[item.id]}
                onNoteChange={handleNoteChange}
              />
            ))}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !allAnswered}
              className="w-full bg-[#003F87] text-white font-bold py-4 rounded-xl text-base disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-transform shadow-md"
            >
              {loading ? 'Gönderiliyor...' : `Formu Onayla (${Object.keys(answers).length}/${forkliftChecklist.length})`}
            </button>

            <div className="h-6" />
          </form>
        )}
      </div>
    </div>
  );
}
