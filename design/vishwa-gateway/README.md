# Vishwa Gateway UI design handoff

This independent frontend preserves the approved Vishwa Gateway design: Landing, sign-in, Model Market, customer Console, and Operations Admin. It is a source handoff for review and subsequent integration into new-api, not a replacement for the production `web/` application.

## Run locally

Use Node.js 22+ and Bun 1.4.3. From this directory:

```sh
bun install --frozen-lockfile
bun run dev
```

Open `http://127.0.0.1:3003/`. Customer routes use `#/console` and `#/models`; operations uses `#/admin`. The sign-in form accepts an email and the local design access code `482619`. No email is sent. Use fictional addresses such as `reviewer@example.com`.

```sh
bun run typecheck
bun run lint
bun run test
bun run build
bun run format:check
```

The build writes `dist/`. The sign-in compiler refreshes embedded local styles and the shared font; both `dist/` and dependencies are excluded from Git. No Sites project binding or deployment configuration is included.

## Integration boundary

All authentication, credit, orders, keys, activity and staff roles in this package are browser-local design state. The fixed access code, localStorage session and role selector are not security controls. Google OAuth, email OTP delivery, payment providers, wallets, inference, refunds and server authorization are not connected. Do not point production traffic at this package or import its local store as a production service.

`BACKEND-HANDOFF.txt` maps each screen to the required server integration and business decisions. Production adoption must retain new-api's existing authentication, authorization, billing and API contracts; compose its shared UI controls and route/data layers; and add the repository's i18n and regression coverage. This package intentionally retains the independently reviewed design components instead of changing production components during source delivery.

```text
src/main.tsx
  Landing + Model Market
  Customer Console + Checkout
  Operations Admin
  commerce.ts (local design state only)
public/signin.html (local access screen)
```

## Model catalog and assets

The catalog includes Kimi, MiniMax and Seedance. Models without configured gateway rates remain unavailable. The default Popular order is a curated model-family snapshot, not live traffic ranking. See `MODEL-CATALOG-NOTES.txt`.

Provider marks and font provenance are recorded in `PROVIDER-LOGO-SOURCES.txt`; font licenses remain alongside the assets. AI-generated hero art is described in `LANDING-ART-DIRECTION*.txt`. Provider marks identify their respective products and do not imply endorsement.

Source baseline: the approved public design version 5, source commit `c7bcaad76b43e8a19de8d1bac5a9261538d21788`. Repository packaging adds a dependency lock, format/lint commands, focused local-flow tests and this handoff. Existing new-api / QuantumNous notices and production files are retained unchanged. This submission was AI-assisted.
