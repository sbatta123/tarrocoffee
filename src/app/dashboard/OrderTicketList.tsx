"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export type OrderStatus = "pending" | "new" | "in_progress" | "completed";

export interface OrderTicket {
  id: string;
  items: string;
  total_price: number;
  status: string;
  created_at: string;
}

const STATUS_ORDER: OrderStatus[] = ["new", "pending", "in_progress", "completed"];

function statusSortKey(status: string): number {
  const i = STATUS_ORDER.indexOf(status as OrderStatus);
  return i >= 0 ? i : 999;
}

function TicketCard({
  order,
  onStatusChange,
}: {
  order: OrderTicket;
  onStatusChange: () => void | Promise<void>;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Optimistic status so the UI updates immediately on click; reverts if PATCH fails
  const [optimisticStatus, setOptimisticStatus] = useState<string | null>(null);
  const displayStatus = optimisticStatus ?? order.status;
  const isCompleted = displayStatus === "completed";

  // Reset optimistic state when order data is refetched (e.g. after successful save)
  useEffect(() => {
    setOptimisticStatus(null);
  }, [order.status]);

  const updateStatus = async (status: "in_progress" | "completed") => {
    setError(null);
    setOptimisticStatus(status);
    setLoading(status);
    try {
      const id = order.id;
      const url = `/api/orders/${encodeURIComponent(String(id))}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15_000);
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string; hint?: string };
        const msg = err?.error || err?.hint || `Update failed (${res.status})`;
        setError(msg);
        setOptimisticStatus(null);
        return;
      }
      const result = onStatusChange();
      if (result instanceof Promise) await result;
      setOptimisticStatus(null);
    } catch (e) {
      if ((e as Error).name === "AbortError") {
        setError("Request timed out. Check Supabase RLS allows UPDATE on orders.");
      } else {
        setError(e instanceof Error ? e.message : "Request failed");
      }
      setOptimisticStatus(null);
    } finally {
      setLoading(null);
    }
  };

  // Only three labels: New, In Progress, Completed (treat pending same as new)
  const statusLabel =
    displayStatus === "in_progress"
      ? "In Progress"
      : displayStatus === "completed"
        ? "Completed"
        : "New";

  // New = red, In progress = yellow, Completed = grayed out
  const colorClasses: Record<string, string> = {
    new: "border-red-400 bg-red-50/90",
    pending: "border-red-400 bg-red-50/90",
    in_progress: "border-yellow-400 bg-yellow-50/90",
    completed: "border-gray-300 bg-gray-100 opacity-70",
  };
  const statusBg: Record<string, string> = {
    new: "bg-red-100 text-red-800",
    pending: "bg-red-100 text-red-800",
    in_progress: "bg-yellow-100 text-yellow-800",
    completed: "bg-green-100 text-green-800",
  };
  const orderColor = colorClasses[displayStatus] ?? colorClasses.completed;
  const orderStatusBg = statusBg[displayStatus] ?? statusBg.completed;

  return (
    <div
      className={`border-2 p-6 rounded-xl shadow-sm flex justify-between items-start gap-6 transition-all ${orderColor} ${isCompleted ? "order-last" : ""}`}
    >
      <div className="min-w-0 flex-1">
        <p className="font-bold text-xl text-gray-800">Order #{String(order.id).slice(0, 8)}</p>
        <p className={`mt-2 text-lg whitespace-pre-wrap font-medium ${isCompleted ? "text-gray-500" : "text-gray-800"}`}>
          {order.items.split(",").map((s) => s.trim()).filter(Boolean).join("\n")}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          {new Date(order.created_at).toLocaleString()}
        </p>
      </div>
      <div className="text-right flex flex-col items-end gap-2 shrink-0">
        <span className={`block text-2xl font-bold ${isCompleted ? "text-gray-500" : "text-gray-800"}`}>
          ${Number(order.total_price).toFixed(2)}
        </span>
        <span
          className={`inline-block px-3 py-1 rounded-full text-sm font-medium uppercase tracking-wide ${orderStatusBg}`}
        >
          {statusLabel}
        </span>
        {error && (
          <p className="text-red-600 text-sm mt-2 max-w-xs">
            {error}
            <span className="block mt-1 text-xs">Supabase: allow UPDATE on the orders table (RLS policy or disable RLS for demo).</span>
          </p>
        )}
        {!isCompleted && (
          <div className="flex flex-col sm:flex-row gap-2 mt-2 relative z-10">
            {(displayStatus === "new" || displayStatus === "pending") && (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateStatus("in_progress"); }}
                disabled={!!loading}
                className="px-4 py-2 rounded-lg bg-yellow-500 text-yellow-900 font-medium hover:bg-yellow-600 disabled:opacity-50 transition-colors cursor-pointer touch-manipulation"
              >
                {loading === "in_progress" ? "…" : "In Progress"}
              </button>
            )}
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateStatus("completed"); }}
              disabled={!!loading}
              className="px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50 transition-colors cursor-pointer touch-manipulation"
            >
              {loading === "completed" ? "…" : "Completed"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrderTicketList({
  orders,
  onStatusChange,
}: {
  orders: OrderTicket[];
  onStatusChange?: () => void | Promise<void>;
}) {
  const router = useRouter();
  const handleStatusChange = onStatusChange ?? (() => router.refresh());

  // New first, then In progress, then Completed at bottom (grayed out). Within same status, newest first.
  const sorted = [...orders].sort((a, b) => {
    const statusA = statusSortKey(a.status);
    const statusB = statusSortKey(b.status);
    if (statusA !== statusB) return statusA - statusB;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="grid gap-4">
      {sorted.map((order) => (
        <TicketCard
          key={order.id}
          order={order}
          onStatusChange={handleStatusChange}
        />
      ))}
    </div>
  );
}
