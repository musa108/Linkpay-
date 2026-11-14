# Agents / Contributor Instructions

- Keep payment correctness ahead of visual polish.
- Never fabricate a transaction hash, wallet address, issuer, balance or confirmation.
- Never mark an invoice paid on button click or submission alone. Require Pollar transaction status `SUCCESS`.
- Do not hardcode a guessed USDC issuer. Read `VITE_STELLAR_USDC_ISSUER` and fail closed if absent.
- Keep Pollar secret keys server-side; Vite `VITE_*` variables are public.
- Validate amounts and Stellar recipient addresses before invoice creation.
- Keep the MVP limitation visible: localStorage is not shared persistence and is not production-safe.
- Run `npm run build` after code changes.
