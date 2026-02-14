/**
 * Stress tests: many concurrent requests to the chat API with mocked Gemini + Supabase.
 * Run with: npm run test -- --testPathPattern=stress
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockOrderStore: {
  load: { id: string; items: string; total_price: number } | null;
  insertedId: string;
} = {
  load: null,
  insertedId: "stress-order-123",
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

function defaultGeminiJson(userMessage: string): string {
  const lower = (userMessage || "").toLowerCase();
  if (lower.includes("latte")) {
    return JSON.stringify({
      cart: ["1x Latte (Small, Hot)"],
      total_price: 4.5,
      response: "Got it. One small hot Latte. What size would you like? Anything else?",
      order_complete: false,
    });
  }
  if (lower.includes("hi") || lower.includes("hello")) {
    return JSON.stringify({
      cart: [],
      total_price: 0,
      response: "Welcome to TARRO! We have coffee, tea, and pastries. What can I get you?",
      order_complete: false,
    });
  }
  return JSON.stringify({
    cart: [],
    total_price: 0,
    response: "Sure. Anything else?",
    order_complete: false,
  });
}

beforeEach(() => {
  mockOrderStore.load = null;
  mockOrderStore.insertedId = "stress-" + Math.random().toString(36).slice(2, 11);
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = "stress-test-key";
  process.env.ELEVENLABS_API_KEY = "stress-eleven-key";

  vi.stubGlobal(
    "fetch",
    vi.fn((url: string | URL, init?: RequestInit) => {
      const u = typeof url === "string" ? url : url.toString();
      if (u.includes("generativelanguage.googleapis.com")) {
        if (u.includes("models?") && !u.includes("generateContent")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ models: [{ name: "models/gemini-pro" }] }),
          });
        }
        if (u.includes("generateContent")) {
          const body = init?.body ? JSON.parse(init.body as string) : {};
          const userMessage =
            (() => {
              const text = body.contents?.[0]?.parts?.[0]?.text ?? "";
              const match = text.match(/CURRENT USER MESSAGE:\s*"([^"]*)"/);
              return match ? match[1] : "";
            })();
          const json = defaultGeminiJson(userMessage);
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                candidates: [{ content: { parts: [{ text: json }] } }],
              }),
          });
        }
      }
      if (u.includes("elevenlabs.io")) {
        return Promise.resolve({
          ok: true,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        });
      }
      return Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)) });
    })
  );
});

afterEach(() => {
  delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  delete process.env.ELEVENLABS_API_KEY;
});

async function postChat(body: { message: string; orderId?: string | null }) {
  const { POST } = await import("../route");
  const req = new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const res = await POST(req);
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

describe("Chat API – stress tests", () => {
  const CONCURRENT = 30;

  it(`handles ${CONCURRENT} concurrent requests without errors`, async () => {
    const start = Date.now();
    const promises = Array.from({ length: CONCURRENT }, (_, i) =>
      postChat({ message: i % 3 === 0 ? "Hi" : i % 3 === 1 ? "One latte" : "That's all" })
    );
    const results = await Promise.all(promises);
    const elapsed = Date.now() - start;

    const failed = results.filter((r) => !r.ok || r.status !== 200);
    const noText = results.filter((r) => r.ok && (r.data.text == null || r.data.text === ""));

    expect(failed).toHaveLength(0);
    expect(noText).toHaveLength(0);
    results.forEach((r) => {
      expect(r.data).toHaveProperty("text");
      expect(r.data).toHaveProperty("cart");
      expect(typeof r.data.cartTotal).toBe("number");
    });

    console.log(`[stress] ${CONCURRENT} concurrent requests in ${elapsed}ms (${(elapsed / CONCURRENT).toFixed(0)}ms avg)`);
  }, 60000);

  it("handles repeated sequential requests (50x) with stable response shape", async () => {
    const start = Date.now();
    const messages = ["Hi", "One latte", "Small", "Hot", "No that's all"];
    for (let i = 0; i < 50; i++) {
      const msg = messages[i % messages.length];
      const { ok, status, data } = await postChat({ message: msg });
      expect(ok).toBe(true);
      expect(status).toBe(200);
      expect(data).toHaveProperty("text");
      expect(data).toHaveProperty("cart");
      expect(data).toHaveProperty("orderId");
    }
    const elapsed = Date.now() - start;
    console.log(`[stress] 50 sequential requests in ${elapsed}ms`);
  }, 60000);
});
