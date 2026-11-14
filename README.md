# PayLink

**Create. Share. Get paid.** Payment links for small businesses and independent professionals, powered by Pollar.

## Stack
React · Vite · TypeScript · Pollar SDK · React Router · Lucide

## Local setup

```bash
npm install
cp .env.example .env
# Fill in the publishable Pollar testnet key and the verified USDC issuer
npm run dev
```

## Environment variables

```env
VITE_POLLAR_API_KEY=pub_testnet_your_key
VITE_STELLAR_USDC_ISSUER=verified_testnet_issuer
```

Use a Pollar publishable key only. Never put a Pollar secret key in a `VITE_` variable.

## Payment flow
The checkout uses the authenticated Pollar client from `usePollar()`, calls `sendPayment()` for an issued Stellar asset, and checks `getTxStatus()` before marking an invoice paid. The USDC issuer must be verified in the Pollar dashboard and explicitly configured; the app intentionally does not guess it.

## Build

```bash
npm run build
npm run preview
```

## Demo limitation
Invoice records live in localStorage. This is a same-browser hackathon demo, not multi-user storage. Production requires a backend, merchant authentication and server-side payment verification.