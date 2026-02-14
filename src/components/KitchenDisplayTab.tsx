"use client";

import { useCallback, useEffect, useState } from "react";
import OrderTicketList, { type OrderTicket } from "@/app/dashboard/OrderTicketList";

const POLL_INTERVAL_MS = 1_500;

export default function KitchenDisplayTab() {
  const [orders, setOrders] = useState<OrderTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setFetchError(null);
      const res = await fetch(`/api/orders?t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        const msg = (data?.error ?? data?.hint ?? `Failed to load (${res.status})`) as string;
        setFetchError(msg);
        setOrders([]);
        return;
      }
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : "Network error");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Poll every 2s so new orders and status changes show up quickly
  useEffect(() => {
    const t = setInterval(fetchOrders, POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [fetchOrders]);

  // Refetch when user comes back to this tab/window so new orders appear right away
  useEffect(() => {
    const onFocus = () => fetchOrders();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchOrders]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-[#8b6a51]">
        Loading kitchen queue…
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <p className="text-[#5f473b] text-sm">
          Mark tickets In Progress, then Completed when done.
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchOrders()}
            className="bg-white px-3 py-1.5 rounded-lg border border-[#e8e2d8] text-xs text-[#5f473b] hover:bg-[#f6f4f0] transition"
          >
            Refresh
          </button>
          <span className="bg-white px-3 py-1.5 rounded-lg border border-[#e8e2d8] text-xs text-[#5f473b]">
            <span className="text-green-600 font-semibold">Online</span>
          </span>
        </div>
      </div>
      {fetchError && (
        <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm">
          <p className="font-medium">Could not load orders</p>
          <p className="mt-1">{fetchError}</p>
          <p className="mt-2 text-xs">In Supabase: Table Editor → orders → enable “Read” for anon or add an RLS policy allowing SELECT.</p>
        </div>
      )}
      {orders.length > 0 ? (
        <OrderTicketList orders={orders} onStatusChange={fetchOrders} />
      ) : !fetchError ? (
        <div className="text-center py-16 text-[#8b6a51] bg-white rounded-2xl border border-dashed border-[#e8e2d8]">
          <p className="text-lg font-medium">No orders yet.</p>
          <p className="text-sm mt-1">Talk to Sarah to place the first one!</p>
        </div>
      ) : null}
    </div>
  );
}
