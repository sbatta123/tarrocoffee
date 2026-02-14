# How to run and deploy Tarro Voice Waiter

## 1. Run locally (development)

Uses your `.env.local` for API keys. **Do not commit `.env.local`.**

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 2. Run production build locally

Build and run the optimized app locally:

```bash
npm run build
npm run start
```

Then open [http://localhost:3000](http://localhost:3000).

---

## 3. Run tests

```bash
npm test
```

Watch mode (re-runs on file changes):

```bash
npm run test:watch
```

Stress test only:

```bash
npm run test:stress
```

---

## 4. Deploy (e.g. Vercel)

### Option A: Vercel (recommended for Next.js)

1. **Push your code to GitHub** (if you haven’t already):
   - Create a repo on GitHub, then:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```
   - Make sure `.env.local` is in `.gitignore` (Next.js usually adds it).

2. **Import the project on Vercel**  
   - Go to [vercel.com](https://vercel.com) → Sign in → **Add New** → **Project**.  
   - Import your GitHub repo and deploy.

3. **Add environment variables**  
   In the Vercel project: **Settings** → **Environment Variables**. Add each of these (use the same values as in your `.env.local`; do **not** paste keys into this file or into chat):

   | Name | Where to use |
   |------|----------------------|
   | `GOOGLE_GENERATIVE_AI_API_KEY` | All (Production, Preview, Development) |
   | `NEXT_PUBLIC_SUPABASE_URL` | All |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All |
   | `ELEVENLABS_API_KEY` | All (if you use ElevenLabs) |
   | `NEXT_PUBLIC_ELEVENLABS_API_KEY` | All (if you use ElevenLabs on the client) |

   Save, then trigger a **Redeploy** from the Deployments tab so the new env vars are used.

### Option B: Other hosts (Netlify, Railway, etc.)

- Run `npm run build` and use the output (e.g. `.next` + `npm run start`, or the host’s Next.js instructions).
- Add the same environment variable **names** and values as in your `.env.local` in that host’s dashboard.

---

## Security reminder

- **Never commit `.env.local`** or paste real API keys into docs or chat.
- If any key was ever committed or shared, rotate it (generate a new one in the provider’s dashboard and update your env).
