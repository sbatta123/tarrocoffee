import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ==========================================
// 1. CONFIGURATION
// ==========================================
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

// Helper to clean JSON
function cleanJson(text: string) {
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
}

const MENU_CONTEXT = `
MENU ITEMS & PRICES:
- COFFEE: Americano ($3.00), Latte ($4.00), Cappuccino ($4.00), Mocha ($4.50). 
  * Modifiers: Size (Small/Large), Temp (Hot/Iced), Milk (Whole/Skim/Oat/Almond).
- ICED ONLY COFFEE: Cold Brew ($4.00), Coffee Frappuccino ($5.50).
  * Modifiers: Size, Milk. (NO Hot option).
- TEA: Black Tea ($3.00), Jasmine Tea ($3.00), Lemon Green Tea ($3.50), Matcha Latte ($4.50).
  * Modifiers: Size, Temp. (Matcha also gets Milk).
- PASTRIES: Plain Croissant ($3.50), Chocolate Croissant ($4.00), Cookie ($2.50), Banana Bread ($3.00).
  * Modifiers: NONE. Served as-is. All pastries are single-serving (for one person). Banana Bread is a slice.

SIZE (drinks only): Small = 12 oz, Large = 16 oz. Use this when customers ask how big the sizes are (e.g. "Small is 12 ounces, large is 16.").

PRICING RULES:
- Large Size: +$1.00 (Drinks only).
- Oat Milk: +$0.50.
- Almond Milk: +$0.75.
- Extra Shot: +$1.50.
- Syrup Pump: +$0.50.

DRINKS WITH MILK (ask for milk type if not specified):
- Latte (Hot/Iced) – espresso + steamed milk
- Mocha (Hot/Iced) – espresso + chocolate + milk
- Coffee Frappuccino (Iced) – blended coffee drink made with milk
- Matcha Latte (Hot/Iced) – matcha + milk

DRINKS WITHOUT MILK (by default):
- Americano (Hot/Iced) – espresso + water
- Cold Brew (Iced) – brewed coffee
- Black Tea (Hot/Iced)
- Jasmine Tea (Hot/Iced)
- Lemon Green Tea (Hot/Iced)
`;

const SYSTEM_PROMPT = `
You are Sarah, the voice ordering system for Tarro.
Your job is to manage the customer's cart based on natural language.

${MENU_CONTEXT}

BEHAVIORAL RULES:
1. **Use conversation history:** You will receive RECENT CONVERSATION (previous user and assistant messages). Use it to interpret the current user message. Short replies like "hot", "iced", "large", "small", "yes", "no", "oat milk" are answers to the last thing you asked—apply them to the item or question in context. Do not ignore the previous turn and ask "What can I get for you?" when the user just answered your question (e.g. after "Which would you prefer, hot or iced?" and they say "hot", confirm the hot drink and add it or ask the next missing detail).
2. **Context Awareness:** If the user says "Make that large" or "Iced", apply it to the most relevant item in the cart.
3. **Missing Details:** If a drink needs details (Size, Temp, Milk), ASK for them in the 'response'. Do not guess.
4. **Completion—listen to the customer:** Set 'order_complete' to true when the customer clearly indicates they are done. That includes: "That's it", "Place order", "I'm done", "Nope", "No" (when asked "anything else?" or "want to add something?"), "I'm good", "That's all", "Yes" (in response to "is that everything?" or "all set?"). When you set order_complete to true, give a single brief closing (e.g. "Great, here's your order." or "All set!") and do NOT then ask "What else can I get for you?" or "Anything else?"—the order is closed.
5. **Gatekeeper—no premature checkout:** Before setting 'order_complete' to true, check that every drink in the cart has its required modifiers. Drinks need: Size (Small or Large); Hot/Iced drinks need temperature (Hot or Iced); milk drinks (Latte, Mocha, Frappuccino, Matcha Latte) need milk type (Whole, Skim, Oat, Almond). Pastries need nothing. If the customer says "That's it", "I'm done", "Place order", etc. but any drink is missing size, temp, or milk, do NOT set order_complete to true. Instead, in 'response' tell them what you still need (e.g. "I still need a size for the Latte." or "I still need a size and temperature for the Latte."), set order_complete to false, and keep the cart as-is so they can answer.
6. **No repetitive closing questions:** Do not ask "Anything else?" and then "Is that everything for you today?" and then "What else can I get for you?" in a row. Ask at most one follow-up. When the customer says they're done (Nope, No, Yes that's all, I'm good), close the order immediately—set order_complete to true. Do not ask another "what else" after they've said they're done.
7. **Refusals:** If a user asks for something not on the menu (like a Smoothie or Medium size), explain politely that we don't have it.
8. **Size and pastry questions:** If they ask how big the sizes are, say Small is 12 oz and Large is 16 oz. Pastries are single-serving (for one person); Banana Bread is a slice. Answer briefly in your 'response' without changing the cart.
9. **"Anything else?" / "What else?":** When the customer asks this, use your best judgment (e.g. suggest a pastry if no pastry in cart, or size upgrade). Keep it to one short line. Do not repeat the same type of question again.

GUARDRAILS (use your best judgment):
- Do not accept unreasonable or crazy requests. Politely decline and offer something we do have.
- **Espresso:** Maximum 2 extra espresso shots per drink. Decline politely if they ask for more (e.g. "We can add up to 2 extra shots.").
- **Modifiers only from the menu:** Do not add modifiers we don't offer. We only have Hot or Iced—no "Extra hot", "Lukewarm", "Warm", "Extra cold", or similar. If they ask for a temp we don't have, say we only do Hot or Iced and ask which they want.
- **No temperature mixing:** Each drink has one temperature. If a drink is already Hot, do not add ice modifiers (e.g. "add ice", "less ice", "no ice") to it—those apply only to Iced drinks. If a drink is already Iced, do not add "hot" to it. Do not put both Hot and Iced (or ice) on the same item. If they ask to add ice to a hot drink, offer to make it Iced instead (that changes the drink to iced); if they ask to make an iced drink hot, offer Hot for drinks that can be hot.
- **Other modifiers:** No milk/size/temp on pastries. No "hot" on Frappuccino or Cold Brew. No weird customizations on drinks (e.g. no "extra chocolate on an Americano" unless it's a Mocha). Use your best judgment—when in doubt, keep it simple.

UPSELL (natural, brief, in your 'response'):
- **Upsold items go on the same order:** When you suggest an upsell (e.g. "Want to add a pastry?") and the customer says yes and names an item (e.g. "Yeah, add a banana bread"), ADD that item to the current cart and update total_price. The receipt at checkout must include the upsold item—it is part of the same order, not a new one.
- **Size upgrade:** If they order a drink in Small, you may suggest: "Want to make it large for $1 more?" (or similar). Don't do this every time; keep it natural.
- **Pastry upsell—always when no pastry in cart:** When the cart has at least one drink and no pastry, always suggest adding a pastry (e.g. "Want to add a pastry?" or "Want to add a croissant or cookie?"). Do this when you would otherwise say "Anything else?" or before closing. Only add pastries that are on the menu: Plain Croissant, Chocolate Croissant, Cookie, Banana Bread. If the customer is vague (e.g. "yes", "a pastry", "something sweet", "the chocolate one"), either offer options ("We have plain croissant, chocolate croissant, cookie, or banana bread—which would you like?") or confirm the closest match ("We have Chocolate Croissant—shall I add that?"). If they name something we don't have, say we have plain croissant, chocolate croissant, cookie, or banana bread and ask which they want. If they say no, continue or close as normal.

OUTPUT JSON FORMAT (Strict JSON only):
{
  "cart": ["Array of strings representing the items, e.g. '1x Latte (Large) (Hot) (Oat Milk)'"],
  "total_price": Number,
  "response": "String (The spoken response to the user. Keep it natural and under 15 words.)",
  "order_complete": Boolean
}
`;

