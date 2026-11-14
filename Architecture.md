# PayLink Architecture

## Overview
PayLink is a Vite-served React SPA. Pollar React provides wallet authentication and a Pollar client. The application stores invoice records in browser localStorage for the hackathon demo.

## Components
- `main.tsx`: mounts React Router and conditionally wraps the app in `PollarProvider` when a publishable key exists.
- `App.tsx`: dashboard, invoice creation modal and checkout route.
- `storage.ts`: localStorage repository for invoice CRUD.
- `types.ts`: invoice domain model.
- `styles.css`: responsive dashboard and checkout styling.

## Payment sequence
1. Customer opens `/pay/:id`.
2. Checkout loads invoice from localStorage.
3. Customer connects through Pollar `WalletButton`.
4. Checkout obtains the authenticated client from `usePollar()`.
5. `sendPayment` submits the Stellar issued-asset transfer.
6. The app extracts the returned transaction hash and polls `getTxStatus`.
7. The returned transaction ID is stored immediately. `SUCCESS` updates the invoice to `PAID`; `FAILED` updates it to `FAILED`; a still-pending result remains pending and blocks another attempt in that browser.

## Trust boundaries
- Publishable Pollar key may be exposed in the browser.
- Pollar secret keys must never be placed in Vite environment variables or shipped to the browser.
- `VITE_STELLAR_USDC_ISSUER` is public asset configuration, not a secret.
- localStorage is user-controlled and is not a trustworthy payment ledger.
- Client-side transaction polling is useful for a demo but not sufficient as production settlement verification.
- `sendPayment` and `getTxStatus` plus the typed `SubmitOutcome` variants were checked against installed Pollar 0.12.0 declarations. No real testnet transaction has been verified. A `cosign_pending` outcome is stored as awaiting approval and blocks repeat submission; this MVP does not yet resume or query that separate co-sign flow.

## Production evolution
- Add API and database for invoice creation and ownership.
- Add authenticated merchant accounts and authorization checks.
- Add server-side verification using Pollar/webhook or trusted transaction lookup.
- Make payment idempotent by invoice ID and transaction hash.
- Store audit events and prevent replay/double settlement.
- Add rate limits, validation, monitoring and privacy policy.
