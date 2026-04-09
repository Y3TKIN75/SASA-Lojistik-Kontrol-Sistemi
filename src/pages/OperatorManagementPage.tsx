import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import bcrypt from 'bcryptjs';
import { supabase } from '../lib/supabase';
import type { Operator, Role } from '../types';

const ROLE_LABELS: Record<Role, string> = {
  traktor: 'Traktör',
  forklift: 'Forklift',
  uzman: 'Uzman',
};

const ROLE_COLORS: Record<Role, string> = {
  traktor: 'bg-blue-100 text-blue-700',
  forklift: 'bg-purple-100 text-purple-700',
  uzman: 'bg-amber-100 text-amber-700',
};

export default function OperatorManagementPage() {
  const navigate = useNavigate();
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [sicilNo, setSicilNo] = useState('');
  const [adSoyad, setAdSoyad] = useState('');
  const [role, setRole] = useState<Role>('traktor');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete state
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);

  const fetchOperators = async () => {
    const { data } = await supabase
      .from('operators')
      .select('*')
      .eq('is_active', true)
      .order('ad_soyad');
    setOperators((data as Operator[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchOperators(); }, []);

  const resetForm = () => {
    setSicilNo(''); setAdSoyad(''); setRole('traktor'); setPassword(''); setFormError(null);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sicilNo.length !== 5) { setFormError('Sicil numarası 5 haneli olmalıdır.'); return; }
    if (!adSoyad.trim()) { setFormError('Ad Soyad boş olamaz.'); return; }
    if (role === 'uzman' && !password) { setFormError('Uzman için şifre zorunludur.'); return; }

    setSaving(true);
    setFormError(null);

    let password_hash: string | null = null;
    if (role === 'uzman' && password) {
      password_hash = await bcrypt.hash(password, 10);
    }

    const { error } = await supabase.from('operators').insert({
      sicil_no: sicilNo,
      ad_soyad: adSoyad.trim(),
      role,
      password_hash,
    });

    setSaving(false);

    if (error) {
      if (error.code === '23505') {
        setFormError('Bu sicil numarası zaten kayıtlı.');
      } else {
        setFormError('Hata: ' + error.message);
      }
      return;
    }

    resetForm();
    setShowForm(false);
    fetchOperators();
  };

  const handleDelete = async (op: Operator) => {
    if (!confirm(`"${op.ad_soyad}" listeden kaldırılsın mı?`)) return;

    setDeactivatingId(op.id);
    setDeleteError(null);

    const { error } = await supabase
      .from('operators')
      .update({ is_active: false })
      .eq('id', op.id);

    setDeactivatingId(null);

    if (error) {
      setDeleteError('İşlem başarısız: ' + error.message);
      return;
    }

    fetchOperators();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Üst Bar */}
      <div className="bg-[#003F87] text-white px-4 pb-3 header-safe sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/uzman/dashboard')} className="bg-white/10 rounded-lg p-1.5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="font-bold">Operatör Yönetimi</div>
        </div>
        <button
          onClick={() => { setShowForm(true); resetForm(); }}
          className="bg-white text-[#003F87] font-bold text-sm px-3 py-1.5 rounded-lg"
        >
          + Ekle
        </button>
      </div>

      <div className="px-4 py-4 space-y-4 max-w-lg mx-auto w-full">
        {deleteError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-medium">
            {deleteError}
            <button onClick={() => setDeleteError(null)} className="ml-2 text-red-400 font-bold">×</button>
          </div>
        )}

        {/* Operatör Listesi */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Yükleniyor...</div>
          ) : operators.length === 0 ? (
            <div className="p-8 text-center text-gray-400">Henüz operatör eklenmemiş.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {operators.map(op => (
                <div key={op.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-800">{op.ad_soyad}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">{op.sicil_no}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_COLORS[op.role]}`}>
                        {ROLE_LABELS[op.role]}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(op)}
                    disabled={deactivatingId === op.id}
                    className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center text-red-500 disabled:opacity-30"
                  >
                    {deactivatingId === op.id ? (
                      <span className="text-xs">...</span>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-xs text-gray-400 text-center">
          Toplam {operators.length} kayıt
        </div>
      </div>

      {/* Operatör Ekleme Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowForm(false)}>
          <div
            className="bg-white rounded-t-2xl w-full max-w-lg"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <span className="font-bold text-gray-800">Yeni Operatör Ekle</span>
              <button onClick={() => setShowForm(false)} className="text-gray-400 text-xl font-bold">×</button>
            </div>
            <form onSubmit={handleAdd} className="px-4 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sicil Numarası</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  value={sicilNo}
                  onChange={e => setSicilNo(e.target.value.replace(/\D/g, ''))}
                  placeholder="00000"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-[#003F87]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
                <input
                  type="text"
                  value={adSoyad}
                  onChange={e => setAdSoyad(e.target.value)}
                  placeholder="Adı Soyadı"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-[#003F87]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as Role)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-[#003F87] bg-white"
                >
                  <option value="traktor">Traktör Operatörü</option>
                  <option value="forklift">Forklift Operatörü</option>
                  <option value="uzman">Uzman / Yönetici</option>
                </select>
              </div>
              {role === 'uzman' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-[#003F87]"
                  />
                  <p className="text-xs text-gray-400 mt-1">Uzman paneline giriş şifresi.</p>
                </div>
              )}

              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                  {formError}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-[#003F87] text-white font-bold py-4 rounded-xl disabled:opacity-50"
              >
                {saving ? 'Kaydediliyor...' : 'Operatör Ekle'}
              </button>
              <div className="h-2" />
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
