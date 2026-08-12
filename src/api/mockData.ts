import i18n from '@/i18n';
import type { HealthNudge, PackageItem, PackageTemplate, Vendor } from './types';

/**
 * Mock catalog & vendor data. Prices are integer minor units.
 * Demo region: Hong Kong — the whole loop (sender, recipient, vendors) is
 * local, so both sides use HKD and there is no FX conversion (rate 1).
 */
export const LOCAL_CURRENCY = 'HKD';
export const SENDER_CURRENCY = 'HKD';
/** Single-currency loop: locked at 1. The FX row hides when rate === 1. */
export const FX_RATE: number = 1;

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
      basePriceLocal: 28_000, // HK$280
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
      basePriceLocal: 46_000, // HK$460
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
      basePriceLocal: 32_000, // HK$320
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
      basePriceLocal: 40_000, // HK$400
    },
    {
      id: 'tpl_elderly_care',
      key: 'elderly_care',
      name: i18n.t('packages.elderly_care.name'),
      description: i18n.t('packages.elderly_care.description'),
      glyph: 'elderly_care',
      category: 'mixed',
      baseItems: [
        item('rice_5kg', 1),
        item('canned_fish', 1, ['protein', 'calcium']),
        item('nutrition_milk', 1, ['protein', 'calcium']),
        item('multivitamins', 1),
      ],
      addOns: [item('calcium', 1, ['calcium']), item('bp_check', 1)],
      basePriceLocal: 33_000, // HK$330
      popular: true,
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
    id: 'ven_wing_kee',
    name: 'Wing Kee Provisions 榮記糧油',
    type: 'food',
    location: { lat: 22.3286, lng: 114.1602 },
    address: 'Shop 12, Pei Ho Street Market, Sham Shui Po 深水埗北河街街市12號舖',
    hours: '7:00–19:00',
    verified: true,
    offeredCategories: ['food'],
  },
  {
    id: 'ven_kwong_on',
    name: 'Kwong On Dispensary 廣安藥房',
    type: 'pharmacy',
    location: { lat: 22.3193, lng: 114.1694 },
    address: '168 Sai Yeung Choi St South, Mong Kok 旺角西洋菜南街168號',
    hours: '9:00–21:00',
    verified: true,
    offeredCategories: ['health'],
  },
  {
    id: 'ven_dhc',
    name: 'Sham Shui Po District Health Centre 深水埗地區康健中心',
    type: 'clinic',
    location: { lat: 22.3372, lng: 114.1552 },
    address: '303 Cheung Sha Wan Road, Sham Shui Po 長沙灣道303號',
    hours: '9:00–18:00',
    verified: true,
    offeredCategories: ['health'],
  },
  {
    id: 'ven_fresh_market',
    name: 'Kwun Tong Fresh Market 觀塘鮮活街市',
    type: 'market',
    location: { lat: 22.3122, lng: 114.2252 },
    address: 'Yue Man Square, Kwun Tong 觀塘裕民坊',
    hours: '6:30–19:00',
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
      id: 'ndg_sun',
      recipientId,
      icon: 'sun',
      message: i18n.t('nudges.sun'),
      action: { label: i18n.t('recipient.remindMe'), type: 'reminder', payload: 'morning_sun' },
      priority: 'normal',
      expiresAt: inDays(10),
    },
    {
      id: 'ndg_bp',
      recipientId,
      icon: 'heart',
      message: i18n.t('nudges.bp'),
      action: { label: i18n.t('recipient.seeClinic'), type: 'clinic', payload: 'ven_dhc' },
      priority: 'normal',
      expiresAt: inDays(14),
    },
    {
      id: 'ndg_flu',
      recipientId,
      icon: 'alert-circle',
      message: i18n.t('nudges.flu'),
      action: { label: i18n.t('recipient.seeClinic'), type: 'clinic', payload: 'ven_dhc' },
      priority: 'alert',
      expiresAt: inDays(4),
    },
  ];
}
