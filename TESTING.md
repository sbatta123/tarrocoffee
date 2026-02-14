# Ordering logic tests

Tests for the chat API (`/api/chat` POST) cover ordering paths, modifiers, quantity, refusals, and edge cases. Supabase and ElevenLabs are mocked so tests run without real credentials.

## Run tests

```bash
npm install   # if you haven't (installs vitest)
npm run test  # run once
npm run test:watch  # watch mode
```

## What’s covered

- **Greetings / place order** – “Hi”, “Can I place an order”, “Can I get a coffee” (menu list, no item added).
- **Adding drinks (quantity 1)** – “Can I get a latte”, “I’ll have an Americano”, “latte” → one item, ask size/temp.
- **Modifiers with existing order** – “small and hot”, “large and iced” when `orderId` + cart are sent.
- **Milk choice** – “whole milk”, “How do you whole milk” when last drink needs milk.
- **Closing the order** – “No” / “That’s all” with full cart → complete + receipt; with incomplete drink → ask for size/temp.
- **Refusals** – medium size, lukewarm → expected refusal messages.
- **Edge cases** – no cart + “small and hot” → nudge; empty cart + “no” → friendly empty message.
- **Single message with size and temp** – “Can I get a large hot latte” → one item with (Large) (Hot).
- **Pastries** – chocolate chip cookie; “croissant” → plain or chocolate.
- **Explicit quantity** – “two lattes” → 2x; “Can I get a latte” → 1x only.
- **Iced-only drinks** – Coffee Frappuccino → size asked, iced implied.
- **Response shape** – `text`, `cart`, `cartTotal`, `orderId` on success.

## Adding tests

Edit `src/app/api/chat/__tests__/route.test.ts`. Use `mockOrderStore.load` to simulate an existing order and `mockOrderStore.insertedId` for the id returned on insert. Call `postChat({ message, orderId?, history? })` and assert on the returned `text`, `cart`, `orderComplete`, etc.
