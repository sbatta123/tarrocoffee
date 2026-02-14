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

## 2b. How modifiers are stored (order history)

**Short answer:** Modifiers are not stored in a separate column or structured field. They are embedded in the `items` string.

- **In the app:** The chat API uses a cart that is an array of **display strings**, e.g. `["1x Latte (Large) (Hot) (Oat Milk)"]`. Size, temperature, milk, and other modifiers are included in parentheses in that string.
- **In the database:** The `orders.items` column holds a single string: comma-separated lines, e.g. `"1x Latte (Large) (Hot) (Oat Milk), 1x Plain Croissant"`. So modifiers **do** appear in order history — the kitchen display and any order list show the full line including `(Large) (Hot) (Oat Milk)` — but there is no separate “modifiers” field in the data model.
- **Implications:** You can show modifiers in the UI by showing `items` (split by comma). You cannot query or filter by modifier (e.g. “all orders with oat milk”) without parsing the text. For this demo, display-only order history was sufficient; a future improvement would be to store a structured payload (e.g. JSON) in `items` or in a separate column so modifiers are first-class in the schema.

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
