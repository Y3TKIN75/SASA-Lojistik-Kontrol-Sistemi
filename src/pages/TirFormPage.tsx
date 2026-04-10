import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getSession, clearSession } from '../lib/session';
import type { CheckResult, Vardiya } from '../types';
import { tirChecklist } from '../data/checklists';
import ChecklistItem from '../components/ChecklistItem';

function detectVardiya(): Vardiya {
  const now = new Date();
  const m = now.getHours() * 60 + now.getMinutes();
  if (m >= 23 * 60 + 45 || m < 7 * 60 + 45) return '00:00-08:00';
  if (m < 15 * 60 + 45) return '08:00-16:00';
  return '16:00-00:00';
}

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

export default function TirFormPage() {
  const navigate = useNavigate();
  const session = getSession()!;

  const [vardiya] = useState<Vardiya>(detectVardiya());
  const [answers, setAnswers] = useState<Record<number, CheckResult>>({});
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [photos, setPhotos] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []);

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
      if (data) navigate('/home/tir', { replace: true });
    };
    checkDuplicate();
  }, [vardiya, session.sicil_no, navigate]);

  const handleAnswer = (id: number, value: CheckResult) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const handleNoteChange = (id: number, note: string) => {
    setNotes(prev => ({ ...prev, [id]: note }));
  };

  const handlePhotoChange = (id: number, photo: string | null) => {
    setPhotos(prev => {
      if (photo === null) { const next = { ...prev }; delete next[id]; return next; }
      return { ...prev, [id]: photo };
    });
  };

  const allAnswered = tirChecklist.every(item => answers[item.id] !== undefined);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allAnswered) { setError('Lütfen tüm kontrol maddelerini işaretleyiniz.'); return; }

    setLoading(true);
    setError(null);

    const checklist = tirChecklist.map(item => ({
      id: item.id,
      soru: item.soru,
      tur: item.tur,
      sonuc: answers[item.id],
      aciklama: answers[item.id] === 'uygun_degil' ? (notes[item.id] || null) : null,
      foto: answers[item.id] === 'uygun_degil' ? (photos[item.id] || null) : null,
    }));

    const { error: dbError } = await supabase.from('form_submissions').insert({
      operator_id: session.operator_id,
      sicil_no: session.sicil_no,
      ad_soyad: session.ad_soyad,
      vardiya,
      vehicle_type: 'tir',
      checklist,
      form_date: getFormDate(),
    });

    setLoading(false);

    if (dbError) {
      if (dbError.code === '23505') {
        navigate('/home/tir', { replace: true });
        return;
      }
      setError('Form gönderilemedi: ' + dbError.message);
      return;
    }

    navigate('/home/tir', { replace: true });
  };

  const handleLogout = () => {
    clearSession();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-[#003F87] text-white px-4 pb-3 header-safe flex items-center justify-between sticky top-0 z-10">
        <div>
          <div className="font-bold text-sm">Tır Kontrol Formu</div>
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

        {checking && (
          <div className="bg-gray-100 rounded-xl p-4 text-center text-sm text-gray-500">Kontrol ediliyor...</div>
        )}

        {!checking && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wide px-1">2. Kontrol Listesi</h2>
              <p className="text-xs text-gray-400 px-1">Her madde için Uygun / Uygun Değil seçiniz</p>
            </div>

            {tirChecklist.map(item => (
              <ChecklistItem
                key={item.id}
                item={item}
                value={answers[item.id]}
                onChange={handleAnswer}
                noteValue={notes[item.id]}
                onNoteChange={handleNoteChange}
                photoValue={photos[item.id]}
                onPhotoChange={handlePhotoChange}
              />
            ))}

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1">
              <h2 className="font-bold text-amber-800 text-sm uppercase tracking-wide">3. Uyarılar</h2>
              <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
                <li>Uygunsuzluk tespit edilmesi durumunda araç kullanılmayacaktır.</li>
                <li>Tespit edilen uygunsuzluklar amire bildirilecektir.</li>
                <li>Form doldurulmadan araç kullanımı yasaktır.</li>
              </ul>
            </div>

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
              {loading ? 'Gönderiliyor...' : `Formu Onayla (${Object.keys(answers).length}/${tirChecklist.length})`}
            </button>

            <div className="h-6" />
          </form>
        )}
      </div>
    </div>
  );
}
