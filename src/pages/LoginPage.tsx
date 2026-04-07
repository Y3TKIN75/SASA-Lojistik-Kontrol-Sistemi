import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { setSession, getSession } from '../lib/session';
import type { Operator } from '../types';

export default function LoginPage() {
  const navigate = useNavigate();
  const [sicilNo, setSicilNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Oturum varsa doğrudan yönlendir
  useEffect(() => {
    const session = getSession();
    if (session) {
      if (session.role === 'traktor') navigate('/form/traktor', { replace: true });
      else if (session.role === 'forklift') navigate('/form/forklift', { replace: true });
      else if (session.role === 'uzman') navigate('/uzman/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sicilNo.length !== 5) {
      setError('Sicil numarası 5 haneli olmalıdır.');
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: dbError } = await supabase
      .from('operators')
      .select('*')
      .eq('sicil_no', sicilNo)
      .eq('is_active', true)
      .maybeSingle();

    setLoading(false);

    if (dbError) {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
      return;
    }

    if (!data) {
      setError('Sicil numarası bulunamadı. Lütfen kontrol ediniz.');
      return;
    }

    const operator = data as Operator;

    if (operator.role === 'uzman') {
      navigate('/uzman/giris', { state: { operator } });
      return;
    }

    setSession({
      operator_id: operator.id,
      sicil_no: operator.sicil_no,
      ad_soyad: operator.ad_soyad,
      role: operator.role,
    });

    if (operator.role === 'traktor') navigate('/form/traktor', { replace: true });
    else navigate('/form/forklift', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#003F87] to-[#002D6B] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo / Başlık */}
        <div className="text-center text-white space-y-2">
          <div className="text-5xl font-black tracking-tight">SASA</div>
          <div className="text-lg font-medium opacity-90">Lojistik Kontrol Sistemi</div>
          <div className="text-sm opacity-70">İç Lojistik Departmanı</div>
        </div>

        {/* Form Kartı */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 space-y-5">
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-800">Giriş Yapın</h1>
            <p className="text-sm text-gray-500 mt-1">5 haneli sicil numaranızı giriniz</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sicil Numarası
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{5}"
                maxLength={5}
                value={sicilNo}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setSicilNo(val);
                  setError(null);
                }}
                placeholder="00000"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-center text-2xl font-bold tracking-widest text-gray-800 focus:outline-none focus:border-[#003F87] transition-colors"
                autoComplete="off"
                autoFocus
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || sicilNo.length !== 5}
              className="w-full bg-[#003F87] text-white font-bold py-4 rounded-xl text-base disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform shadow-md"
            >
              {loading ? 'Kontrol ediliyor...' : 'Giriş Yap'}
            </button>
          </form>
        </div>

        <p className="text-center text-white text-xs opacity-50">
          SASA Polyester A.Ş. © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
