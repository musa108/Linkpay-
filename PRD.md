# PayLink — Product Requirements Document

## Product summary
PayLink lets independent businesses create shareable USDC payment requests and collect payment through a Pollar-connected wallet on Stellar.

## User problem
Small vendors and freelancers often need a simple way to request a specific amount from a customer without sending a long wallet address and manually reconciling every payment.

## Primary users
- Independent service providers and freelancers
- Small online vendors
- Customers paying a one-off invoice

## MVP journey
1. Vendor connects a Pollar wallet.
2. Vendor creates an invoice with a description, customer name, amount and receiving Stellar address.
3. PayLink creates a shareable `/pay/:id` route.
4. Customer opens the link, reviews amount and destination, and connects a Pollar wallet.
5. Customer authorizes a USDC payment.
6. PayLink checks the transaction status and marks the invoice paid only after Pollar reports `SUCCESS`.

## Scope
- React + Vite + TypeScript single-page application
- Pollar React provider and wallet button
- Stellar Testnet USDC payment flow
- Invoice creation, status display and transaction explorer link
- Browser localStorage persistence for a same-browser demonstration

## Explicit non-goals
- Production multi-tenant authentication or authorization
- Shared database or cross-device invoice synchronization
- Fiat conversion, refunds, recurring billing or subscriptions
- Production accounting, tax, KYC or compliance workflows

## Acceptance criteria
- User can create a valid invoice with a Stellar G-address.
- Checkout displays the invoice amount, currency, recipient and network.
- Payment action is unavailable until wallet connection and issuer configuration are present.
- App calls Pollar `sendPayment` for an issued USDC asset.
- Invoice is never marked paid merely because the user clicked Pay or a submission was returned.
- Only a transaction status of `SUCCESS` marks the invoice paid.
- Pending and failed states are represented honestly.

## Configuration
- `VITE_POLLAR_API_KEY`: Pollar publishable key for the app's testnet environment.
- `VITE_STELLAR_USDC_ISSUER`: exact Stellar Testnet USDC issuer configured/enabled for this Pollar app. Must be verified in the Pollar dashboard; do not guess.

## Known MVP limitation
Invoices are stored in localStorage. A shared payment URL is usable in another tab/browser only if that browser has the invoice data; there is no server database. A production implementation needs a backend that creates invoices and verifies payment events independently of the browser.
