# Claude Project Context

Build PayLink, a concise stablecoin payment-link MVP for freelancers and small vendors. Stack: React, Vite, TypeScript, React Router, Lucide and Pollar SDK. Use the latest mutually compatible `@pollar/core` and `@pollar/react` 0.12.0 packages.

The product flow is merchant invoice creation → shareable checkout URL → customer Pollar wallet connection → USDC transfer on Stellar Testnet → transaction status verification → invoice marked paid only after `SUCCESS`.

Important constraints:
- Do not invent SDK APIs. Check the installed package TypeScript declarations and official Pollar docs before changing integration code.
- Do not guess the USDC Testnet issuer. Require the exact issuer configured in the Pollar app.
- Never expose Pollar secret keys in frontend code.
- Do not simulate successful transactions or claim localStorage is a backend.
- Preserve the project setup files and keep scope focused on a demonstrable payment journey.
- Build command: `npm run build`.
