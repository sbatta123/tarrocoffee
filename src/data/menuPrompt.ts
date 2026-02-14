import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// --- CONFIGURATION ---
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

// The Menu Source of Truth for the AI
const MENU_CONTEXT = `
You are Sarah, a barista at Tarro.
MENU & PRICING:
- COFFEE: Americano ($3/$4), Latte ($4/$5), Cold Brew (Iced Only, $4/$5), Mocha ($4.50/$5.50), Coffee Frappuccino (Iced Only, $5.50/$6.00).
- TEA: Black/Jasmine Tea ($3/$3.75), Lemon Green Tea ($3.50/$4.25), Matcha Latte ($4.50/$5.25).
- PASTRIES: Plain Croissant ($3.50), Chocolate Croissant ($4.00), Choc Chip Cookie ($2.50), Banana Bread Slice ($3.00).
- MODIFIERS: Oat Milk (+$0.50), Almond Milk (+$0.75), Extra Espresso (+$1.50), Syrup (+$0.50).
- SIZES: Small (12oz) or Large (16oz).

STRICT BUSINESS RULES:
1. NO Medium sizes. If asked, say "We only have small or large."
2. NO "Extra Hot" for Iced drinks. NO "Lukewarm" (Hot or Iced only).
3. NO Water cups or sides of ice.
4. NO "Sugar on the side".
5. Pastries are single items (no size). 
6. Frappuccinos and Cold Brew are ICED ONLY.
7. MAX 4 Espresso shots per drink.

YOUR GOAL:
- Parse the user's natural language to update the order cart.
- You must manage the state. If they say "make it large", update the last item to large.
- If a required modifier (Size, Temp, or Milk for lattes) is missing, ask for it in your text_response.
- Do NOT finalize the order until the user says "that's it", "no", or "done".
`;

// Define the structure we WANT the AI to return (Strict JSON)
const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    text_response: { type: SchemaType.STRING, description: "What Sarah says to the customer." },
    order_complete: { type: SchemaType.BOOLEAN, description: "True ONLY if customer explicitly finishes order." },
    cart: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          item_name: { type: SchemaType.STRING },
          quantity: { type: SchemaType.NUMBER },
          size: { type: SchemaType.STRING, nullable: true },
          temp: { type: SchemaType.STRING, nullable: true },
          milk: { type: SchemaType.STRING, nullable: true },
          modifiers: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          price: { type: SchemaType.NUMBER, description: "Calculated total price for this line item including modifiers" }
        },
        required: ["item_name", "quantity", "price"]
      }
    }
  },
  required: ["text_response", "order_complete", "cart"]
};

export async function POST(req: Request) {
  try {
    const { message, orderId: clientOrderId } = await req.json();

    // 1. GET CURRENT STATE FROM DB
    let currentCartJSON = [];
    let orderId = clientOrderId;
    let dbTotal = 0;

    if (orderId) {
      const { data } = await supabase.from("orders").select("*").eq("id", orderId).single();
      if (data && data.items) {
        // We store the cart as a JSON string in the 'items' column for simplicity in this demo
        try { currentCartJSON = JSON.parse(data.items); } catch (e) { currentCartJSON = []; }
      }
    }

    // 2. ASK GEMINI TO UPDATE THE STATE
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: MENU_CONTEXT }] },
        { role: "model", parts: [{ text: "Understood. I am ready to process orders and return JSON updates." }] }
      ]
    });

    // We pass the CURRENT CART + USER MESSAGE so the AI knows the context
    const prompt = `
    CURRENT CART: ${JSON.stringify(currentCartJSON)}
    USER SAYS: "${message}"
    
    Instructions:
    - specific prices are in the menu. Calculate the price field carefully.
    - If the user modifies an item (e.g. "make that large"), update the item in the cart.
    - If the user refuses a rule (e.g. "medium"), do NOT add it, explain in text_response.
    - Return the FULL updated cart JSON.
    `;

    const result = await chat.sendMessage(prompt);
    const responseText = result.response.text();
    const parsedResponse = JSON.parse(responseText);

    // 3. PROCESS RESULT
    const newCart = parsedResponse.cart || [];
    const aiText = parsedResponse.text_response;
    const isComplete = parsedResponse.order_complete;

    // Calculate Total
    const newTotal = newCart.reduce((sum: number, item: any) => sum + (item.price || 0), 0);

    // 4. UPDATE DB
    const cartString = JSON.stringify(newCart); // Store structured JSON in the items column
    
    // Create friendly string for the Kitchen Dashboard (e.g. "1x Large Latte (Hot)")
    const kitchenString = newCart.map((i: any) => {
        const details = [i.size, i.temp, i.milk, ...(i.modifiers || [])].filter(Boolean).join(", ");
        return `${i.quantity}x ${i.item_name} ${details ? `(${details})` : ""}`;
    }).join(", ");

    if (isComplete && orderId) {
       await supabase.from('orders').update({ items: kitchenString, total_price: newTotal, status: 'new' }).eq('id', orderId);
    } else {
       if (orderId) {
         await supabase.from('orders').update({ items: cartString, total_price: newTotal }).eq('id', orderId);
       } else {
         const { data } = await supabase.from('orders').insert([{ items: cartString, total_price: newTotal, status: 'pending' }]).select('id').single();
         if (data) orderId = data.id;
       }
    }

    // 5. VOICE GENERATION
    const voiceId = "EXAVITQu4vr4xnSDxMaL"; 
    const voiceResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "xi-api-key": process.env.ELEVENLABS_API_KEY || "" },
      body: JSON.stringify({ text: aiText, model_id: "eleven_monolingual_v1" }),
    });

    const audioBuffer = await voiceResponse.arrayBuffer();

    return NextResponse.json({
      text: aiText,
      audio: Buffer.from(audioBuffer).toString("base64"),
      orderId: isComplete ? null : orderId,
      orderComplete: isComplete,
      // Debug info to help you see what's happening
      cart: newCart 
    });

  } catch (error) {
    console.error("AI Error:", error);
    return NextResponse.json({ text: "Sorry, I had a brain freeze. Can you say that again?", audio: null });
  }
}