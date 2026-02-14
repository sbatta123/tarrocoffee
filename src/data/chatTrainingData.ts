/**
 * Training / examples data for Sarah (chat logic).
 *
 * Use for:
 * 1. Data-driven rules: match user message → intent + response (no hacky if/else).
 * 2. Few-shot examples: feed to an LLM prompt to handle edge cases without hard coding.
 *
 * Rules are evaluated in order; first match wins. Add new edge cases by adding entries here.
 */

export type RuleIntent =
  | "reset"
  | "place_order"
  | "menu_query"
  | "greeting"
  | "refusal"
  | "closing"
  | "other";

export interface ChatRule {
  /** Short label for debugging */
  id: string;
  /** If true, message is matched when ALL keywords appear (anywhere) in the user message (lowercased). */
  keywords?: string[];
  /** If set, message is matched when this regex matches the lowercased user message. Overrides keywords. */
  pattern?: RegExp;
  /** Intent category (for routing or logging). */
  intent: RuleIntent;
  /** Fixed response. Use {{var}} for templates if we add interpolation later. */
  response: string;
  /** When true, do NOT add any item to the cart for this message (e.g. "place an order", "what kind of coffee"). */
  noAddItem: boolean;
}

/** Ordered list of rules. First match wins. Put more specific rules before generic ones. */
export const CHAT_RULES: ChatRule[] = [
  // ---- Reset ----
  {
    id: "reset",
    keywords: ["start", "over"],
    intent: "reset",
    response: "Okay, I've cleared the order. What can I get for you?",
    noAddItem: true,
  },
  {
    id: "reset-clear",
    keywords: ["clear", "order"],
    intent: "reset",
    response: "Okay, I've cleared the order. What can I get for you?",
    noAddItem: true,
  },
  {
    id: "reset-restart",
    keywords: ["restart"],
    intent: "reset",
    response: "Okay, I've cleared the order. What can I get for you?",
    noAddItem: true,
  },

  // ---- Place order (never add item; often misheard as "latte") ----
  {
    id: "place-order",
    pattern: /\b(place|latte)\s+(a|an)?\s*order\b/i,
    intent: "place_order",
    response: "What can I get for you? We have coffee, tea, and pastries.",
    noAddItem: true,
  },
  {
    id: "place-order-start",
    pattern: /^(can i|could i|may i)\s+(place|latte)\s+(a|an)?\s*order/i,
    intent: "place_order",
    response: "What can I get for you? We have coffee, tea, and pastries.",
    noAddItem: true,
  },

  // ---- Generic "coffee" / "tea" — list options, never assume Americano ----
  {
    id: "generic-coffee",
    pattern: /(can i|could i|may i|i want|i'd like|i would like|get|have)\s+(a|an)?\s*coffee\b/i,
    intent: "menu_query",
    response: "We have Americano, Latte, Cappuccino, Cold Brew, Mocha, and Coffee Frappuccino. Which would you like?",
    noAddItem: true,
  },
  {
    id: "generic-tea",
    pattern: /(can i|could i|get|have)\s+(a|an)?\s*tea\b/i,
    intent: "menu_query",
    response: "We have Black Tea, Jasmine Tea, Lemon Green Tea, and Matcha Latte. Which would you like?",
    noAddItem: true,
  },

  // ---- Menu / category questions (never add item) ----
  {
    id: "menu-what-coffee",
    keywords: ["what", "kind of", "coffee"],
    intent: "menu_query",
    response: "We have Americano, Latte, Cappuccino, Cold Brew, Mocha, and Coffee Frappuccino. Which would you like?",
    noAddItem: true,
  },
  {
    id: "menu-what-tea",
    keywords: ["what", "kind of", "tea"],
    intent: "menu_query",
    response: "We have Black Tea, Jasmine Tea, Lemon Green Tea, and Matcha Latte. Which would you like?",
    noAddItem: true,
  },
  {
    id: "menu-what-pastries",
    keywords: ["what", "kind of", "pastr"],
    intent: "menu_query",
    response: "We have Plain Croissant, Chocolate Croissant, Chocolate Chip Cookie, and Banana Bread. Which would you like?",
    noAddItem: true,
  },
  {
    id: "menu-what-drinks",
    keywords: ["what", "kind of", "drink"],
    intent: "menu_query",
    response: "We have coffee (Americano, Latte, Cold Brew, Mocha, Frappuccino) and tea (Black, Jasmine, Lemon Green, Matcha). Which would you like?",
    noAddItem: true,
  },
  {
    id: "menu-generic-have",
    keywords: ["what", "have"],
    intent: "menu_query",
    response: "We have coffee, tea, and pastries. What would you like?",
    noAddItem: true,
  },

  // ---- Greetings ----
  {
    id: "greeting-hi",
    pattern: /^(hi|hello|hey|howdy)\s*\.?$/i,
    intent: "greeting",
    response: "Welcome to Tarro! What can I get for you?",
    noAddItem: true,
  },
  {
    id: "greeting-hello",
    keywords: ["hello", "there"],
    intent: "greeting",
    response: "Welcome to Tarro! What can I get for you?",
    noAddItem: true,
  },

  // ---- Refusals (business rules) ----
  {
    id: "refusal-medium",
    keywords: ["medium"],
    intent: "refusal",
    response: "We don't have medium. Small or Large?",
    noAddItem: true,
  },
  {
    id: "refusal-lukewarm",
    keywords: ["lukewarm"],
    intent: "refusal",
    response: "We only serve drinks hot or iced.",
    noAddItem: true,
  },
];

/**
 * Find the first rule that matches the (lowercased) message.
 * Use pattern if set, otherwise require all keywords to be present.
 */
export function matchRule(message: string): ChatRule | null {
  const lower = message.toLowerCase().trim();
  for (const rule of CHAT_RULES) {
    if (rule.pattern) {
      if (rule.pattern.test(lower)) return rule;
    } else if (rule.keywords?.length) {
      const allMatch = rule.keywords.every((k) => lower.includes(k));
      if (allMatch) return rule;
    }
  }
  return null;
}

// ---- Few-shot examples for LLM prompts (optional) ----
export const FEW_SHOT_EXAMPLES = [
  { user: "can I place an order", sarah: "What can I get for you? We have coffee, tea, and pastries.", addItem: false },
  { user: "what kind of coffee do you have", sarah: "We have Americano, Latte, Cappuccino, Cold Brew, Mocha, and Coffee Frappuccino. Which would you like?", addItem: false },
  { user: "I'll have a medium latte", sarah: "We don't have medium. Small or Large?", addItem: false },
  { user: "can I get a large iced oat milk latte", sarah: "Got it. Latte. Anything else?", addItem: true },
  { user: "that's it", sarah: "Perfect. Sending your order to the kitchen.", addItem: false },
] as const;
