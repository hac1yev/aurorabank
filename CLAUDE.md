# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

Two independent npm projects; there is no root `package.json`. Run npm commands from inside `client/` or `server/`.

- `client/` — React 19 + Vite 8 + TypeScript SPA (MUI, Tailwind 4, TanStack Query, react-hook-form + zod, React Compiler via Babel).
- `server/` — NestJS 11 API with TypeORM (Postgres), ioredis, Cloudinary, OpenAI, Resend, Tesseract.js and face-api.js.

The product is "AuroraBank" account registration: a 5-step signup wizard backed by the API.

## Commands

### Server (`cd server`)

- Install: `npm ci` (on Windows, see the TensorFlow note in `server/README.md` if `@tensorflow/tfjs-node` fails to install)
- Dev server: `npm run start:dev` (watch mode). Production: `npm run build` then `npm run start:prod` (runs `dist/main.js`).
- Unit tests: `npm test`. Single file: `npx jest src/modules/registration/otp.service.spec.ts`. Single test by name: `npx jest -t "name fragment"`.
- E2E: `npm run test:e2e` (uses `test/jest-e2e.json`). It boots the full `AppModule`, so Postgres, Redis and env vars must be available.
- Lint: `npm run lint` (ESLint with `--fix` — it rewrites files). Format: `npm run format` (Prettier).
- Migrations: `npm run migration:run`, `npm run migration:revert`. `npm run migration:generate` hard-codes the migration name `InitSchema`; to name a new one, run `npm run typeorm migration:generate src/database/migrations/<Name>`.
- Local infra: `docker compose up` in `server/` starts Postgres 16, Redis 7, pgAdmin and the app (reads `.env.docker`).

### Client (`cd client`)

- Install: `npm ci`
- Dev server: `npm run dev` (Vite, port 5173 — the only frontend origin the API allows by default).
- Build: `npm run build` (runs `tsc -b` then `vite build`, so type errors fail the build).
- Lint: `npm run lint` (oxlint, config in `.oxlintrc.json`).
- Tests: `npm test` runs Vitest in watch mode locally. Run once: `npx vitest run`. Single file: `npx vitest run src/App.test.tsx`.

## Configuration

- The server loads `.env.${NODE_ENV}` (default `development`) via `ConfigModule` and `src/config/database.config.ts`. Available files: `.env.development`, `.env.production`, `.env.docker`, `.env.test`. These are untracked; never commit them.
- Env var names used by the server: `DB_HOST/PORT/USER/PASSWORD/NAME`, `REDIS_HOST/PORT/PASSWORD/TLS`, `AES_GCM_KEY_B64` (required — the app throws without it), `OPENAI_API_KEY`, `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET`, `RESEND_API_KEY`, `FRONTEND_URL` (added to CORS), `PORT` (default 3000).
- Postgres uses SSL only when `NODE_ENV=production`.
- The client reads `VITE_API_URL` (axios `baseURL` in `client/src/services/httpClient.ts`).

## Server architecture

### Module layout

`AppModule` imports `ConfigModule` (global), `DatabaseModule` (TypeORM, `autoLoadEntities`, `migrationsRun: true`, `synchronize: false`), `RedisModule` (global `RedisService` wrapper around an ioredis client), `MailModule` and `RegistrationModule`. Cloudinary and AI are separate modules imported by `RegistrationModule`.

Imports inside `server/src` use baseUrl-absolute paths such as `src/shared/...`. Follow that style.

### Global request handling (`src/main.ts`)

- `ValidationPipe` runs globally with `whitelist`, `forbidNonWhitelisted` and `transform`. Any unknown body property returns 400, so DTOs must list every field the client sends.
- Swagger UI is served at `/api/v1/openapi`.

### Registration flow — the core domain

The whole signup is stateful across requests. The state lives in Redis, and Postgres is written only at the end.

