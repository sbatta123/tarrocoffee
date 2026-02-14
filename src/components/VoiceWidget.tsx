"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { Mic, MicOff, Send, MessageCircle, List, ShoppingBag } from "lucide-react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  /** When set, render as a formatted receipt ticket instead of text */
  receipt?: { lines: string[]; total: string };
}

const WELCOME_TEXT = "Welcome to Tarro! I'm Sarah. What can I get started for you today?";

/** Parse cart string into display lines (e.g. "1x Mocha (Small) (Hot), 2x Cookie" -> ["1x Mocha (Small) (Hot)", "2x Cookie"]) */
function parseCartLines(cart: string): string[] {
  if (!cart || !cart.trim()) return [];
  return cart.split(",").map((s) => s.trim()).filter(Boolean);
}

/** Parse API receipt string into lines + total (e.g. "1x Latte\nTotal: $4.50" -> { lines: ["1x Latte"], total: "Total: $4.50" }) */
function parseReceipt(receipt: string): { lines: string[]; total: string } {
  const all = receipt.split("\n").map((s) => s.trim()).filter(Boolean);
  const totalLine = all.length > 0 && /^Total:\s*\$/i.test(all[all.length - 1]) ? all.pop()! : "";
  return { lines: all, total: totalLine };
}

function ReceiptTicket({ lines, total }: { lines: string[]; total: string }) {
  return (
    <div className="max-w-[85%] rounded-2xl border-2 border-[#735544] bg-white shadow-lg overflow-hidden">
      <div className="bg-[#2a1f1a] text-white px-4 py-2 text-center">
        <p className="font-display text-sm font-semibold tracking-wide">TARRO</p>
        <p className="text-xs text-white/80">Order ticket · Pay in-store</p>
      </div>
      <div className="px-4 py-3 space-y-1.5 min-w-[200px]">
        {lines.map((line, i) => (
          <p key={i} className="text-sm text-[#2a1f1a] border-b border-[#e8e2d8]/80 last:border-0 pb-1.5 last:pb-0">
            {line}
          </p>
        ))}
        <p className="text-sm font-semibold text-[#2a1f1a] pt-2 mt-1 border-t-2 border-[#e8e2d8]">
          {total}
        </p>
      </div>
    </div>
  );
}

