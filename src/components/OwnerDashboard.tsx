"use client";

import { useCallback, useEffect, useState } from "react";
import { Coffee, DollarSign, TrendingUp, Package } from "lucide-react";

interface OwnerStats {
  ordersToday: number;
  revenueToday: number;
  avgOrderValue: number;
  topItems: { name: string; count: number }[];
  statusCounts: { new: number; in_progress: number; completed: number };
}

const POLL_INTERVAL_MS = 10_000;

export default function OwnerDashboard() {
  const [stats, setStats] = useState<OwnerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/owner/stats?t=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setStats(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Poll so dashboard updates with new orders
  useEffect(() => {
    const t = setInterval(fetchStats, POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-[#8b6a51]">
        Loading today&apos;s pulse…
      </div>
    );
  }
  if (error || !stats) {
    return (
      <div className="rounded-2xl border border-[#e8e2d8] bg-white p-8 text-center text-[#735544]">
        {error ?? "Could not load dashboard."}
      </div>
    );
  }

  const { ordersToday, revenueToday, avgOrderValue, topItems, statusCounts } = stats;

  return (
    <div className="space-y-6">
      <p className="text-sm text-[#8b6a51]">
        Quick pulse for today. Updates every 10 seconds.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[#e8e2d8] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#f6f4f0] p-2.5">
              <Coffee className="w-5 h-5 text-[#735544]" />
            </div>
            <div>
              <p className="text-2xl font-display font-semibold text-[#2a1f1a]">{ordersToday}</p>
              <p className="text-xs text-[#8b6a51] uppercase tracking-wider">Orders today</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#e8e2d8] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#f6f4f0] p-2.5">
              <DollarSign className="w-5 h-5 text-[#735544]" />
            </div>
            <div>
              <p className="text-2xl font-display font-semibold text-[#2a1f1a]">
                ${revenueToday.toFixed(2)}
              </p>
              <p className="text-xs text-[#8b6a51] uppercase tracking-wider">Revenue today</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#e8e2d8] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#f6f4f0] p-2.5">
              <TrendingUp className="w-5 h-5 text-[#735544]" />
            </div>
            <div>
              <p className="text-2xl font-display font-semibold text-[#2a1f1a]">
                ${avgOrderValue.toFixed(2)}
              </p>
              <p className="text-xs text-[#8b6a51] uppercase tracking-wider">Avg order value</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#e8e2d8] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#f6f4f0] p-2.5">
              <Package className="w-5 h-5 text-[#735544]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#2a1f1a]">
                {statusCounts.new} new · {statusCounts.in_progress} in progress · {statusCounts.completed} done
              </p>
              <p className="text-xs text-[#8b6a51] uppercase tracking-wider">Queue</p>
            </div>
          </div>
        </div>
      </div>

      {topItems.length > 0 && (
        <div className="rounded-2xl border border-[#e8e2d8] bg-white p-6 shadow-sm">
          <h3 className="font-display text-lg text-[#4f3c33] border-b border-[#d4c9b8] pb-2 mb-4">
            Top items today
          </h3>
          <ul className="space-y-2">
            {topItems.map(({ name, count }) => (
              <li
                key={name}
                className="flex justify-between items-center py-1.5 border-b border-[#e8e2d8]/80 last:border-0"
              >
                <span className="font-medium text-[#2a1f1a]">{name}</span>
                <span className="text-[#5f473b] tabular-nums">{count} sold</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {ordersToday === 0 && (
        <div className="rounded-2xl border border-dashed border-[#e8e2d8] bg-[#faf8f5] p-8 text-center text-[#8b6a51]">
          No orders submitted yet today. Check back after some voice orders come in.
        </div>
      )}
    </div>
  );
}