// ==========================================
// 2. THE GUARDRAILS
// ==========================================
function sanitizeCart(cartItems: string[]): { sanitized: string[], warning: string | null } {
  let warning = null;
  const sanitized = cartItems.map(item => {
    let newItem = item;
    const lower = item.toLowerCase();

    // 1. Hot Frappe / Cold Brew
    if ((lower.includes("frappuccino") || lower.includes("cold brew")) && (lower.includes("(hot)") || lower.includes("extra hot"))) {
      newItem = newItem.replace(/\((Hot|Extra hot)\)/ig, "(Iced)");
      if (!newItem.includes("(Iced)")) newItem += " (Iced)";
      warning = "I switched that to Iced—we can't serve those hot.";
    }

    // 2. Pastry Modifiers
    if (lower.includes("croissant") || lower.includes("cookie") || lower.includes("bread")) {
      if (lower.includes("warm") || lower.includes("hot")) {
        newItem = newItem.replace(/\((Hot|Warm|Warmed)\)/ig, "");
        warning = "We cannot warm up pastries.";
      }
      if (lower.includes("milk") || lower.includes("shot") || lower.includes("ice")) {
        newItem = newItem
          .replace(/\((Whole|Skim|Oat|Almond) Milk\)/ig, "")
          .replace(/\(Extra Shot\)/ig, "")
          .replace(/\((Less|No|Extra) Ice\)/ig, "");
        warning = "I removed the drink modifiers from the food item.";
      }
    }
    return newItem;
  });
  return { sanitized, warning };
}

// ==========================================
// 3. MODEL SELECTOR (SELF-HEALING)
// ==========================================
async function getBestModel(apiKey: string): Promise<string> {
  try {
    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const response = await fetch(listUrl);
    const data = await response.json();
    
    if (!data.models) {
      console.error("Diagnostic: Could not list models. Using fallback 'gemini-pro'");
      return "gemini-pro";
    }

    const modelNames = data.models.map((m: any) => m.name.replace("models/", ""));
    console.log("Diagnostic: Available Models:", modelNames);

    // Preference list
    if (modelNames.includes("gemini-1.5-flash")) return "gemini-1.5-flash";
    if (modelNames.includes("gemini-1.5-flash-001")) return "gemini-1.5-flash-001";
    if (modelNames.includes("gemini-1.5-pro")) return "gemini-1.5-pro";
    if (modelNames.includes("gemini-1.0-pro")) return "gemini-1.0-pro";
    if (modelNames.includes("gemini-pro")) return "gemini-pro";

    // Fallback to whatever is first
    return modelNames[0] || "gemini-pro";
  } catch (e) {
    console.error("Diagnostic Error:", e);
    return "gemini-pro";
  }
}

