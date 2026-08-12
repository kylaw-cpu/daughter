import i18n from '@/i18n';
import type { HealthNudge, PackageItem, PackageTemplate, Vendor } from './types';

/**
 * Mock catalog & vendor data. Prices are integer minor units in the
 * recipient's local currency (demo region: Kenya, KES).
 */
export const LOCAL_CURRENCY = 'KES';
export const SENDER_CURRENCY = 'USD';
/** KES per USD, locked into orders at review time. */
export const FX_RATE = 129.0;

function item(key: string, quantity: number, nutrients?: string[]): PackageItem {
  return { key, label: i18n.t(`packages.items.${key}`), quantity, nutrients };
}

/** Built at call time so labels come out in the current language. */
export function buildPackageTemplates(): PackageTemplate[] {
  return [
    {
      id: 'tpl_kids_protein',
      key: 'kids_protein',
      name: i18n.t('packages.kids_protein.name'),
      description: i18n.t('packages.kids_protein.description'),
      glyph: 'kids_protein',
      category: 'food',
      baseItems: [
        item('eggs_30', 1, ['protein']),
        item('lentils_2kg', 1, ['protein', 'iron']),
        item('milk_powder', 1, ['protein', 'calcium']),
      ],
      addOns: [
        item('vitamin_a', 1, ['vitamin_a']),
        item('deworming', 1),
      ],
      basePriceLocal: 155_000, // KES 1,550
      popular: true,
    },
    {
      id: 'tpl_mother_baby',
      key: 'mother_baby',
      name: i18n.t('packages.mother_baby.name'),
      description: i18n.t('packages.mother_baby.description'),
      glyph: 'mother_baby',
      category: 'mixed',
      baseItems: [
        item('prenatal_vitamins', 1, ['iron', 'folate']),
        item('checkup_credit', 1),
        item('iron_flour', 1, ['iron']),
      ],
      addOns: [item('iron_supplement', 1, ['iron'])],
      basePriceLocal: 210_000,
    },
    {
      id: 'tpl_family_staples',
      key: 'family_staples',
      name: i18n.t('packages.family_staples.name'),
      description: i18n.t('packages.family_staples.description'),
      glyph: 'family_staples',
      category: 'food',
      baseItems: [
        item('rice_5kg', 1),
        item('beans_2kg', 1, ['protein', 'iron']),
        item('oil_1l', 1),
        item('iron_flour', 1, ['iron']),
      ],
      addOns: [item('eggs_30', 1, ['protein'])],
      basePriceLocal: 185_000,
    },
    {
      id: 'tpl_clinic_visit',
      key: 'clinic_visit',
      name: i18n.t('packages.clinic_visit.name'),
      description: i18n.t('packages.clinic_visit.description'),
      glyph: 'clinic_visit',
      category: 'health',
      baseItems: [item('consultation', 1), item('multivitamins', 1)],
      addOns: [item('deworming', 1), item('vitamin_a', 1, ['vitamin_a'])],
      basePriceLocal: 120_000,
    },
  ];
}

/**
 * Embedded placeholder used for simulated proof photos, so the proof loop
 * renders with zero connectivity (and in the web preview, where external
 * images are blocked). Real proof photos come from the vendor camera.
 */
export const PROOF_PHOTO_PLACEHOLDER =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUAAAADwCAIAAAD+Tyo8AAAC8klEQVR42u3cMRGAMBBE0cihQhBowR8SUIAJGiyEGYpL9s08BXv5bdpzX8CgmglAwICAAQGDgAEBAwIGBAwCBgQMCBgEDAgYEDAgYBAwIGBAwICAQcCAgAEBg4ABAQMCBgQMAgYEDAgYEDAIGBAwIGAQMCBgQMCAgEHAgIABAYOArQACBgQMCBgEDAgYEDAgYBAwIGBAwCBgQMCAgAEBg4ABAQMCBgQMAgYEDAgYBAwIGBAwIGAQMCBgQMCAgEHAgIABAYOAAQEDAgYEDAIGBAwIGAQMCBgQMCBgEDAgYEDAgIBBwNSyHvtXRhMwReP8i/EFzAChClvAzFysngXMPMXqWcCiFTMCFq2YBYxulSxg3aJkAetWyQhYujIWMLpVsoCli4wFLF0ZI2DpyljA0kXGAlYvGhawdGUsYOkiYwGrFw0LWL1oWMDSlbGA1YuGBaxeNCxg9aLhwIA9bg0LWL1oWMDqRcMCVi/JDQsYAQtYvWhYwOpFwwIWMAJWLxoWsIARsIDVi4YFjIAFLGAELGABI2ABq5fghgWMgAUsYAQsYAEjYAELGAELGAELWMAIWMACRsACRsAC1jDqFbCAEbCABYyABYyABaxh1CtgASNgAWsYv1IKGAELWMOoV8AaRr0CRsAC1jDqFbCGUa+ANUxcvXEBa1i9AtYw6hWwhlGvgDVMbL3RActYugLWMOoVsIZRr4BlLF0By1ge0hWwhlGvgGWMdAUsY+kKWMZIV8AyRroCVrJuEbCMpStgJaNbAStZtwhYyboVMGIWrYBJjNmhBaxnxdIR8LktFDFQsY5VhICFLVQBM2DkRhMwIGBAwCBgQMCAgAEBg4ABAQMCBgQMAgYEDAgYBAwIGBAwIGAQMCBgQMAgYEDAgIABAYOAAQEDAgYEDAIGBAwIGAQMCBgQMCBgEDAgYEDAgIBBwICAAQGDgAEBAwIGBAwCBgQMCBgEbAIQMCBgQMAgYEDAgIABAYOAAQEDAgYBAwIGBAx0eQEB5Lgfvu6C6AAAAABJRU5ErkJggg==';

