# Parks 3D

Browser studio and landing page at https://bonaparks.com.

## Development

Requires Node.js 22 or later. No frontend API keys are needed.

- `npm run build`: creates `dist/` from `site/` and preserved mobile-app pages in `public/`; checks static references.
- `npm run preview`: serves the production build at http://127.0.0.1:8775.
- `npm test`: verifies plan geometry, device state, shutters and security replay.

The Su Pranu architecture uses the approved render assets without geometry changes. Device controls and security scenarios are local demonstrations; no real devices or cameras are connected.

## Hosting

Netlify project `bonaparks1` deploys branch `main`. Keep the existing iOS support/privacy routes and `netlify/functions` intact. Credentials stay in Netlify environment variables; the static frontend does not receive them. The previous site is recoverable from commit `0555ed7b4e43feddb717f16358c9bbf341ed4c2c` or the previous Netlify production deployment.

## Legal follow-up

The web demo is free, with no checkout or subscription. Its CGU, privacy, contact and commercial-status pages are published with the existing Bonaparks support email. Complete the legal publisher identity (legal name, professional address, country, registration/VAT) when provided by the owner. Sales terms for a paid offer must be defined before adding sales.
