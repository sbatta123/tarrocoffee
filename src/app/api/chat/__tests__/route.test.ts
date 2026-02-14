/**
 * Chat API route tests: ordering paths, modifiers, quantity, refusals, edge cases.
 * Mocks Supabase and ElevenLabs so we only test the ordering logic.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const mockOrderStore: {
  load: { id: string; items: string; total_price: number } | null;
  insertedId: string;
} = {
  load: null,
  insertedId: "test-order-123",
};

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: (table: string) => {
      if (table !== "orders") return {};
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({
                  data: mockOrderStore.load
                    ? { ...mockOrderStore.load, id: String(mockOrderStore.load.id) }
                    : null,
                }),
            }),
          }),
        }),
        update: () => ({ eq: () => Promise.resolve({}) }),
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: { id: mockOrderStore.insertedId } }),
          }),
        }),
      };
    },
  }),
}));

beforeEach(() => {
  mockOrderStore.load = null;
  mockOrderStore.insertedId = "test-order-" + Math.random().toString(36).slice(2, 9);
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve({
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        ok: true,
      })
    )
  );
});

async function postChat(body: { message: string; history?: { role: string; text: string }[]; orderId?: string | null }) {
  const { POST } = await import("../route");
  const req = new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const res = await POST(req);
  const data = await res.json();
  return data as {
    text?: string;
    cart?: string;
    cartTotal?: number;
    orderId?: string;
    orderComplete?: boolean;
    receipt?: string;
  };
}

describe("Chat API – ordering paths and edge cases", () => {
  describe("Greetings and place order", () => {
    it("responds to hi with welcome and menu", async () => {
      const data = await postChat({ message: "Hi" });
      expect(data.text).toMatch(/Welcome|What can I get|coffee|tea|pastries/i);
    });

    it("responds to 'can I place an order' with menu", async () => {
      const data = await postChat({ message: "Can I place an order" });
      expect(data.text).toMatch(/What can I get|coffee|tea|pastries/i);
    });

    it("responds to generic 'coffee' with drink list (no item added)", async () => {
      const data = await postChat({ message: "Can I get a coffee" });
      expect(data.text).toMatch(/Americano|Latte|Cold Brew|Mocha|Frappuccino|Which would you like/i);
      expect(data.cart).toBe("");
    });
  });

  describe("Adding drinks – quantity 1", () => {
    it("adds one latte and asks for size and temp", async () => {
      const data = await postChat({ message: "Can I get a latte" });
      expect(data.text).toMatch(/Got it.*1 Latte|What size|small or large|hot or iced/i);
      expect(data.cart).toMatch(/1x Latte/);
      expect(data.cart).not.toMatch(/2x|3x/);
      expect(data.orderId).toBeDefined();
    });

    it("adds one americano and asks for size and temp", async () => {
      const data = await postChat({ message: "I'll have an Americano" });
      expect(data.text).toMatch(/Got it|Americano|size|hot or iced/i);
      expect(data.cart).toMatch(/1x Americano/);
    });

    it("'latte' alone adds one and asks size/temp", async () => {
      const data = await postChat({ message: "latte" });
      expect(data.cart).toMatch(/1x Latte/);
      expect(data.text).toMatch(/size|hot or iced/i);
    });
  });

  describe("Modifiers – size and temp (with existing order)", () => {
    it("applies small and hot to last drink when orderId and cart sent", async () => {
      mockOrderStore.load = {
        id: "ord-1",
        items: "1x Latte",
        total_price: 4.5,
      };
      const data = await postChat({
        message: "small and hot",
        orderId: "ord-1",
      });
      expect(data.text).toMatch(/Perfect|Anything else|milk/i);
      expect(data.cart).toMatch(/Small|Hot/);
    });

    it("applies large and iced when sent with orderId", async () => {
      mockOrderStore.load = {
        id: "ord-1",
        items: "1x Americano",
        total_price: 3,
      };
      const data = await postChat({
        message: "large and iced",
        orderId: "ord-1",
      });
      expect(data.cart).toMatch(/Large|Iced/);
    });
  });

  describe("Milk choice", () => {
    it("accepts 'whole milk' when last drink is latte and needs milk", async () => {
      mockOrderStore.load = {
        id: "ord-1",
        items: "1x Latte (Large) (Hot)",
        total_price: 5.5,
      };
      const data = await postChat({
        message: "whole milk",
        orderId: "ord-1",
      });
      expect(data.cart).toMatch(/Whole milk/);
      expect(data.text).toMatch(/Got it|Anything else/i);
    });

    it("normalizes 'how do you whole milk' to whole milk", async () => {
      mockOrderStore.load = {
        id: "ord-1",
        items: "1x Latte (Large) (Hot)",
        total_price: 5.5,
      };
      const data = await postChat({
        message: "How do you whole milk",
        orderId: "ord-1",
      });
      expect(data.cart).toMatch(/Whole milk/);
    });
  });

  describe("Closing the order", () => {
    it("completes order when cart has full items and user says no / that's all", async () => {
      mockOrderStore.load = {
        id: "ord-1",
        items: "1x Latte (Small) (Hot) (Whole milk)",
        total_price: 4.5,
      };
      const data = await postChat({
        message: "No",
        history: [{ role: "assistant", text: "Anything else?" }],
        orderId: "ord-1",
      });
      expect(data.orderComplete).toBe(true);
      expect(data.receipt).toBeDefined();
      expect(data.cart).toBe("");
    });

    it("asks for missing size/temp when user says that's all but drink incomplete", async () => {
      mockOrderStore.load = {
        id: "ord-1",
        items: "1x Latte",
        total_price: 4.5,
      };
      const data = await postChat({
        message: "That's all",
        orderId: "ord-1",
      });
      expect(data.orderComplete).not.toBe(true);
      expect(data.text).toMatch(/size|hot or iced|confirm/i);
    });
  });

  describe("Refusals and edge cases", () => {
    it("refuses medium size", async () => {
      const data = await postChat({ message: "Can I get a medium latte" });
      expect(data.text).toMatch(/don't have a medium|small or large/i);
    });

    it("refuses lukewarm", async () => {
      const data = await postChat({ message: "lukewarm latte" });
      expect(data.text).toMatch(/standard hot|extra hot|iced/i);
    });

    it("no cart + 'small and hot' returns nudge not generic menu", async () => {
      const data = await postChat({ message: "small and hot" });
      expect(data.text).toMatch(/don't have a drink in progress|Tell me what you'd like/i);
    });

    it("empty cart + 'no' returns friendly empty message", async () => {
      const data = await postChat({ message: "No" });
      expect(data.text).toMatch(/don't have anything|what would you like/i);
    });
  });

  describe("Single message with size and temp", () => {
    it("adds latte with large and hot in one message", async () => {
      const data = await postChat({ message: "Can I get a large hot latte" });
      expect(data.cart).toMatch(/1x Latte.*Large.*Hot/);
      expect(data.text).toMatch(/milk|Anything else/i);
    });

    it("adds americano small iced in one message", async () => {
      const data = await postChat({ message: "small iced americano" });
      expect(data.cart).toMatch(/Americano.*Small|Small.*Americano/);
      expect(data.cart).toMatch(/Iced/);
    });
  });

  describe("Pastries", () => {
    it("adds chocolate chip cookie", async () => {
      const data = await postChat({ message: "Can I get a chocolate chip cookie" });
      expect(data.cart).toMatch(/Chocolate Chip Cookie/);
      expect(data.text).toMatch(/Got it|Anything else/i);
    });

    it("asks plain or chocolate when user says croissant", async () => {
      const data = await postChat({ message: "I want a croissant" });
      expect(data.text).toMatch(/Plain or Chocolate|croissant/i);
    });
  });

  describe("Explicit quantity", () => {
    it("adds two lattes when user says 'two lattes'", async () => {
      const data = await postChat({ message: "two lattes" });
      expect(data.cart).toMatch(/2x Latte/);
    });

    it("'can I get a latte' adds only one even if STT would say three", async () => {
      const data = await postChat({ message: "Can I get a latte" });
      expect(data.cart).toMatch(/1x Latte/);
      expect(data.cart).not.toMatch(/2x|3x/);
    });
  });

  describe("Response shape", () => {
    it("returns text, cart, cartTotal, orderId on success", async () => {
      const data = await postChat({ message: "one latte" });
      expect(typeof data.text).toBe("string");
      expect(data.text.length).toBeGreaterThan(0);
      expect(typeof data.cart).toBe("string");
      expect(typeof data.cartTotal).toBe("number");
      expect(data.orderComplete).toBe(false);
      if (data.cart) expect(data.orderId).toBeDefined();
    });
  });

  describe("Iced-only drinks", () => {
    it("adds Coffee Frappuccino and asks size (iced implied)", async () => {
      const data = await postChat({ message: "Coffee Frappuccino" });
      expect(data.cart).toMatch(/Coffee Frappuccino|Frappuccino/);
      expect(data.text).toMatch(/size|small or large/i);
    });
  });

  // ========== Category 1: Happy Paths (Deterministic Sarah spec) ==========
  describe("Category 1: Happy Paths – step-by-step Latte", () => {
    it("1.1 step 1: 'Can I get a Latte?' → asks size (small or large)", async () => {
      const data = await postChat({ message: "Can I get a Latte?" });
      expect(data.text).toMatch(/size|small or large/i);
      expect(data.cart).toMatch(/1x Latte/);
    });

    it("1.1 step 2: after Latte, 'Large' → asks hot or iced", async () => {
      mockOrderStore.load = { id: "o1", items: "1x Latte", total_price: 4.5 };
      const data = await postChat({ message: "Large.", orderId: "o1" });
      expect(data.text).toMatch(/hot or iced/i);
      expect(data.cart).toMatch(/Large/);
    });

    it("1.1 step 3: after Large, 'Iced' → asks milk", async () => {
      mockOrderStore.load = { id: "o1", items: "1x Latte (Large)", total_price: 5.5 };
      const data = await postChat({ message: "Iced.", orderId: "o1" });
      expect(data.text).toMatch(/milk|whole|skim|oat|almond/i);
      expect(data.cart).toMatch(/Iced/);
    });

    it("1.1 step 4: after Iced, 'Oat milk' → Got it, anything else?", async () => {
      mockOrderStore.load = { id: "o1", items: "1x Latte (Large) (Iced)", total_price: 5.5 };
      const data = await postChat({ message: "Oat milk.", orderId: "o1" });
      expect(data.text).toMatch(/Got it|Anything else/i);
      expect(data.cart).toMatch(/Oat milk/);
    });
  });

  describe("Category 1: One-shot and Americano (no milk)", () => {
    it("1.2 One-shot: 'Large Iced Oat Milk Latte' → Got it, anything else?", async () => {
      const data = await postChat({ message: "Can I get a Large Iced Oat Milk Latte?" });
      expect(data.cart).toMatch(/Latte.*Large|Large.*Latte/);
      expect(data.cart).toMatch(/Iced/);
      expect(data.cart).toMatch(/Oat milk/);
      expect(data.text).toMatch(/Got it|Anything else/i);
    });

    it("1.3 Americano: no milk asked after hot or iced", async () => {
      mockOrderStore.load = { id: "o1", items: "1x Americano (Small) (Hot)", total_price: 3 };
      const data = await postChat({ message: "Hot.", orderId: "o1" });
      expect(data.text).toMatch(/Got it|Anything else/i);
      expect(data.text).not.toMatch(/What milk|whole|skim|oat|almond/i);
    });
  });

  // ========== Category 2: Business Rules & Refusals ==========
  describe("Category 2: Business Rules & Refusals", () => {
    it("2.1 Forbidden size: 'Medium Coffee' → don't have medium, small or large", async () => {
      const data = await postChat({ message: "Can I get a Medium Coffee?" });
      expect(data.text).toMatch(/don't have a medium|small or large/i);
    });

    it("2.2 Impossible temp: 'lukewarm latte' → only hot or iced", async () => {
      const data = await postChat({ message: "Can I get a lukewarm latte?" });
      expect(data.text).toMatch(/only serve|hot|iced/i);
    });

    it("2.3 Warmed pastry: 'croissant warmed up' → cannot warm up pastries", async () => {
      const data = await postChat({ message: "Can I get a croissant warmed up?" });
      expect(data.text).toMatch(/cannot warm up pastries|We cannot warm/i);
    });

    it("2.4 Less ice on hot drink: hot latte then 'whole milk and less ice' → refuse less ice", async () => {
      mockOrderStore.load = { id: "o1", items: "1x Latte (Large) (Hot)", total_price: 5.5 };
      const data = await postChat({
        message: "Whole milk and less ice.",
        orderId: "o1",
      });
      expect(data.text).toMatch(/hot.*ice|ice level doesn't apply|cannot.*less ice/i);
    });
  });

  // ========== Category 3: Context Switching (if supported) ==========
  describe("Category 3: Context switching & corrections", () => {
    it("3.1 'Actually make that a Mocha' after Latte → asks size for Mocha", async () => {
      mockOrderStore.load = { id: "o1", items: "1x Latte", total_price: 4.5 };
      const data = await postChat({
        message: "Actually, make that a Mocha.",
        history: [{ role: "assistant", text: "Okay, Latte. Small or Large?" }],
        orderId: "o1",
      });
      expect(data.cart).toMatch(/Mocha/);
      expect(data.text).toMatch(/size|small or large/i);
    });

    it("3.2 'Actually make it Large' updates size on last drink", async () => {
      mockOrderStore.load = { id: "o1", items: "1x Latte (Small) (Hot)", total_price: 4.5 };
      const data = await postChat({
        message: "Actually make it Large.",
        orderId: "o1",
      });
      expect(data.cart).toMatch(/Large/);
      expect(data.cart).not.toMatch(/Small/);
    });
  });

  // ========== Category 4: Iced-only & Pastries ==========
  describe("Category 4: Iced-only & Pastries", () => {
    it("4.1 Cold Brew: no 'Hot or Iced' asked (iced only)", async () => {
      mockOrderStore.load = { id: "o1", items: "1x Cold Brew (Small)", total_price: 4 };
      const data = await postChat({ message: "Small.", orderId: "o1" });
      expect(data.text).toMatch(/Got it|Anything else/i);
      expect(data.text).not.toMatch(/Hot or iced/i);
    });

    it("4.2 Chocolate Croissant: no size or temp", async () => {
      const data = await postChat({ message: "Chocolate Croissant." });
      expect(data.cart).toMatch(/Chocolate Croissant/);
      expect(data.text).toMatch(/Got it|Anything else/i);
      expect(data.text).not.toMatch(/small or large|hot or iced/i);
    });

    it("4.3 Generic croissant → Plain or Chocolate; then 'Plain' → Plain Croissant", async () => {
      const first = await postChat({ message: "Can I get a croissant?" });
      expect(first.text).toMatch(/Plain or Chocolate|croissant/i);
      mockOrderStore.load = null;
      const second = await postChat({
        message: "Plain.",
        history: [{ role: "assistant", text: first.text }],
      });
      expect(second.cart).toMatch(/Plain Croissant/);
      expect(second.text).toMatch(/Got it|Anything else/i);
    });
  });

  // ========== Category 5: Closing gatekeeper ==========
  describe("Category 5: Closing gatekeeper", () => {
    it("5.1 Premature checkout: Latte without size, 'That's it' → blocks, need size", async () => {
      mockOrderStore.load = { id: "o1", items: "1x Latte", total_price: 4.5 };
      const data = await postChat({
        message: "That's it.",
        history: [{ role: "assistant", text: "Okay, Latte. Small or Large?" }],
        orderId: "o1",
      });
      expect(data.orderComplete).not.toBe(true);
      expect(data.text).toMatch(/size|confirm|still need/i);
    });

    it("5.2 Successful checkout: full item then 'That's it' → receipt and total", async () => {
      mockOrderStore.load = {
        id: "o1",
        items: "1x Latte (Small) (Hot) (Whole milk)",
        total_price: 4.5,
      };
      const data = await postChat({
        message: "That's it.",
        history: [{ role: "assistant", text: "Got it. Anything else?" }],
        orderId: "o1",
      });
      expect(data.orderComplete).toBe(true);
      expect(data.receipt).toBeDefined();
      expect(data.text).toMatch(/kitchen|total|pay/i);
    });
  });

  // ========== Category 6: Reset ==========
  describe("Category 6: Reset / Start over", () => {
    it("6.1 'Start over' clears order and asks what to get", async () => {
      mockOrderStore.load = { id: "o1", items: "1x Latte (Large) (Hot)", total_price: 5.5 };
      const data = await postChat({ message: "Start over.", orderId: "o1" });
      expect(data.text).toMatch(/cleared the order|What can I get/i);
      expect(data.cart).toBe("");
      expect(data.cartTotal).toBe(0);
    });
  });
});