1. **Client**: each step is a page under `client/src/pages/Registration/`. The registration token is stored in `sessionStorage` (`registrationToken`); the step index is stored under `activeStep`. Each step's mutation (`client/src/mutations/*` → `client/src/services/*Service`) sends the token in an `x-registration-token` header.
2. **Server** `RegistrationController` (`/registration/*`) handles the steps in order:
   - `POST /personal-details` — no token yet. Generates a UUID token and stores the encrypted consent + personal details in Redis.
   - `POST /contact-details` — appends contacts to the session, then generates and emails an OTP.
   - `POST /verify-otp`, `POST /resend-otp` — OTP check and resend, rate-limited through Redis counters (see `otp.service.ts` and `shared/constants/otp.constants.ts`).
   - `POST /address-details` — appends the address.
   - `POST /ocr` (multipart, up to 2 images) — uploads to Cloudinary (`passports/` folder), stores the returned `public_id` in the session, runs Tesseract locally, then sends the text to OpenAI `gpt-4o-mini` to extract passport fields.
   - `POST /face-recognation` (multipart `image`) — downloads the passport image from Cloudinary and compares it with the selfie using face-api.js (Euclidean distance < 0.6 means a match).
   - `POST /confirm-password` — hashes the password into the session, then `ConsentService.persistConsentToDb` inserts a `users` row and deletes the Redis key.
3. **Session storage**: the key is `registration:<token>`, the TTL is 1 hour (`ConsentService.ttlSeconds`), and the value is the `RegistrationSession` JSON encrypted with AES-256-GCM (`shared/encryption/aes-gcm.helper.ts`, format `iv:ciphertext:tag`, all base64). Every write re-reads, merges and re-encrypts the whole session, so a step that writes a field must preserve the others.

Other Redis key families used by OTP logic: `otp:email:`, `otp:attempts:`, `otp:block:`, `otp:cooldown:`, `otp:resend:count:`, `otp:resend:block:`.

### Face recognition models

`FaceRecognationService` loads model weights from `join(process.cwd(), 'models')` in `onModuleInit`. Start the server from `server/`, or the models will not be found.

## Known gaps between spec and code

The detailed OCR requirements (per-user rate limits, failed-document lockout, `DOCUMENT_NOT_RECOGNIZED`, `MISMATCH` checks against the typed-in personal details) were removed from `client/README.md`, so the repo no longer holds a written spec for them. The server does not implement them: `ocr.service.ts` uploads, runs Tesseract, and calls OpenAI with no OCR rate limiting, lockout, or field comparison. The OTP rate limits in `otp.service.ts` are implemented. Do not assume an OCR error code or limit exists without checking the code.

## Development Workflow

- Inspect relevant files before making changes.
- Understand existing implementation before proposing a solution.
- Follow existing architectural patterns.
- Prefer minimal, targeted changes.
- Do not refactor unrelated code.
- Explain significant architectural decisions.
- Identify potential side effects before modifying shared functionality.

## Coding Conventions

- Use strict TypeScript.
- Avoid `any` unless absolutely necessary.
- Prefer small, reusable functions and components.
- Keep business logic separate from presentation.
- Follow existing naming conventions.
- Avoid unnecessary dependencies.
- Handle errors explicitly.
- Avoid duplicated business logic.
- Do not introduce new architectural patterns
  without a good reason.

## Testing Rules

- Write tests for new business logic.
- Update existing tests when changing behavior.
- Run relevant tests after modifications.
- Run the production build when appropriate.
- Never claim tests passed without executing them.
- Report tests that were skipped or failed.

## Security Rules

- Never expose API keys, passwords or secrets.
- Never commit environment files.
- Never log passwords, OTPs or sensitive personal data.
- Validate all incoming requests.
- Never bypass authentication or authorization checks.
- Protect sensitive user data.
- Explain security implications before changing
  authentication, encryption or OTP logic.
- Never execute destructive database operations
  without explicit approval.

## Native dependencies

`server/` depends on native addons (`canvas`, `@tensorflow/tfjs-node`); both are allowed to run install scripts via `allowScripts` in `package.json`. The `server/Dockerfile` installs the Cairo/Pango system libraries that `canvas` needs. Changing these dependencies may require rebuilding the Docker image.