export const MOCK_VENDORS: Vendor[] = [
  {
    id: 'ven_mama_akinyi',
    name: "Mama Akinyi's Provisions",
    type: 'food',
    location: { lat: -0.0917, lng: 34.768 },
    address: 'Kibuye Market, Stall 14, Kisumu',
    hours: '7:00–19:00',
    verified: true,
    offeredCategories: ['food'],
  },
  {
    id: 'ven_afya_pharmacy',
    name: 'Afya Bora Pharmacy',
    type: 'pharmacy',
    location: { lat: -0.0889, lng: 34.7602 },
    address: 'Oginga Odinga St, Kisumu',
    hours: '8:00–20:00',
    verified: true,
    offeredCategories: ['health'],
  },
  {
    id: 'ven_tumaini_clinic',
    name: 'Tumaini Community Clinic',
    type: 'clinic',
    location: { lat: -0.1024, lng: 34.7551 },
    address: 'Nyalenda B, Kisumu',
    hours: '8:00–17:00',
    verified: true,
    offeredCategories: ['health'],
  },
  {
    id: 'ven_soko_fresh',
    name: 'Soko Fresh Grocers',
    type: 'market',
    location: { lat: -0.0951, lng: 34.7719 },
    address: 'Jomo Kenyatta Hwy, Kisumu',
    hours: '6:30–18:30',
    verified: true,
    offeredCategories: ['food'],
  },
];

export function eligibleVendorsFor(category: PackageTemplate['category']): Vendor[] {
  if (category === 'mixed') return MOCK_VENDORS;
  return MOCK_VENDORS.filter((v) =>
    v.offeredCategories.includes(category === 'health' ? 'health' : 'food')
  );
}

export function buildMockNudges(recipientId: string): HealthNudge[] {
  const inDays = (d: number) => new Date(Date.now() + d * 86_400_000).toISOString();
  return [
    {
      id: 'ndg_vita',
      recipientId,
      icon: 'sun',
      message:
        i18n.language === 'ar'
          ? 'أطفالك يحصلون على البروتين — قطرات فيتامين أ مجانية في العيادة القريبة يوم الخميس.'
          : 'Your kids are getting protein — Vitamin A drops are free at the clinic 2 km away this Thursday.',
      action: { label: i18n.t('recipient.seeClinic'), type: 'clinic', payload: 'ven_tumaini_clinic' },
      priority: 'normal',
      expiresAt: inDays(6),
    },
    {
      id: 'ndg_water',
      recipientId,
      icon: 'droplet',
      message:
        i18n.language === 'ar'
          ? 'الماء النظيف يساعد الحديد على العمل — اغلِ ماء الشرب هذا الأسبوع.'
          : 'Clean water helps iron do its work — boil drinking water this week.',
      action: { label: i18n.t('recipient.remindMe'), type: 'reminder', payload: 'boil_water' },
      priority: 'normal',
      expiresAt: inDays(10),
    },
    {
      id: 'ndg_vax',
      recipientId,
      icon: 'alert-circle',
      message:
        i18n.language === 'ar'
          ? 'حملة تطعيم الحصبة يوم السبت في عيادة توماني المجتمعية — مجانية للجميع.'
          : 'Measles vaccination drive Saturday at Tumaini Community Clinic — free for all children.',
      action: { label: i18n.t('recipient.seeClinic'), type: 'clinic', payload: 'ven_tumaini_clinic' },
      priority: 'alert',
      expiresAt: inDays(4),
    },
  ];
}
