# SendPlate 🍽️💛

**Send food, not just money — and see it arrive.**

SendPlate is a nutrition-remittance app: people working abroad send targeted
nutrition and health credit to family back home. The credit is redeemable only
at locally vetted vendors and clinics, and the sender receives proof that the
food or care was actually collected.

Built with **React Native + Expo (SDK 57) + TypeScript (strict) + expo-router**,
following the full build specification (design system, screens, mock API,
offline behavior).

## The core value loop

```
Sender picks a package → pays → Recipient gets a claim code
      → Recipient redeems at a vetted vendor → Vendor confirms + photo
      → Sender sees proof-of-delivery → Sender sends again
```

## Running it

```bash
cd sendplate
npm install
npm start          # Expo dev server — scan the QR with Expo Go / dev client
```

The app runs entirely against an **in-app mock API** (AsyncStorage-backed), so
no backend is needed. Everything below is demoable on one device.

### Demo walkthrough (single device, all three roles)

1. **Sender**: Welcome → pick a language → "I'm sending" → any phone number →
   OTP is **`123456`** → set a name + 4-digit PIN. The seeded world gives you
   a recipient (*Mama Achieng, Kisumu*) and a past collected order so the
   Activity feed is alive. Send a package: choose recipient → package →
   customize → review (transparent fees + FX) → pay (test mode; ~1 in 8
   payments intentionally fails so you can see the retry path). Note the
   claim code in Activity → order detail.
2. **Recipient**: log out (Profile) → "I'm receiving" → any phone → OTP
   `123456`. Your sent order appears as an active credit ~10 s after payment
   ("Ready to collect"). Tap **Show my code** — full-screen QR + big code,
   brightness boost, audio instructions, works offline once seen.
3. **Vendor**: log out → "I'm a vendor" → sign in the same way. **Scan** the
   code from a second device, or type it manually. See the hand-over
   checklist → confirm (photo optional) → submit. Turn on airplane mode
   first to see the offline queue + "pending sync" indicator; it syncs when
   connectivity returns, and conflicts (already-redeemed codes) are surfaced
   clearly in History.
4. Back as **Sender**: the Activity feed now shows the collected proof. 💛

A **design-system demo screen** (all shared components, both themes) is
reachable from the sender profile.

## What's implemented (spec phases)

- **Phase 0 — Foundation**: theme tokens (`src/theme/theme.ts`), Inter +
  Noto Sans via expo-font, i18n (English + Arabic, RTL enabled) with zero
  hardcoded strings, the full shared component library (Button, Card,
  PackageCard, StatusChip, Avatar, TextField, Pin/OtpInput, BottomSheet,
  EmptyState, SkeletonLoader, OfflineBanner, Toast, ScreenHeader,
  BigActionButton), and the mock API implementing the §10 contract.
- **Phase 1 — Sender**: auth flow (welcome/phone/OTP/profile+PIN), sender
  home, 5-step send flow with a `PaymentProvider` abstraction (mock/test
  mode; Stripe slots in for Phase 4), proof-of-delivery Activity feed with
  status progression and order detail.
- **Phase 2 — Recipient + Vendor**: recipient home with offline-cached
  credits, full-screen offline QR code (brightness boost + spoken
  instructions), health nudges + nearby clinics, vendor scan/manual redeem
  with photo confirm, offline redemption queue with sync + conflict
  handling, vendor history.
- **Phase 3 — Polish**: empty/loading/error/offline states on every screen,
  accessibility labels + 44pt targets + live regions, reduce-motion respect,
  haptics, PIN unlock gate on launch, dark mode.

**Phase 4 (real backend, Stripe, push, SMS-only recipients) and Phase 5
(analytics, crash reporting)** are intentionally not wired yet; the app is
architected for them (`src/lib/api/client.ts`, `src/lib/payments/`,
`EXPO_PUBLIC_USE_MOCK_API` swap).

## Project layout

```
src/
├── app/               # expo-router routes: (auth), (sender), (recipient), (vendor), send/, code/, order/
├── components/        # shared design-system library (§8.4)
├── theme/             # design tokens (§8) — the single source of truth
├── i18n/              # i18next setup + en/ar locale files
├── lib/
│   ├── api/           # Api interface, mockApi (default), axios client (Phase 4)
│   ├── payments/      # PaymentProvider interface + mock implementation
│   ├── storage.ts     # SecureStore/AsyncStorage helpers + offline cachedFetch
│   ├── money.ts       # minor-unit money math + formatting
│   └── dates.ts       # friendly relative dates
├── models/            # client-side data models (§9)
├── store/             # zustand: auth, send-flow draft, vendor offline queue
└── hooks/             # useOnline, useReducedMotion
```

## Verification

- `npx tsc --noEmit` — clean (strict mode).
- `npx expo export --platform android` — bundles successfully.
