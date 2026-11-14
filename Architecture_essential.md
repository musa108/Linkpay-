# PayLink — Essential Architecture

React/Vite SPA → Pollar React provider → Pollar authenticated client → Stellar Testnet.

Invoice data is stored in browser localStorage. Payment flow: create invoice → share route → connect Pollar wallet → send issued USDC → poll transaction status → mark paid only on `SUCCESS`.

**Boundary:** this is a hackathon MVP, not production settlement infrastructure. Browser storage is not shared or authoritative. Production requires a backend database and independent transaction verification. Never expose a Pollar secret key in frontend code.
