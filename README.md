# Bitcoin Navigator

Das erste community-kuratierte Bitcoin-Vergleichsportal für den DACH-Raum.

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Create `.env.local` with:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase Setup

Run this SQL in your Supabase project to create the waitlist table:

```sql
create table waitlist (
  id uuid default gen_random_uuid() primary key,
  email text not null unique,
  source text default 'landing',
  created_at timestamptz default now()
);
```

## Deploy to Vercel

### Option A – Vercel CLI

```bash
npm i -g vercel
vercel deploy --prod
```

### Option B – GitHub Import

1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import the repository
4. Set environment variables (see below)

### Required Environment Variables in Vercel

Set these in **Vercel → Project → Settings → Environment Variables**:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

## API

**POST** `/api/subscribe`

```json
{ "email": "user@example.com", "source": "hero" }
```

Response `201`:
```json
{ "message": "Du bist dabei. Wir melden uns." }
```

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS v4
- Supabase (E-Mail-Speicherung)
- Syne + DM Mono (Fonts)
