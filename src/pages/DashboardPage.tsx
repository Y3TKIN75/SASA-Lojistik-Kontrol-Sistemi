import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { clearSession, getSession } from '../lib/session';
import type { FormSubmission, Vardiya, ChecklistItemResult } from '../types';
import ShiftBadge from '../components/ShiftBadge';

const VARDIYAS: Vardiya[] = ['00:00-08:00', '08:00-16:00', '16:00-00:00'];

type VehicleTab = 'traktor' | 'forklift' | 'kalmar' | 'tir';

const VEHICLE_TABS: { key: VehicleTab; label: string }[] = [
  { key: 'traktor', label: 'Traktör' },
  { key: 'forklift', label: 'Forklift' },
  { key: 'kalmar', label: 'Kalmar' },
  { key: 'tir', label: 'Tır' },
];

const VEHICLE_LABELS: Record<string, string> = {
  traktor: 'Traktör',
  forklift: 'Forklift',
  kalmar: 'Kalmar',
  tir: 'Tır',
};

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

const AYLAR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
function formatAy(key: string): string {
  const [yil, ay] = key.split('-');
  return `${AYLAR[Number(ay) - 1]} ${yil}`;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const session = getSession()!;

  const [selectedVehicle, setSelectedVehicle] = useState<VehicleTab>('traktor');
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
  const [selectedMazot, setSelectedMazot] = useState<{
    forklift_no?: string | null;
    kilometre?: string | null;
    litre?: string | null;
    calisma_saati?: string | null;
  } | null>(null);

  // Forklift Saatleri
  const [showForkliftSaatleri, setShowForkliftSaatleri] = useState(false);
  const [forkliftSaatleri, setForkliftSaatleri] = useState<{ forklift_no: string; calisma_saati: string }[]>([]);
  const [loadingFS, setLoadingFS] = useState(false);

  // Kalmar Saatleri
  const [showKalmarSaatleri, setShowKalmarSaatleri] = useState(false);
  const [kalmarSaatleri, setKalmarSaatleri] = useState<{ forklift_no: string; calisma_saati: string }[]>([]);
  const [loadingKS, setLoadingKS] = useState(false);

  // Form Doldurmadı
  const [showDoldurmadi, setShowDoldurmadi] = useState(false);
  const [doldurmadi, setDoldurmadi] = useState<{ ad_soyad: string; sicil_no: string }[]>([]);
  const [loadingDoldurmadi, setLoadingDoldurmadi] = useState(false);

  // Mazot Alım
  const [showMazotAlim, setShowMazotAlim] = useState(false);
  const [mazotAlimList, setMazotAlimList] = useState<{ forklift_no: string; toplam: number }[]>([]);
  const [loadingMA, setLoadingMA] = useState(false);
  const [mazotAylik, setMazotAylik] = useState<{
    forklift_no: string;
    months: { key: string; label: string; toplam: number }[];
  } | null>(null);
  const [mazotDetay, setMazotDetay] = useState<{
    forklift_no: string;
    monthKey: string;
    monthLabel: string;
    rows: { id: string; form_date: string; calisma_saati: string | null; kilometre: string | null; litre: string }[];
  } | null>(null);
  const [editingRow, setEditingRow] = useState<{
    id: string;
    litre: string;
    calisma_saati: string;
    kilometre: string;
  } | null>(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      setLoadingSubs(true);
      const { data } = await supabase
        .from('form_submissions')
        .select('*')
        .eq('form_date', selectedDate)
        .eq('vehicle_type', selectedVehicle)
        .order('submitted_at');
      setSubmissions((data as FormSubmission[]) ?? []);
      setLoadingSubs(false);
    };
    fetchSubmissions();
  }, [selectedDate, selectedVehicle]);

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
      .order('submitted_at', { ascending: false })
      .limit(500);

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

  const handleOpenKalmarSaatleri = async () => {
    setShowKalmarSaatleri(true);
    setLoadingKS(true);
    const { data } = await supabase
      .from('form_submissions')
      .select('forklift_no, calisma_saati, submitted_at')
      .eq('vehicle_type', 'kalmar')
      .not('forklift_no', 'is', null)
      .order('submitted_at', { ascending: false })
      .limit(100);

    const map = new Map<string, string>();
    for (const row of (data ?? [])) {
      if (row.forklift_no && !map.has(row.forklift_no)) {
        map.set(row.forklift_no, row.calisma_saati ?? '-');
      }
    }
    const sorted = Array.from(map.entries())
      .map(([forklift_no, calisma_saati]) => ({ forklift_no, calisma_saati }))
      .sort((a, b) => a.forklift_no.localeCompare(b.forklift_no, 'tr'));
    setKalmarSaatleri(sorted);
    setLoadingKS(false);
  };

  const handleSelectSubmission = async (sub: FormSubmission) => {
    setSelectedSubmission(sub);
    setSelectedMazot(null);
    const { data } = await supabase
      .from('mazot_submissions')
      .select('forklift_no, kilometre, litre, calisma_saati')
      .eq('sicil_no', sub.sicil_no)
      .eq('vardiya', sub.vardiya)
      .eq('form_date', sub.form_date)
      .eq('vehicle_type', sub.vehicle_type)
      .maybeSingle();
    setSelectedMazot(data ?? null);
  };

  const handleOpenMazotAlim = async () => {
    setShowMazotAlim(true);
    setMazotAylik(null);
    setMazotDetay(null);
    setEditingRow(null);
    setLoadingMA(true);
    const { data } = await supabase
      .from('mazot_submissions')
      .select('forklift_no, litre')
      .eq('vehicle_type', selectedVehicle)
      .not('forklift_no', 'is', null);

    const map = new Map<string, number>();
    for (const row of (data ?? [])) {
      map.set(row.forklift_no, (map.get(row.forklift_no) ?? 0) + Number(row.litre ?? 0));
    }
    const sorted = Array.from(map.entries())
      .map(([forklift_no, toplam]) => ({ forklift_no, toplam }))
      .sort((a, b) =>
        selectedVehicle === 'forklift'
          ? Number(a.forklift_no) - Number(b.forklift_no)
          : a.forklift_no.localeCompare(b.forklift_no, 'tr')
      );
    setMazotAlimList(sorted);
    setLoadingMA(false);
  };

  const handleOpenMazotAylik = async (forklift_no: string) => {
    setLoadingMA(true);
    setEditingRow(null);
    const { data } = await supabase
      .from('mazot_submissions')
      .select('form_date, litre')
      .eq('vehicle_type', selectedVehicle)
      .eq('forklift_no', forklift_no)
      .order('form_date', { ascending: false });

    const map = new Map<string, number>();
    for (const row of (data ?? [])) {
      const key = (row.form_date as string).substring(0, 7);
      map.set(key, (map.get(key) ?? 0) + Number(row.litre ?? 0));
    }
    const months = Array.from(map.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, toplam]) => ({ key, label: formatAy(key), toplam }));

    setMazotAylik({ forklift_no, months });
    setLoadingMA(false);
  };

  const handleOpenMazotDetay = async (forklift_no: string, monthKey: string, monthLabel: string) => {
    setLoadingMA(true);
    setEditingRow(null);
    const [yearStr, monthStr] = monthKey.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);
    const nextYear = month === 12 ? year + 1 : year;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextMonthStart = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
    const { data } = await supabase
      .from('mazot_submissions')
      .select('id, form_date, calisma_saati, kilometre, litre')
      .eq('vehicle_type', selectedVehicle)
      .eq('forklift_no', forklift_no)
      .gte('form_date', monthKey + '-01')
      .lt('form_date', nextMonthStart)
      .order('form_date', { ascending: false });

    setMazotDetay({ forklift_no, monthKey, monthLabel, rows: data ?? [] });
    setLoadingMA(false);
  };

  const handleEditSave = async () => {
    if (!editingRow || !mazotDetay) return;
    const isKmBased = selectedVehicle === 'traktor' || selectedVehicle === 'tir';
    const updateFields = isKmBased
      ? { litre: editingRow.litre, kilometre: editingRow.kilometre || null }
      : { litre: editingRow.litre, calisma_saati: editingRow.calisma_saati || null };
    await supabase
      .from('mazot_submissions')
      .update(updateFields)
      .eq('id', editingRow.id);
    setMazotDetay(prev => prev && {
      ...prev,
      rows: prev.rows.map(r => r.id === editingRow.id
        ? { ...r, litre: editingRow.litre, ...(isKmBased ? { kilometre: editingRow.kilometre || null } : { calisma_saati: editingRow.calisma_saati || null }) }
        : r),
    });
    setEditingRow(null);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('mazot_submissions').delete().eq('id', id);
    setMazotDetay(prev => prev && { ...prev, rows: prev.rows.filter(r => r.id !== id) });
  };

  const handleOpenDoldurmadi = async () => {
    setShowDoldurmadi(true);
    setLoadingDoldurmadi(true);
    const [{ data: operators }, { data: subs }] = await Promise.all([
      supabase.from('operators').select('sicil_no, ad_soyad').eq('is_active', true).eq('role', selectedVehicle),
      supabase.from('form_submissions').select('sicil_no').eq('form_date', selectedDate).eq('vehicle_type', selectedVehicle),
    ]);
    const dolduranlar = new Set((subs ?? []).map((s: { sicil_no: string }) => s.sicil_no));
    const liste = (operators ?? [])
      .filter((op: { sicil_no: string; ad_soyad: string }) => !dolduranlar.has(op.sicil_no))
      .sort((a: { ad_soyad: string }, b: { ad_soyad: string }) => a.ad_soyad.localeCompare(b.ad_soyad, 'tr'));
    setDoldurmadi(liste);
    setLoadingDoldurmadi(false);
  };

  const totalFilled = submissions.length;
  const uniqueOperators = new Set(submissions.map(s => s.sicil_no)).size;
  const hasIssuesCount = submissions.filter(s =>
    (s.checklist as ChecklistItemResult[]).some(i => i.sonuc === 'uygun_degil')
  ).length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Üst Bar */}
      <div className="bg-[#003F87] text-white px-4 pb-0 header-safe sticky top-0 z-10">
        <div className="flex items-center justify-between pb-2">
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

        {/* Araç Seçim Sekmeleri */}
        <div className="flex gap-1 pb-2">
          {VEHICLE_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setSelectedVehicle(tab.key)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                selectedVehicle === tab.key
                  ? 'bg-white text-[#003F87]'
                  : 'bg-white/15 text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 max-w-2xl mx-auto w-full">
        {/* Forklift Saatleri Butonu — sadece Forklift sekmesinde */}
        {selectedVehicle === 'forklift' && (
          <button
            onClick={handleOpenForkliftSaatleri}
            className="w-full bg-white border-2 border-[#003F87] text-[#003F87] font-bold py-3 rounded-xl text-sm active:scale-95 transition-transform"
          >
            Forklift Saatleri
          </button>
        )}

        {/* Kalmar Saatleri Butonu — sadece Kalmar sekmesinde */}
        {selectedVehicle === 'kalmar' && (
          <button
            onClick={handleOpenKalmarSaatleri}
            className="w-full bg-white border-2 border-[#003F87] text-[#003F87] font-bold py-3 rounded-xl text-sm active:scale-95 transition-transform"
          >
            Kalmar Saatleri
          </button>
        )}

        {/* Mazot Alım Butonu */}
        {(selectedVehicle === 'forklift' || selectedVehicle === 'kalmar' ||
          selectedVehicle === 'traktor' || selectedVehicle === 'tir') && (
          <button
            onClick={handleOpenMazotAlim}
            className="w-full bg-white border-2 border-amber-400 text-amber-700 font-bold py-3 rounded-xl text-sm active:scale-95 transition-transform"
          >
            {VEHICLE_LABELS[selectedVehicle]} Mazot Alım
          </button>
        )}

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
                          onClick={() => handleSelectSubmission(sub)}
                          className="px-4 py-3 flex items-center justify-between cursor-pointer active:bg-gray-50"
                        >
                          <div>
                            <div className="text-sm font-medium text-gray-800">{sub.ad_soyad}</div>
                            <div className="text-xs text-gray-400">
                              {sub.sicil_no} · {VEHICLE_LABELS[sub.vehicle_type] ?? sub.vehicle_type} ·{' '}
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
                <div className="text-xs text-gray-500">{VEHICLE_LABELS[selectedVehicle]} · {selectedDate}</div>
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

      {/* Kalmar Saatleri Modalı */}
      {showKalmarSaatleri && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
          onClick={() => setShowKalmarSaatleri(false)}
        >
          <div
            className="bg-white rounded-t-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <div className="font-bold text-gray-800">Kalmar Saatleri</div>
              <div className="flex items-center gap-2">
                {kalmarSaatleri.length > 0 && (
                  <button
                    onClick={() => {
                      const wsData = [
                        ['Kalmar No', 'Çalışma Saati'],
                        ...kalmarSaatleri.map(r => [r.forklift_no, Number(r.calisma_saati)]),
                      ];
                      const ws = XLSX.utils.aoa_to_sheet(wsData);
                      ws['!cols'] = [{ wch: 14 }, { wch: 16 }];
                      const wb = XLSX.utils.book_new();
                      XLSX.utils.book_append_sheet(wb, ws, 'Kalmar Saatleri');
                      XLSX.writeFile(wb, `kalmar-saatleri-${new Date().toISOString().split('T')[0]}.xlsx`);
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
                  onClick={() => setShowKalmarSaatleri(false)}
                  className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="px-4 py-3">
              {loadingKS ? (
                <div className="text-center py-8 text-gray-400 text-sm">Yükleniyor...</div>
              ) : kalmarSaatleri.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">Henüz veri yok.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  <div className="flex justify-between py-2 text-xs font-bold text-gray-400 uppercase">
                    <span>Kalmar No</span>
                    <span>Çalışma Saati</span>
                  </div>
                  {kalmarSaatleri.map(row => (
                    <div key={row.forklift_no} className="flex justify-between py-3 text-sm">
                      <span className="font-semibold text-gray-700">{row.forklift_no}</span>
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
          onClick={() => { setSelectedSubmission(null); setSelectedMazot(null); }}
        >
          <div
            className="bg-white rounded-t-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <div>
                <div className="font-bold text-gray-800">{selectedSubmission.ad_soyad}</div>
                <div className="text-xs text-gray-500">
                  {VEHICLE_LABELS[selectedSubmission.vehicle_type] ?? selectedSubmission.vehicle_type} ·{' '}
                  <ShiftBadge vardiya={selectedSubmission.vardiya} /> ·{' '}
                  {new Date(selectedSubmission.submitted_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <button
                onClick={() => { setSelectedSubmission(null); setSelectedMazot(null); }}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-4 py-4 space-y-3">
              {(selectedSubmission.vehicle_type === 'forklift' || selectedSubmission.vehicle_type === 'kalmar') && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">{VEHICLE_LABELS[selectedSubmission.vehicle_type]} No</span>
                    <span className="font-semibold text-gray-800">{selectedSubmission.forklift_no ?? '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Çalışma Saati</span>
                    <span className="font-semibold text-gray-800">{selectedSubmission.calisma_saati ?? '-'}</span>
                  </div>
                </div>
              )}
              {selectedMazot && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1 text-sm">
                  <div className="text-xs font-bold text-amber-700 uppercase mb-1">Mazot Bilgisi</div>
                  {selectedMazot.forklift_no && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        {selectedSubmission?.vehicle_type === 'traktor' || selectedSubmission?.vehicle_type === 'tir'
                          ? 'Plaka' : 'Araç No'}
                      </span>
                      <span className="font-semibold text-gray-800">{selectedMazot.forklift_no}</span>
                    </div>
                  )}
                  {selectedMazot.kilometre && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Kilometre</span>
                      <span className="font-semibold text-gray-800">{selectedMazot.kilometre} km</span>
                    </div>
                  )}
                  {selectedMazot.calisma_saati && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Çalışma Saati</span>
                      <span className="font-semibold text-gray-800">{selectedMazot.calisma_saati} saat</span>
                    </div>
                  )}
                  {selectedMazot.litre && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Alınan Mazot</span>
                      <span className="font-semibold text-gray-800">{selectedMazot.litre} litre</span>
                    </div>
                  )}
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
                    {item.sonuc === 'uygun_degil' && item.foto && (
                      <img
                        src={item.foto}
                        alt="Fotoğraf"
                        className="mt-2 w-full max-h-48 object-cover rounded-lg border border-red-200"
                      />
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

      {/* Mazot Alım Modalı */}
      {showMazotAlim && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
          onClick={() => { setShowMazotAlim(false); setMazotAylik(null); setMazotDetay(null); setEditingRow(null); }}
        >
          <div
            className="bg-white rounded-t-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {mazotDetay ? (
                  <button
                    onClick={() => { setMazotDetay(null); setEditingRow(null); }}
                    className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-1"
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                ) : mazotAylik ? (
                  <button
                    onClick={() => setMazotAylik(null)}
                    className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-1"
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                ) : null}
                <div className="font-bold text-gray-800">
                  {mazotDetay
                    ? `${mazotDetay.forklift_no} — ${mazotDetay.monthLabel}`
                    : mazotAylik
                    ? `${mazotAylik.forklift_no} — Aylık Özet`
                    : `${VEHICLE_LABELS[selectedVehicle]} Mazot Alım`}
                </div>
              </div>
              <button
                onClick={() => { setShowMazotAlim(false); setMazotAylik(null); setMazotDetay(null); setEditingRow(null); }}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-4 py-3">
              {loadingMA ? (
                <div className="text-center py-8 text-gray-400 text-sm">Yükleniyor...</div>
              ) : mazotDetay ? (
                /* Level 3 — ay detayı + düzenleme/silme */
                <div className="divide-y divide-gray-100">
                  <div className="flex items-center gap-2 py-2 text-xs font-bold text-gray-400 uppercase">
                    <span className="flex-1">Tarih</span>
                    <span className="w-16" />
                    <span className="w-14 text-right">{selectedVehicle === 'traktor' || selectedVehicle === 'tir' ? 'KM' : 'Saat'}</span>
                    <span className="w-12 text-right">Litre</span>
                  </div>
                  {mazotDetay.rows.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">Henüz kayıt yok.</div>
                  ) : (
                    mazotDetay.rows.map(row => (
                      editingRow?.id === row.id ? (
                        <div key={row.id} className="flex items-center gap-2 py-2 text-sm">
                          <span className="flex-1 text-gray-500 text-xs">{row.form_date}</span>
                          <div className="flex gap-1 w-16 justify-end">
                            <button onClick={handleEditSave} className="w-7 h-7 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">✓</button>
                            <button onClick={() => setEditingRow(null)} className="w-7 h-7 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center text-xs font-bold">✕</button>
                          </div>
                          <input
                            type="number"
                            value={selectedVehicle === 'traktor' || selectedVehicle === 'tir' ? editingRow.kilometre : editingRow.calisma_saati}
                            onChange={e => setEditingRow(prev => prev && {
                              ...prev,
                              ...(selectedVehicle === 'traktor' || selectedVehicle === 'tir'
                                ? { kilometre: e.target.value }
                                : { calisma_saati: e.target.value }),
                            })}
                            className="w-14 border border-gray-300 rounded px-1.5 py-1 text-xs text-right focus:outline-none focus:border-amber-400"
                            placeholder={selectedVehicle === 'traktor' || selectedVehicle === 'tir' ? 'km' : 'saat'}
                          />
                          <input
                            type="number"
                            value={editingRow.litre}
                            onChange={e => setEditingRow(prev => prev && { ...prev, litre: e.target.value })}
                            className="w-12 border border-gray-300 rounded px-1.5 py-1 text-xs text-right focus:outline-none focus:border-amber-400"
                            placeholder="litre"
                          />
                        </div>
                      ) : (
                        <div key={row.id} className="flex items-center gap-2 py-3 text-sm">
                          <span className="flex-1 text-gray-700">{row.form_date}</span>
                          <div className="flex gap-1 w-16 justify-end">
                            <button
                              onClick={() => setEditingRow({ id: row.id, litre: row.litre, calisma_saati: row.calisma_saati ?? '', kilometre: row.kilometre ?? '' })}
                              className="w-7 h-7 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(row.id)}
                              className="w-7 h-7 bg-red-50 text-red-500 rounded-full flex items-center justify-center"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0a1 1 0 01-1-1V5a1 1 0 011-1h8a1 1 0 011 1v1a1 1 0 01-1 1H5z" />
                              </svg>
                            </button>
                          </div>
                          <span className="w-14 text-gray-500 text-right">
                            {selectedVehicle === 'traktor' || selectedVehicle === 'tir'
                              ? (row.kilometre ?? '—')
                              : (row.calisma_saati ?? '—')}
                          </span>
                          <span className="w-12 font-bold text-amber-700 text-right">{row.litre} L</span>
                        </div>
                      )
                    ))
                  )}
                </div>
              ) : mazotAylik ? (
                /* Level 2 — aylık özet */
                <div className="divide-y divide-gray-100">
                  <div className="flex justify-between py-2 text-xs font-bold text-gray-400 uppercase">
                    <span>Ay</span>
                    <span>Toplam Mazot</span>
                  </div>
                  {mazotAylik.months.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">Henüz veri yok.</div>
                  ) : (
                    mazotAylik.months.map(m => (
                      <div
                        key={m.key}
                        onClick={() => handleOpenMazotDetay(mazotAylik.forklift_no, m.key, m.label)}
                        className="flex justify-between items-center py-3 text-sm cursor-pointer active:bg-gray-50"
                      >
                        <span className="font-medium text-gray-700">{m.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-amber-700">{m.toplam} litre</span>
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                /* Level 1 — araç özeti */
                <div className="divide-y divide-gray-100">
                  <div className="flex justify-between py-2 text-xs font-bold text-gray-400 uppercase">
                    <span>
                      {selectedVehicle === 'traktor' || selectedVehicle === 'tir'
                        ? 'Plaka'
                        : `${VEHICLE_LABELS[selectedVehicle]} No`}
                    </span>
                    <span>Toplam Mazot</span>
                  </div>
                  {mazotAlimList.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">Henüz veri yok.</div>
                  ) : (
                    mazotAlimList.map(row => (
                      <div
                        key={row.forklift_no}
                        onClick={() => handleOpenMazotAylik(row.forklift_no)}
                        className="flex justify-between items-center py-3 text-sm cursor-pointer active:bg-gray-50"
                      >
                        <span className="font-semibold text-gray-700">{row.forklift_no}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-amber-700">{row.toplam} litre</span>
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            <div className="h-6" />
          </div>
        </div>
      )}
    </div>
  );
}
