-- ============================================================
-- SASA Polyester Lojistik Kontrol Formu - Veritabanı Şeması
-- ============================================================

-- UUID üretimi için extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- Tablo: operators
-- ============================================================
CREATE TABLE IF NOT EXISTS public.operators (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  sicil_no      varchar(5)  NOT NULL UNIQUE,
  ad_soyad      text        NOT NULL,
  role          text        NOT NULL CHECK (role IN ('traktor', 'forklift', 'uzman')),
  password_hash text,       -- Sadece uzman rolü için bcrypt hash
  created_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.operators IS 'Tüm araç operatörleri ve uzmanlar';
COMMENT ON COLUMN public.operators.password_hash IS 'bcrypt hash, sadece uzman rolünde dolu';

-- ============================================================
-- Tablo: form_submissions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.form_submissions (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id  uuid        NOT NULL REFERENCES public.operators(id) ON DELETE RESTRICT,
  sicil_no     varchar(5)  NOT NULL,
  ad_soyad     text        NOT NULL,
  vardiya      text        NOT NULL CHECK (vardiya IN ('00:00-08:00', '08:00-16:00', '16:00-00:00')),
  vehicle_type text        NOT NULL CHECK (vehicle_type IN ('traktor', 'forklift')),
  checklist    jsonb       NOT NULL DEFAULT '[]'::jsonb,
  form_date    date        NOT NULL DEFAULT CURRENT_DATE,
  submitted_at timestamptz NOT NULL DEFAULT now(),

  -- Aynı operatör aynı vardiyada aynı gün yalnızca bir form gönderebilir
  UNIQUE (sicil_no, vardiya, form_date)
);

CREATE INDEX IF NOT EXISTS idx_form_submissions_date
  ON public.form_submissions (form_date DESC);

CREATE INDEX IF NOT EXISTS idx_form_submissions_operator
  ON public.form_submissions (operator_id);

COMMENT ON COLUMN public.form_submissions.checklist IS
  'JSON array: [{id, soru, tur, sonuc}] — sonuc: "uygun" veya "uygun_degil"';

-- ============================================================
-- Row Level Security (RLS)
-- Uygulama Supabase Auth kullanmıyor, anon key ile çalışıyor.
-- Erişim kontrolü uygulama tarafında yapılıyor (uzman şifresi vs.)
-- ============================================================
ALTER TABLE public.operators        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

-- operators tablosu: okuma, ekleme, silme (uzman yönetim paneli için)
CREATE POLICY "anon_select_operators"
  ON public.operators FOR SELECT TO anon USING (true);

CREATE POLICY "anon_insert_operators"
  ON public.operators FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_delete_operators"
  ON public.operators FOR DELETE TO anon USING (true);

CREATE POLICY "anon_update_operators"
  ON public.operators FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- form_submissions tablosu: okuma ve ekleme
CREATE POLICY "anon_select_submissions"
  ON public.form_submissions FOR SELECT TO anon USING (true);

CREATE POLICY "anon_insert_submissions"
  ON public.form_submissions FOR INSERT TO anon WITH CHECK (true);

-- ============================================================
-- Örnek uzman kaydı (ilk kurulumda kullanmak için)
-- Şifreyi bcrypt ile hash'leyin ve aşağıdaki satırı çalıştırın.
-- Örnek: şifre "sasa2024" için hash üretmek üzere
-- Node.js'te: require('bcryptjs').hashSync('sasa2024', 10)
-- ============================================================
-- INSERT INTO public.operators (sicil_no, ad_soyad, role, password_hash)
-- VALUES ('00001', 'Uzman Adı Soyadı', 'uzman', '$2a$10$...');
