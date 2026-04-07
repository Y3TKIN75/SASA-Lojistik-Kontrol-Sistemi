import type { ChecklistItemDef } from '../types';

export const traktorChecklist: ChecklistItemDef[] = [
  { id: 1,  soru: 'Çeki demiri bağlantısı sağlam mı?',                      tur: 'Görsel'    },
  { id: 2,  soru: 'Pim ve kilit mekanizmaları takılı mı?',                   tur: 'Görsel'    },
  { id: 3,  soru: 'Bağlantı cıvatalarında gevşeme var mı?',                  tur: 'Görsel'    },
  { id: 4,  soru: 'Elektrik bağlantıları (stop/sinyal) çalışıyor mu?',       tur: 'Fonksiyon' },
  { id: 5,  soru: 'Fren sistemi düzgün çalışıyor mu?',                       tur: 'Fonksiyon' },
  { id: 6,  soru: 'Lastiklerde hasar veya hava eksikliği var mı?',           tur: 'Görsel'    },
  { id: 7,  soru: 'Hidrolik hortumlarda kaçak var mı?',                      tur: 'Görsel'    },
  { id: 8,  soru: 'Yük güvenli şekilde sabitlenmiş mi?',                     tur: 'Görsel'    },
  { id: 9,  soru: 'Çalışma alanında riskli durum var mı?',                   tur: 'Kontrol'   },
  { id: 10, soru: 'Genel ekipman durumu uygun mu?',                          tur: 'Genel'     },
];

export const forkliftChecklist: ChecklistItemDef[] = [
  { id: 1,  soru: 'Çatal kollarında hasar var mı?',                                          tur: 'Görsel'    },
  { id: 2,  soru: 'Çatal yükseklik mekanizması çalışıyor mu?',                               tur: 'Fonksiyon' },
  { id: 3,  soru: 'Fren sistemi düzgün çalışıyor mu?',                                       tur: 'Fonksiyon' },
  { id: 4,  soru: 'Elektrik bağlantıları (stop/sinyal/uyarı lambası) çalışıyor mu?',         tur: 'Fonksiyon' },
  { id: 5,  soru: 'Lastiklerde hasar veya hava eksikliği var mı?',                           tur: 'Görsel'    },
  { id: 6,  soru: 'Hidrolik sistem (yükseltme/alçaltma) çalışıyor mu?',                      tur: 'Fonksiyon' },
  { id: 7,  soru: 'Yük kapasitesi etiketi mevcut ve okunabilir mi?',                         tur: 'Görsel'    },
  { id: 8,  soru: 'Emniyet kemeri/koruyucu kafes sağlam mı?',                                tur: 'Görsel'    },
  { id: 9,  soru: 'Çalışma alanında riskli durum var mı?',                                   tur: 'Kontrol'   },
  { id: 10, soru: 'Genel ekipman durumu uygun mu?',                                          tur: 'Genel'     },
];
