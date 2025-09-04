# Styler

Styler is a modern salon management dashboard focused on a clean, mobile-first UX. It provides appointment insights, customer and staff management, payments, and analytics scaffolding, with secure auth and a scalable data model.

## Features

- **Appointments overview** and quick navigation
- **Customers and staff** sections
- **Payments** and **Analytics** (scaffolded)
- **Google Sign-In** with NextAuth (Prisma Adapter)
- **Mobile-optimized** layout and KPIs

## Tech Stack

- **Next.js 15** (App Router, Turbopack), **React 19**, **TypeScript**
- **Tailwind CSS v4**, Radix UI, Lucide icons
- **Firebase** (client auth) and **Firebase Admin** (server)
- **NextAuth** with Prisma Adapter
- **Prisma** (PostgreSQL)

## Project Structure

- `app/` — routes and pages (e.g., `app/login/page.tsx`, `app/(app)/onboarding/page.tsx`)
- `components/` — shared UI (e.g., `components/ui/button.tsx`)
- `lib/` — core services (`firebase.ts`, `firebaseAdmin.ts`, `auth.ts`, `db.ts`)
- `prisma/` — schemas and migrations
- `scripts/` — prisma build helpers

## Prerequisites

- Node.js 18+
- PostgreSQL database
- Firebase project (Web app + OAuth with Google)
- Google Cloud Service Account (for Admin SDK)

## Environment Variables

Create a `.env.local` with:

- **Client Firebase**
  - `NEXT_PUBLIC_FIREBASE_API_KEY`
  - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
  - `NEXT_PUBLIC_FIREBASE_APP_ID`
  - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` (optional)
  - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` (optional)
  - `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` (optional)

- **NextAuth**
  - `NEXTAUTH_URL=http://localhost:3000`
  - `NEXTAUTH_SECRET=your-strong-secret`
  - `GOOGLE_CLIENT_ID=...`
  - `GOOGLE_CLIENT_SECRET=...`

- **Database**
  - `DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB?schema=public`

- **Firebase Admin** (Application Default Credentials)
  - `GOOGLE_APPLICATION_CREDENTIALS_PATH=/absolute/path/to/service-account.json`
  - Note: Prefer platform secret managers; do not commit JSON secrets.

## Setup

Install dependencies:

```bash
npm install
```

Generate Prisma client and run dev migrations:

```bash
npm run prisma:generate
npm run prisma:migrate
```

Run the dev server:

```bash
npm run dev
# http://localhost:3000
```

## Security

- Secrets are ignored via `.gitignore` (e.g., `styler-1d75b-firebase-adminsdk.json`).
- If a secret was committed, rotate it and rewrite history (e.g., `git filter-repo`).

## Deployment

- Vercel recommended. Configure all env vars (Database, NextAuth, Firebase, Admin credentials) in the platform.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
