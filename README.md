# VA+LUMEN · Embrión Greenfield

Active implementation of the VA+LUMEN embryo derived from V37/V39/V40/V41/V43.

The goal is not to preserve the previous MVP. The active runtime is built from a blank-sheet greenfield architecture so the legacy can be discarded completely.

## Architecture
- Modular monolith with explicit bounded contexts and single write ownership.
- PostgreSQL relational core.
- Append-only Event Ledger + transactional outbox.
- Vendor adapters for Supabase, AI and future external capabilities.
- Surface-neutral semantic contracts: web is the first surface, not the organism.
- Multilingual/multicultural context is explicit and versionable.

## Current stage
S0 Foundation: Auth/Consent, RLS, Ledger/outbox, observability, CI/Preview and legacy-independence gates. S1+ implement the living vertical circuits defined by V40 and the experience in V43.

## Local commands
```bash
npm ci
npm run test:unit
npm run lint
npm run build
npm run e2e:smoke
npm run verify
```

## Configuration
Copy `.env.example` to `.env.local` and provide the publishable Supabase key for the dedicated greenfield project. Never commit service-role or other server secrets.

Canonical authority lives in the VA+LUMEN Google Drive and the current Sistema de Conducción POV.