export default function VoiceWidget({ onOpenMenu }: { onOpenMenu?: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTextInputVisible, setIsTextInputVisible] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [welcomePlayed, setWelcomePlayed] = useState(false);
  // Cart state: single source of truth from API. Always sync from POST response.
  // Start fresh every time the widget mounts (no restoring old order from sessionStorage).
  const [cart, setCart] = useState("");
  const [cartTotal, setCartTotal] = useState(0);
  const [orderId, setOrderId] = useState<string | null>(null);
  const orderIdRef = useRef<string | null>(null);
  useEffect(() => {
    orderIdRef.current = orderId;
  }, [orderId]);

  // On mount: clear any previous session so each "chat start" has an empty cart
  useEffect(() => {
    try {
      if (typeof window !== "undefined") sessionStorage.removeItem("tarro_order_id");
    } catch {
      /* ignore */
    }
    setCart("");
    setCartTotal(0);
    setOrderId(null);
    orderIdRef.current = null;
  }, []);
  const setOrderIdAndPersist = useCallback((value: string | null) => {
    setOrderId(value);
    orderIdRef.current = value;
    try {
      if (value) sessionStorage.setItem("tarro_order_id", value);
      else sessionStorage.removeItem("tarro_order_id");
    } catch {
      /* ignore */
    }
  }, []);
  const applyCartFromApi = useCallback((data: { cart?: string; cartTotal?: number; orderId?: string | null; orderComplete?: boolean }) => {
    if (data.cart !== undefined) setCart(data.cart);
    if (typeof data.cartTotal === "number") setCartTotal(data.cartTotal);
    if (data.orderId !== undefined) setOrderIdAndPersist(data.orderId ?? null);
    if (data.orderComplete) {
      setCart("");
      setCartTotal(0);
      setOrderIdAndPersist(null);
    }
  }, [setOrderIdAndPersist]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSentTranscriptRef = useRef<{ text: string; at: number }>({ text: "", at: 0 });
  const isTextInputVisibleRef = useRef(isTextInputVisible);
  isTextInputVisibleRef.current = isTextInputVisible;
  const audioUnlockedRef = useRef(false);
  const [pendingPlay, setPendingPlay] = useState<{ base64: string; onEnded?: () => void } | null>(null);

  /** Call on first user gesture (mic click or send) so later playback is allowed by browser autoplay policy */
  const unlockAudio = useCallback(() => {
    if (audioUnlockedRef.current || typeof window === "undefined") return;
    audioUnlockedRef.current = true;
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctx) {
        const ctx = new Ctx();
        if (ctx.state === "suspended") ctx.resume();
      }
    } catch {
      /* ignore */
    }
  }, []);

  const scrollChatToBottom = useCallback(() => {
    const el = chatScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    if (messages.length === 0) return;
    scrollChatToBottom();
  }, [messages, scrollChatToBottom]);

  const startListeningIfVoiceMode = useCallback(() => {
    if (isTextInputVisibleRef.current || !recognitionRef.current || !speechSupported) return;
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      setIsListening(false);
    }
  }, [speechSupported]);

  const playAudio = useCallback((base64: string, onEnded?: () => void) => {
    const done = () => {
      // Short delay before restarting mic so the browser’s speech recognition is ready again
      setPendingPlay(null);
      if (onEnded) setTimeout(onEnded, 350);
    };
    try {
      const audio = new Audio(`data:audio/mpeg;base64,${base64}`);
      audioRef.current = audio;
      audio.addEventListener("ended", done, { once: true });
      audio.addEventListener("error", done, { once: true });
      audio.play().catch((e: unknown) => {
        const err = e as { name?: string; message?: string };
        if (err?.name === "NotAllowedError" || String(err?.message ?? "").toLowerCase().includes("user gesture")) {
          setPendingPlay({ base64, onEnded });
        } else {
          console.warn("Audio play failed:", e);
          done();
        }
      });
    } catch (e) {
      console.warn("Audio init failed:", e);
      done();
    }
  }, []);

  const playPendingAudio = useCallback(() => {
    if (!pendingPlay) return;
    const { base64, onEnded } = pendingPlay;
    setPendingPlay(null);
    try {
      const audio = new Audio(`data:audio/mpeg;base64,${base64}`);
      audioRef.current = audio;
      audio.addEventListener("ended", () => { if (onEnded) setTimeout(onEnded, 350); }, { once: true });
      audio.addEventListener("error", () => { if (onEnded) setTimeout(onEnded, 350); }, { once: true });
      audio.play().catch(() => { if (onEnded) setTimeout(onEnded, 350); });
    } catch {
      if (onEnded) setTimeout(onEnded, 350);
    }
  }, [pendingPlay]);

  // GET returns empty cart; we rely on clear-on-mount for a fresh session, so no need to overwrite cart from GET
  useEffect(() => {
    fetch("/api/chat", { method: "GET" })
      .then((res) => res.json())
      .then((data: { cart?: string; cartTotal?: number }) => {
        // Only apply if we didn't already clear (cart stays empty for new session)
        if (data.cart !== undefined && data.cart !== "") setCart(data.cart);
        if (typeof data.cartTotal === "number" && data.cartTotal !== 0) setCartTotal(data.cartTotal);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (welcomePlayed) return;
    setWelcomePlayed(true);
    const welcomeMessage: ChatMessage = {
      id: `assistant-welcome-${Date.now()}`,
      role: "assistant",
      text: WELCOME_TEXT,
    };
    setMessages((prev) => [welcomeMessage]);
    fetch("/api/chat")
      .then((res) => res.json())
      .then((data: { text?: string; audioBase64?: string | null }) => {
        if (data.audioBase64) {
          playAudio(data.audioBase64, startListeningIfVoiceMode);
        } else {
          startListeningIfVoiceMode();
        }
      })
      .catch(() => {});
  }, [welcomePlayed, playAudio, startListeningIfVoiceMode]);

  useEffect(() => {
    const SpeechRecognitionAPI =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition);
    setSpeechSupported(!!SpeechRecognitionAPI);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        text: trimmed,
      };
      setMessages((prev) => [...prev, userMessage]);
      setInputText("");
      setIsLoading(true);

      const history = messages.map((m) => ({ role: m.role, text: m.text }));

      try {
        // Use ref first (updated synchronously when we receive orderId from server), then state, so we always send orderId on follow-up messages (e.g. "small", "hot")
        const orderIdToSend = orderIdRef.current ?? orderId ?? (typeof window !== "undefined" ? sessionStorage.getItem("tarro_order_id") : null) ?? null;
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            history,
            orderId: orderIdToSend != null ? String(orderIdToSend) : undefined,
          }),
        });
        let data: { text?: string; audio?: string | null; audioBase64?: string | null; error?: string; details?: string; cart?: string; cartTotal?: number; orderId?: string; orderComplete?: boolean; receipt?: string };
        try {
          data = await res.json();
        } catch {
          throw new Error(res.ok ? "Invalid response from server" : `Request failed (${res.status})`);
        }

        if (!res.ok) {
          const detail =
            (data.details && String(data.details).trim()) ||
            (data.error && String(data.error).trim()) ||
            `Request failed (${res.status})`;
          throw new Error(detail);
        }

        applyCartFromApi({
          cart: data.cart,
          cartTotal: data.cartTotal,
          orderId: data.orderId,
          orderComplete: data.orderComplete,
        });

        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: data.text ?? "Sorry, I didn't get that.",
        };
        setMessages((prev) => [...prev, assistantMessage]);

        if (data.orderComplete && data.receipt) {
          const { lines, total } = parseReceipt(data.receipt);
          setMessages((prev) => [
            ...prev,
            { id: `receipt-${Date.now()}`, role: "assistant", text: "", receipt: { lines, total } },
          ]);
        }

        const audioData = data.audioBase64 ?? data.audio ?? null;
        if (audioData) {
          playAudio(audioData, startListeningIfVoiceMode);
        } else {
          setTimeout(startListeningIfVoiceMode, 400);
        }
      } catch (err) {
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          role: "assistant",
          text: err instanceof Error ? err.message : "Something went wrong. Try again.",
        };
        setMessages((prev) => [...prev, errorMessage]);
        setTimeout(startListeningIfVoiceMode, 400);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, orderId, playAudio, startListeningIfVoiceMode, applyCartFromApi]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognitionAPI =
      window.SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI() as SpeechRecognition;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join(" ")
        .trim();
      if (!transcript) return;
      const now = Date.now();
      if (lastSentTranscriptRef.current.text === transcript && now - lastSentTranscriptRef.current.at < 2000) return;
      lastSentTranscriptRef.current = { text: transcript, at: now };
      sendMessage(transcript);
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    return () => {
      try {
        recognition.abort();
      } catch (_) {}
      recognitionRef.current = null;
    };
  }, [sendMessage]);

  const toggleListening = useCallback(() => {
    unlockAudio();
    if (!recognitionRef.current || isLoading) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        setIsListening(false);
      }
    }
  }, [isListening, isLoading, unlockAudio]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      unlockAudio();
      sendMessage(inputText);
    },
    [inputText, sendMessage, unlockAudio]
  );

  const openMenu = useCallback(() => {
    if (onOpenMenu) onOpenMenu();
    else document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" });
  }, [onOpenMenu]);

  const cartLines = parseCartLines(cart);

  return (
    <div className="rounded-3xl border-2 border-[#e8e2d8] bg-white shadow-xl overflow-hidden max-w-4xl w-full flex flex-col md:flex-row">
      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#e8e2d8] bg-gradient-to-r from-[#faf8f5] to-[#f6f4f0]">
        <span className="font-semibold text-[#2a1f1a]">Voice order</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={openMenu}
            className="flex items-center gap-1.5 text-sm text-[#735544] hover:text-[#5f473b] font-medium"
          >
            <List className="w-4 h-4" />
            Menu
          </button>
          <button
            type="button"
            onClick={() => setIsTextInputVisible((v) => !v)}
            className="flex items-center gap-1.5 text-sm text-[#735544] hover:text-[#5f473b] font-medium"
          >
            <MessageCircle className="w-4 h-4" />
            {isTextInputVisible ? "Switch to voice" : "Switch to text"}
          </button>
        </div>
      </div>

      <div
        ref={chatScrollRef}
        className="h-[340px] md:h-[380px] overflow-y-auto overflow-x-hidden p-4 space-y-3 bg-[#fdf8f3] scroll-smooth"
      >
        {messages.length === 0 && (
          <p className="text-sm text-[#8b6a51]">
            Tap the mic and say what you’d like.
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {m.receipt ? (
              <ReceiptTicket lines={m.receipt.lines} total={m.receipt.total} />
            ) : (
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  m.role === "user"
                    ? "bg-[#735544] text-white"
                    : "bg-white border border-[#e8e2d8] text-[#2a1f1a] shadow-sm"
                }`}
              >
                {m.text}
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-2xl px-4 py-2.5 text-sm bg-white border border-[#e8e2d8] text-[#8b6a51]">
              …
            </div>
          </div>
        )}
        {pendingPlay && (
          <div className="flex justify-start pt-1">
            <button
              type="button"
              onClick={playPendingAudio}
              className="rounded-xl px-4 py-2 text-sm font-medium bg-[#735544] text-white hover:bg-[#5f473b] transition"
            >
              Tap to hear response
            </button>
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 p-4 border-t border-[#e8e2d8] bg-white"
      >
        {!isTextInputVisible && speechSupported ? (
          <button
            type="button"
            onClick={toggleListening}
            disabled={isLoading}
            className={`flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full transition ${
              isListening
                ? "bg-red-500 text-white"
                : "bg-[#735544] text-white hover:bg-[#5f473b] disabled:opacity-50"
            }`}
            aria-label={isListening ? "Stop listening" : "Start voice input"}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
        ) : null}
        {isTextInputVisible && (
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your order…"
            disabled={isLoading}
            className="flex-1 min-w-0 rounded-xl border border-[#e8e2d8] bg-[#faf8f5] px-4 py-3 text-[#2a1f1a] placeholder-[#8b6a51] focus:outline-none focus:ring-2 focus:ring-[#735544] focus:border-transparent disabled:opacity-60"
          />
        )}
        {!isTextInputVisible && <div className="flex-1 min-w-0" />}
        <button
          type="submit"
          disabled={!isTextInputVisible || !inputText.trim() || isLoading}
          className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-[#735544] text-white hover:bg-[#5f473b] disabled:opacity-50 transition"
          aria-label="Send"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
      </div>

      {/* Cart — real-time from API (validates only what's actually in the cart) */}
      <div className="w-full md:w-72 border-t md:border-t-0 md:border-l border-[#e8e2d8] bg-[#faf8f5] flex flex-col shrink-0">
        <div className="px-4 py-3 border-b border-[#e8e2d8] flex items-center gap-2 font-semibold text-[#2a1f1a]">
          <ShoppingBag className="w-4 h-4 text-[#8b6a51]" aria-hidden />
          Your order
        </div>
        <div className="flex-1 overflow-y-auto p-4 min-h-[120px]">
          {cartLines.length === 0 ? (
            <p className="text-sm text-[#8b6a51]">Cart is empty. Say or type what you’d like.</p>
          ) : (
            <ul className="space-y-2 text-sm text-[#2a1f1a]">
              {cartLines.map((line, i) => (
                <li key={`${i}-${line}`} className="py-1 border-b border-[#e8e2d8]/80 last:border-0">
                  {line}
                </li>
              ))}
            </ul>
          )}
        </div>
        {cartLines.length > 0 && (
          <div className="px-4 py-3 border-t border-[#e8e2d8] text-right">
            <span className="text-lg font-bold text-[#5f473b]">${cartTotal.toFixed(2)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
