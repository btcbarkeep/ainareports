# AinaReports

Minimal Next.js 14 + Supabase frontend for AinaReports.com.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env.local` file in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

3. Run the dev server:

```bash
npm run dev
```

Then open http://localhost:3000.

## Pages

- `/` — Landing + search
- `/buildings/[id]` — Building report page
- `/units/[id]` — Unit report page
