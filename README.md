# SendPlate

Send food, not just money — and see it arrive.

SendPlate is a nutrition-remittance mobile app: send targeted nutrition and
health credit to family instead of raw cash. The credit is redeemable only at
vetted local vendors and clinics, and the sender receives photo proof that the
food or care was actually collected.

The demo region is **Hong Kong**, with the whole loop local: family (in HK or
abroad) sends in HKD, relatives redeem at HK shops, pharmacies and District
Health Centres, all in one currency (the FX machinery stays in place for
multi-currency corridors later).

```
Sender picks a package → pays → Recipient gets a claim code
      → Recipient redeems at a vetted vendor → Vendor confirms + photo
      → Sender sees proof-of-delivery → Sender sends again
```

## Stack

- **Expo SDK 54** (managed workflow) + **TypeScript strict** + **expo-router**
- **@tanstack/react-query** (server state) + **zustand** (local/UI state)
- **i18next** — Traditional Chinese (Hong Kong) + English + Arabic (RTL); every string localized
- **expo-secure-store** (token + salted PIN hash), **AsyncStorage** (offline caches, mock DB)
- **expo-camera** (QR scan + proof photos), **react-native-qrcode-svg** (code display)
- **expo-speech** (audio prompts), **expo-brightness** (code-screen boost)
- Payments behind a `PaymentProvider` interface (mock now; Stripe PaymentSheet in Phase 4)

## Running

```bash
npm install
npm start          # Expo dev server — press a for Android, i for iOS, w for web
npm run typecheck  # tsc --noEmit
```

The app runs fully against an in-app mock backend (`USE_MOCK_API` in
`app.json` → `expo.extra`), so the entire loop is demoable on one device with
no server.

## Demo walkthrough (single device plays all three roles)

1. **Sender**: Welcome → "I'm sending" → any phone number → any 6-digit OTP
   (except `000000`, which demos the error state) → profile + first recipient
   → set PIN. Send flow: choose recipient → package → customize → review →
   pay ("Visa •••• 4242" succeeds; the other methods demo decline/pending).
2. Watch **Activity**: the order goes *Sent → Ready to collect* (~8 s). After
   ~90 s the mock auto-collects with a proof photo — or play vendor yourself:
3. **Vendor**: Profile → Sign out (reset keeps its own copy per role choice) →
   "I'm a vendor" → redeem: type the claim code shown on the recipient's code
   screen (e.g. `PLTE-1234`), confirm with a photo, submit.
4. **Recipient**: choose "I'm receiving" on a fresh sign-in — a ready credit
   is seeded so Home, the full-screen offline QR code, and the Health tab all
   have content. Airplane mode still shows the code (cached).

## Layout

```
app/                    expo-router routes
  (auth)/               welcome · phone-entry · otp-verify · profile-setup · unlock
  (sender)/             home · activity · profile · order/[id] · send/{5-step flow}
  (recipient)/          home · code/[id] · health · profile
  (vendor)/             redeem · history
  design-system.tsx     Storybook-style demo of every shared component
src/
  api/                  contract · mockApi (AsyncStorage-backed) · httpApi (Phase 4) · types
  components/           shared library (Button, PackageCard, StatusChip, …)
  hooks/                react-query hooks · offline-cached recipient reads
  i18n/                 i18next setup + en/ar locales
  lib/                  money · dates · pricing · code cache · reduce-motion
  payments/             PaymentProvider interface + mock provider
  store/                auth · network · sendFlow · vendor offline queue
  theme/                design tokens (authoritative) + ThemeProvider
```

## Build phases (per the spec)

- **Phase 0** — scaffold, theme tokens, i18n (en+ar), component library, mock API ✅
- **Phase 1** — auth + sender happy path (send flow, pay states, activity feed) ✅
- **Phase 2** — recipient (offline code, health) + vendor (scan, redeem, offline queue) ✅
- **Phase 3** — states, a11y, RTL, haptics, PIN gate, analytics events ✅
- **Phase 4** — real backend (`src/api/httpApi.ts` already implements the REST
  contract), Stripe PaymentSheet, push notifications, photo upload, SMS-only recipients
- **Phase 5** — beta hardening: crash reporting, remote config, field tests on 2G

## Notes on deliberate choices

- **Stripe SDK not yet wired**: the PaymentSheet needs a backend to mint
  PaymentIntents; until Phase 4 the `PaymentProvider` mock exercises every
  payment state (success/decline/pending) without dead native code.
- **Status progression is computed lazily** in the mock (on read, not timers)
  so it survives app restarts; `paid → ready` ≈ 8 s, demo auto-collect ≈ 90 s
  to leave time for a manual vendor demo.
- **Money is integer minor units everywhere**; formatting happens only at the
  edge (`src/lib/money.ts`).
- **Non-Latin scripts** render via platform system fonts (Noto-based) rather
  than bundling Noto Sans, keeping the download well under the 25 MB target.
