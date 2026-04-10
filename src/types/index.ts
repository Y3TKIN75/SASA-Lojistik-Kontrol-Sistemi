export type Role = 'traktor' | 'forklift' | 'tir' | 'kalmar' | 'uzman';
export type Vardiya = '00:00-08:00' | '08:00-16:00' | '16:00-00:00';
export type CheckResult = 'uygun' | 'uygun_degil';
export type CheckType = 'Görsel' | 'Fonksiyon' | 'Kontrol' | 'Genel';

export interface ChecklistItemDef {
  id: number;
  soru: string;
  tur: CheckType;
}

export interface ChecklistItemResult {
  id: number;
  soru: string;
  tur: CheckType;
  sonuc: CheckResult;
  aciklama?: string | null;
  foto?: string | null;
}

export interface Operator {
  id: string;
  sicil_no: string;
  ad_soyad: string;
  role: Role;
  password_hash: string | null;
  is_active: boolean;
  created_at: string;
}

export interface FormSubmission {
  id: string;
  operator_id: string;
  sicil_no: string;
  ad_soyad: string;
  vardiya: Vardiya;
  vehicle_type: 'traktor' | 'forklift' | 'tir' | 'kalmar';
  checklist: ChecklistItemResult[];
  form_date: string;
  submitted_at: string;
  forklift_no?: string | null;
  calisma_saati?: string | null;
}

export interface SessionData {
  operator_id: string;
  sicil_no: string;
  ad_soyad: string;
  role: Role;
}
