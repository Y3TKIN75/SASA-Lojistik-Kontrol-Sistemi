import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { clearSession, getSession } from '../lib/session';
import type { FormSubmission, Vardiya, ChecklistItemResult } from '../types';
import ShiftBadge from '../components/ShiftBadge';

const VARDIYAS: Vardiya[] = ['00:00-08:00', '08:00-16:00', '16:00-00:00'];

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const session = getSession()!;

  const [selectedDate, setSelectedDate] = useState(getToday());
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);

  // Seçilen tarihe göre formları yükle
  useEffect(() => {
    const fetchSubmissions = async () => {
      setLoadingSubs(true);
      const { data } = await supabase
        .from('form_submissions')
        .select('*')
        .eq('form_date', selectedDate)
        .order('submitted_at');
      setSubmissions((data as FormSubmission[]) ?? []);
      setLoadingSubs(false);
    };
    fetchSubmissions();
  }, [selectedDate]);

  const handleLogout = () => {
    clearSession();
    navigate('/', { replace: true });
  };

  // Özet sayılar
  const totalFilled = submissions.length;
  const uniqueOperators = new Set(submissions.map(s => s.sicil_no)).size;
  const hasIssuesCount = submissions.filter(s =>
    (s.checklist as ChecklistItemResult[]).some(i => i.sonuc === 'uygun_degil')
  ).length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Üst Bar */}
      <div className="bg-[#003F87] text-white px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold">Uzman Paneli</div>
            <div className="text-xs opacity-75">{session.ad_soyad}</div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/uzman/operatorler')}
              className="text-xs bg-white/10 px-3 py-1.5 rounded-lg"
            >
              Operatörler
            </button>
            <button onClick={handleLogout} className="text-xs bg-white/10 px-3 py-1.5 rounded-lg">
              Çıkış
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 max-w-2xl mx-auto w-full">
        {/* Tarih Filtresi */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Tarih Seçin</label>
          <input
            type="date"
            value={selectedDate}
            max={getToday()}
            onChange={e => setSelectedDate(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:border-[#003F87]"
          />
        </div>

        {/* Özet Kartlar */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 text-center">
            <div className="text-2xl font-bold text-gray-800">{loadingSubs ? '…' : totalFilled}</div>
            <div className="text-xs text-gray-500 mt-0.5">Form</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 text-center">
            <div className="text-2xl font-bold text-[#003F87]">{loadingSubs ? '…' : uniqueOperators}</div>
            <div className="text-xs text-gray-500 mt-0.5">Operatör</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 text-center">
            <div className="text-2xl font-bold text-amber-500">{loadingSubs ? '…' : hasIssuesCount}</div>
            <div className="text-xs text-gray-500 mt-0.5">Uygunsuz</div>
          </div>
        </div>

        {/* Vardiyalara Göre Form Listesi */}
        {loadingSubs ? (
          <div className="text-center py-8 text-gray-400">Yükleniyor...</div>
        ) : (
          VARDIYAS.map(vardiya => {
            const vardiyaSubs = submissions.filter(s => s.vardiya === vardiya);
            return (
              <div key={vardiya} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                  <ShiftBadge vardiya={vardiya} />
                  <span className="text-sm font-semibold text-gray-600">
                    {vardiyaSubs.length} form
                  </span>
                </div>
                <div className="divide-y divide-gray-100">
                  {vardiyaSubs.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-400 text-center">Henüz form gönderilmedi.</div>
                  ) : (
                    vardiyaSubs.map(sub => {
                      const hasIssues = (sub.checklist as ChecklistItemResult[]).some(i => i.sonuc === 'uygun_degil');
                      return (
                        <div
                          key={sub.id}
                          onClick={() => setSelectedSubmission(sub)}
                          className="px-4 py-3 flex items-center justify-between cursor-pointer active:bg-gray-50"
                        >
                          <div>
                            <div className="text-sm font-medium text-gray-800">{sub.ad_soyad}</div>
                            <div className="text-xs text-gray-400">
                              {sub.sicil_no} · {sub.vehicle_type === 'traktor' ? 'Traktör' : 'Forklift'} ·{' '}
                              {new Date(sub.submitted_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {hasIssues && (
                              <span className="text-xs bg-red-100 text-red-600 font-medium px-2 py-0.5 rounded-full">
                                Uygunsuz
                              </span>
                            )}
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })
        )}

        <div className="h-6" />
      </div>

      {/* Form Detay Modalı */}
      {selectedSubmission && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
          onClick={() => setSelectedSubmission(null)}
        >
          <div
            className="bg-white rounded-t-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <div>
                <div className="font-bold text-gray-800">{selectedSubmission.ad_soyad}</div>
                <div className="text-xs text-gray-500">
                  {selectedSubmission.vehicle_type === 'traktor' ? 'Traktör' : 'Forklift'} ·{' '}
                  <ShiftBadge vardiya={selectedSubmission.vardiya} /> ·{' '}
                  {new Date(selectedSubmission.submitted_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-4 py-4 space-y-2">
              {(selectedSubmission.checklist as ChecklistItemResult[]).map(item => (
                <div
                  key={item.id}
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    item.sonuc === 'uygun_degil' ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-100'
                  }`}
                >
                  <span className="text-xs font-bold text-gray-400 mt-0.5 min-w-[20px]">{item.id}.</span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">{item.soru}</p>
                    <span className="text-xs text-gray-400">{item.tur}</span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    item.sonuc === 'uygun' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                  }`}>
                    {item.sonuc === 'uygun' ? 'UYGUN' : 'UYGUN DEĞİL'}
                  </span>
                </div>
              ))}
            </div>
            <div className="h-6" />
          </div>
        </div>
      )}
    </div>
  );
}
