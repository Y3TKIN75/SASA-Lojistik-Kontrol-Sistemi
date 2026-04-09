import { useNavigate } from 'react-router-dom';
import { getSession, clearSession } from '../lib/session';
import type { Vardiya } from '../types';

function detectVardiya(): Vardiya {
  const now = new Date();
  const m = now.getHours() * 60 + now.getMinutes();
  if (m >= 23 * 60 + 45 || m < 7 * 60 + 45) return '00:00-08:00';
  if (m < 15 * 60 + 45) return '08:00-16:00';
  return '16:00-00:00';
}

export default function TraktorHomePage() {
  const navigate = useNavigate();
  const session = getSession()!;
  const vardiya = detectVardiya();
  const firstName = session.ad_soyad.split(' ')[0];

  const handleLogout = () => {
    clearSession();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#003F87] to-[#002D6B] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">

        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center space-y-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-gray-800">İyi Çalışmalar, {firstName}!</h2>
          <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-2 text-sm text-left">
            <div className="flex justify-between">
              <span className="text-gray-500">Ad Soyad</span>
              <span className="font-medium text-gray-800">{session.ad_soyad}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Sicil No</span>
              <span className="font-medium text-gray-800">{session.sicil_no}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Vardiya</span>
              <span className="font-semibold text-[#003F87] bg-blue-50 px-3 py-0.5 rounded-full text-xs">{vardiya}</span>
            </div>
          </div>
          <p className="text-sm text-gray-500">Kontrol formunuz bu vardiya için tamamlandı.</p>
        </div>

        <button
          onClick={() => navigate('/form/mazot')}
          className="w-full bg-white text-[#003F87] font-bold py-5 rounded-2xl text-base shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-3"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          Mazot Alım Formu
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-white/15 border border-white/30 text-white font-medium py-3 rounded-xl text-sm active:scale-95 transition-transform"
        >
          Çıkış Yap
        </button>

        <p className="text-center text-white text-xs opacity-50">
          SASA Polyester A.Ş. © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
