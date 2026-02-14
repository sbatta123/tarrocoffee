"use client";

import { useCallback, useEffect, useState } from "react";
import OrderTicketList, { type OrderTicket } from "@/app/dashboard/OrderTicketList";

const POLL_INTERVAL_MS = 5_000;

export default function KitchenDisplayTab() {
  const [orders, setOrders] = useState<OrderTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders?t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Poll so new orders and status changes show up
  useEffect(() => {
    const t = setInterval(fetchOrders, POLL_INTERVAL_MS);
    return () => clearInterval(t);
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
      <div className="flex justify-between items-center mb-4">
        <p className="text-[#5f473b] text-sm">
          Mark tickets In Progress, then Completed when done.
        </p>
        <span className="bg-white px-3 py-1.5 rounded-lg border border-[#e8e2d8] text-xs text-[#5f473b]">
          <span className="text-green-600 font-semibold">Online</span>
        </span>
      </div>
      {orders.length > 0 ? (
        <OrderTicketList orders={orders} onStatusChange={fetchOrders} />
      ) : (
        <div className="text-center py-16 text-[#8b6a51] bg-white rounded-2xl border border-dashed border-[#e8e2d8]">
          <p className="text-lg font-medium">No orders yet.</p>
          <p className="text-sm mt-1">Talk to Sarah to place the first one!</p>
        </div>
      )}
    </div>
  );
}