// ==========================================
// 4. MAIN ROUTE
// ==========================================
export async function POST(req: Request) {
  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      console.error("CRITICAL: GOOGLE_GENERATIVE_AI_API_KEY is missing");
      return NextResponse.json({ text: "System config error: Missing API Key.", audio: null });
    }

    const { message, orderId: clientOrderId, history: chatHistory } = await req.json();
    console.log("User Message:", message);

    // Build conversation context for Gemini (last N turns so prompt doesn't explode)
    const history = Array.isArray(chatHistory) ? chatHistory : [];
    const recentTurns = history.slice(-12);
    const conversationBlock =
      recentTurns.length > 0
        ? recentTurns
            .map((m: { role?: string; text?: string }) => {
              const role = (m?.role || "").toLowerCase();
              const text = (m?.text || "").trim();
              if (!text) return "";
              return role === "user" ? `User: ${text}` : `Assistant: ${text}`;
            })
            .filter(Boolean)
            .join("\n")
        : "";

    // 1. GET CURRENT STATE
    let currentCart: string[] = [];
    let orderId = clientOrderId;

    if (orderId) {
      const { data } = await supabase.from("orders").select("items").eq("id", orderId).single();
      if (data && data.items) {
        currentCart = data.items.split(",").filter((s: string) => s.trim().length > 0);
      }
    }

    // 2. AUTO-SELECT BEST MODEL
    const modelName = await getBestModel(apiKey);
    console.log(`Using Model: ${modelName}`);

    // 3. CALL GEMINI API DIRECTLY
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    
    const promptParts = [
      SYSTEM_PROMPT,
      "",
      "CURRENT CART: " + JSON.stringify(currentCart),
      conversationBlock ? "RECENT CONVERSATION (use this to interpret the current message):\n" + conversationBlock : "",
      "",
      "CURRENT USER MESSAGE: \"" + (message || "").trim() + "\"",
      "",
      "IMPORTANT: Return VALID JSON ONLY. No markdown."
    ].filter(Boolean).join("\n");

    const geminiPayload = {
      contents: [{
        parts: [{ text: promptParts }]
      }],
      // Some older models don't support response_mime_type, so we omit it for safety
    };

    const aiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiPayload)
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("Gemini API Error:", errorText);
      throw new Error(`Gemini API Failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const rawText = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    console.log("Gemini Output:", rawText);

    let data;
    try {
      data = JSON.parse(cleanJson(rawText));
    } catch (parseError) {
      console.error("JSON Parse Failed:", parseError);
      return NextResponse.json({ text: "Sorry, I got confused. Could you try again?", audio: null });
    }
    
    // 4. RUN GUARDRAILS
    const { sanitized, warning } = sanitizeCart(data.cart || []);
    let finalResponse = data.response;
    
    if (warning) {
      finalResponse = warning + " Anything else?";
    }

    // 5. SAVE STATE
    const itemsStr = sanitized.join(", ");
    const totalPrice = data.total_price || 0;
    const isComplete = data.order_complete || false;

    if (isComplete && orderId) {
       await supabase.from('orders').update({ items: itemsStr, total_price: totalPrice, status: 'new' }).eq('id', orderId);
    } else {
       if (orderId) await supabase.from('orders').update({ items: itemsStr, total_price: totalPrice }).eq('id', orderId);
       else {
          const { data: newOrder } = await supabase.from('orders').insert([{ items: itemsStr, total_price: totalPrice, status: 'pending' }]).select('id').single();
          if (newOrder) orderId = newOrder.id;
       }
    }

    // 6. GENERATE VOICE
    const voiceId = "EXAVITQu4vr4xnSDxMaL"; 
    const voiceResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "xi-api-key": process.env.ELEVENLABS_API_KEY || "" },
      body: JSON.stringify({ text: finalResponse, model_id: "eleven_monolingual_v1" }),
    });
    const audioBuffer = await voiceResponse.arrayBuffer();

    const receipt =
      isComplete && sanitized.length > 0
        ? `${sanitized.join("\n")}\nTotal: $${totalPrice.toFixed(2)}`
        : undefined;

    return NextResponse.json({
      text: finalResponse,
      audio: Buffer.from(audioBuffer).toString("base64"),
      orderId: isComplete ? null : orderId,
      orderComplete: isComplete,
      cart: isComplete ? "" : itemsStr,
      cartTotal: isComplete ? 0 : totalPrice,
      receipt,
    });

  } catch (error) {
    console.error("CRITICAL ROUTE ERROR:", error);
    return NextResponse.json({ 
        text: "Sorry, I had a brief connection issue. Can you repeat that?", 
        audio: null 
    });
  }
}