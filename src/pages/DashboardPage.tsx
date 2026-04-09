import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
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
  const [showForkliftSaatleri, setShowForkliftSaatleri] = useState(false);
  const [forkliftSaatleri, setForkliftSaatleri] = useState<{ forklift_no: string; calisma_saati: string }[]>([]);
  const [loadingFS, setLoadingFS] = useState(false);
  const [showDoldurmadi, setShowDoldurmadi] = useState(false);
  const [doldurmadi, setDoldurmadi] = useState<{ ad_soyad: string; sicil_no: string }[]>([]);
  const [loadingDoldurmadi, setLoadingDoldurmadi] = useState(false);

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

  const handleOpenForkliftSaatleri = async () => {
    setShowForkliftSaatleri(true);
    setLoadingFS(true);
    const { data } = await supabase
      .from('form_submissions')
      .select('forklift_no, calisma_saati, submitted_at')
      .eq('vehicle_type', 'forklift')
      .not('forklift_no', 'is', null)
      .order('submitted_at', { ascending: false });

    // Her forklift için en son kaydı al
    const map = new Map<string, string>();
    for (const row of (data ?? [])) {
      if (row.forklift_no && !map.has(row.forklift_no)) {
        map.set(row.forklift_no, row.calisma_saati ?? '-');
      }
    }
    const sorted = Array.from(map.entries())
      .map(([forklift_no, calisma_saati]) => ({ forklift_no, calisma_saati }))
      .sort((a, b) => Number(a.forklift_no) - Number(b.forklift_no));
    setForkliftSaatleri(sorted);
    setLoadingFS(false);
  };

  const handleOpenDoldurmadi = async () => {
    setShowDoldurmadi(true);
    setLoadingDoldurmadi(true);
    const [{ data: operators }, { data: subs }] = await Promise.all([
      supabase.from('operators').select('sicil_no, ad_soyad').eq('is_active', true),
      supabase.from('form_submissions').select('sicil_no').eq('form_date', selectedDate),
    ]);
    const dolduranlar = new Set((subs ?? []).map((s: { sicil_no: string }) => s.sicil_no));
    const liste = (operators ?? [])
      .filter((op: { sicil_no: string; ad_soyad: string }) => !dolduranlar.has(op.sicil_no))
      .sort((a: { ad_soyad: string }, b: { ad_soyad: string }) => a.ad_soyad.localeCompare(b.ad_soyad, 'tr'));
    setDoldurmadi(liste);
    setLoadingDoldurmadi(false);
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
        {/* Forklift Saatleri Butonu */}
        <button
          onClick={handleOpenForkliftSaatleri}
          className="w-full bg-white border-2 border-[#003F87] text-[#003F87] font-bold py-3 rounded-xl text-sm active:scale-95 transition-transform"
        >
          Forklift Saatleri
        </button>

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

        <button
          onClick={handleOpenDoldurmadi}
          className="w-full bg-white border-2 border-red-300 text-red-600 font-bold py-3 rounded-xl text-sm active:scale-95 transition-transform"
        >
          Bu Tarihte Form Doldurmadı
        </button>

        <div className="h-6" />
      </div>

      {/* Form Doldurmadı Modalı */}
      {showDoldurmadi && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
          onClick={() => setShowDoldurmadi(false)}
        >
          <div
            className="bg-white rounded-t-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <div>
                <div className="font-bold text-gray-800">Form Doldurmadı</div>
                <div className="text-xs text-gray-500">{selectedDate}</div>
              </div>
              <button
                onClick={() => setShowDoldurmadi(false)}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-4 py-3">
              {loadingDoldurmadi ? (
                <div className="text-center py-8 text-gray-400 text-sm">Yükleniyor...</div>
              ) : doldurmadi.length === 0 ? (
                <div className="text-center py-8 text-green-600 text-sm font-medium">Tüm operatörler form doldurdu.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  <div className="py-2 text-xs font-bold text-gray-400 uppercase">{doldurmadi.length} operatör</div>
                  {doldurmadi.map(op => (
                    <div key={op.sicil_no} className="flex justify-between items-center py-3 text-sm">
                      <span className="font-medium text-gray-800">{op.ad_soyad}</span>
                      <span className="text-xs text-gray-400">{op.sicil_no}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="h-6" />
          </div>
        </div>
      )}

      {/* Forklift Saatleri Modalı */}
      {showForkliftSaatleri && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
          onClick={() => setShowForkliftSaatleri(false)}
        >
          <div
            className="bg-white rounded-t-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <div className="font-bold text-gray-800">Forklift Saatleri</div>
              <div className="flex items-center gap-2">
                {forkliftSaatleri.length > 0 && (
                  <button
                    onClick={() => {
                      const wsData = [
                        ['Forklift No', 'Çalışma Saati'],
                        ...forkliftSaatleri.map(r => [Number(r.forklift_no), Number(r.calisma_saati)]),
                      ];
                      const ws = XLSX.utils.aoa_to_sheet(wsData);
                      ws['!cols'] = [{ wch: 14 }, { wch: 16 }];
                      const wb = XLSX.utils.book_new();
                      XLSX.utils.book_append_sheet(wb, ws, 'Forklift Saatleri');
                      XLSX.writeFile(wb, `forklift-saatleri-${new Date().toISOString().split('T')[0]}.xlsx`);
                    }}
                    className="flex items-center gap-1.5 bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Excel
                  </button>
                )}
                <button
                  onClick={() => setShowForkliftSaatleri(false)}
                  className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="px-4 py-3">
              {loadingFS ? (
                <div className="text-center py-8 text-gray-400 text-sm">Yükleniyor...</div>
              ) : forkliftSaatleri.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">Henüz veri yok.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  <div className="flex justify-between py-2 text-xs font-bold text-gray-400 uppercase">
                    <span>Forklift No</span>
                    <span>Çalışma Saati</span>
                  </div>
                  {forkliftSaatleri.map(row => (
                    <div key={row.forklift_no} className="flex justify-between py-3 text-sm">
                      <span className="font-semibold text-gray-700">No {row.forklift_no}</span>
                      <span className="font-bold text-[#003F87]">{row.calisma_saati}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="h-6" />
          </div>
        </div>
      )}

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
            <div className="px-4 py-4 space-y-3">
              {selectedSubmission.vehicle_type === 'forklift' && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Forklift No</span>
                    <span className="font-semibold text-gray-800">{selectedSubmission.forklift_no ?? '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Çalışma Saati</span>
                    <span className="font-semibold text-gray-800">{selectedSubmission.calisma_saati ?? '-'}</span>
                  </div>
                </div>
              )}
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
                    {item.sonuc === 'uygun_degil' && item.aciklama && (
                      <p className="text-xs text-red-700 mt-1 bg-red-100 rounded px-2 py-1">
                        Açıklama: {item.aciklama}
                      </p>
                    )}
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full shrink-0 ${
                    item.sonuc === 'uygun' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                  }`}>
                    {item.sonuc === 'uygun' ? 'EVET' : 'HAYIR'}
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
