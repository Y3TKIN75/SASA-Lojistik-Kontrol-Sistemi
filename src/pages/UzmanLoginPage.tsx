import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import bcrypt from 'bcryptjs';
import { setSession } from '../lib/session';
import type { Operator } from '../types';

export default function UzmanLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const operator = location.state?.operator as Operator | undefined;

  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // location.state yoksa (direkt URL erişimi), login sayfasına yönlendir
    if (!operator) {
      navigate('/', { replace: true });
    }
  }, [operator, navigate]);

  if (!operator) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setLoading(true);
    setError(null);

    const isMatch = await bcrypt.compare(password, operator.password_hash ?? '');

    setLoading(false);

    if (!isMatch) {
      setError('Şifre hatalı. Lütfen tekrar deneyiniz.');
      setPassword('');
      return;
    }

    setSession({
      operator_id: operator.id,
      sicil_no: operator.sicil_no,
      ad_soyad: operator.ad_soyad,
      role: 'uzman',
    });

    navigate('/uzman/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#003F87] to-[#002D6B] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center text-white space-y-2">
          <div className="text-5xl font-black tracking-tight">SASA</div>
          <div className="text-lg font-medium opacity-90">Uzman Girişi</div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6 space-y-5">
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-800">Şifrenizi Giriniz</h1>
            <p className="text-sm text-gray-500 mt-1">{operator.ad_soyad}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                placeholder="••••••••"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg text-gray-800 focus:outline-none focus:border-[#003F87] transition-colors"
                autoFocus
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full bg-[#003F87] text-white font-bold py-4 rounded-xl text-base disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform shadow-md"
            >
              {loading ? 'Doğrulanıyor...' : 'Giriş Yap'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/', { replace: true })}
              className="w-full text-gray-500 text-sm py-2"
            >
              ← Geri Dön
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
