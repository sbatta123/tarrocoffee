# Submission Checklist

Fill in the following for your submission:

---

## 1. URL to the project codebase on GitHub

**GitHub repository URL:**  
**https://github.com/sbatta123/tarrocoffee**

---

## 2. Orders data structure (sample data)

**File:** `orders.csv` (in the project root)

This CSV reflects the **orders** table used by the app (Supabase). Columns:

| Column         | Type    | Description |
|----------------|---------|--------------|
| `id`           | UUID    | Order ID (from Supabase). |
| `items`        | string  | Comma-separated line items (e.g. `"1x Latte (Small) (Hot) (Oat Milk), 1x Plain Croissant"`). |
| `total_price`  | number  | Order total in dollars. |
| `status`       | string  | `pending` (cart in progress), `new` (submitted), `in_progress` (kitchen), `completed`. |
| `created_at`   | ISO 8601 | When the order was created. |

Sample rows are in `orders.csv`.

---

## 3. URL of the deployed application

**Deployed app URL:**  
`https://your-app.vercel.app`  
*(Replace with your Vercel or other deployment URL.)*

---

## Get the code on GitHub

Run these in the project folder (after filling in your GitHub username and repo name):

```bash
git init
git add .
git commit -m "Initial commit: Tarro voice waiter"
git branch -M main
git remote add origin https://github.com/sbatta123/tarrocoffee.git
git push -u origin main
```

---

## Quick deploy (Vercel)

1. Push this repo to GitHub (see above).
2. Go to [vercel.com](https://vercel.com) → Import your repo.
3. Add environment variables in Vercel (same as `.env.local`):  
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `ELEVENLABS_API_KEY`.
4. Deploy. Use the provided URL as your “deployed application” link.
