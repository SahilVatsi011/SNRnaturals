"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "snr_admin_seen_order_ids";

interface RecentOrder {
  id: string;
  order_no: number | null;
  customer_name: string;
  total: number;
  created_at: string;
  order_status: string;
  payment_status: string;
}

function formatOrderNo(n: number | null) {
  return n == null ? "#---" : `#SNR${String(n).padStart(5, "0")}`;
}

function currency(n: number) {
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export default function NewOrdersAlert() {
  const [knownIds, setKnownIds] = useState<string[]>(() => {
    try {
      if (typeof window !== "undefined") {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const ids = JSON.parse(stored) as string[];
          if (Array.isArray(ids)) return ids;
        }
      }
    } catch {
      /* ignore */
    }
    return [];
  });

  const [alerts, setAlerts] = useState<RecentOrder[]>([]);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);

  const playChime = useCallback(() => {
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!audioRef.current) audioRef.current = new Ctx();
      const ctx = audioRef.current;
      if (ctx.state === "suspended") void ctx.resume();
      const notes = [880, 1174.66];
      const now = ctx.currentTime;
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.value = freq;
        const start = now + i * 0.18;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.4, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.4);
        osc.start(start);
        osc.stop(start + 0.5);
      });
    } catch {
      /* audio blocked until user interacts */
    }
  }, []);

  const checkNew = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/orders/recent", {
        cache: "no-store",
      });
      if (!res.ok) return;
      const orders: RecentOrder[] = await res.json();
      if (!Array.isArray(orders)) return;

      const known = new Set(knownIds);
      const fresh = orders.filter((o) => !known.has(o.id));
      if (fresh.length === 0) return;

      const updated = [...knownIds, ...fresh.map((o) => o.id)];
      setKnownIds(updated);
      setAlerts(fresh);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        /* ignore */
      }

      playChime();

      if (
        notifEnabled &&
        typeof Notification !== "undefined" &&
        Notification.permission === "granted"
      ) {
        fresh.forEach((o) => {
          new Notification(`New order ${formatOrderNo(o.order_no)}`, {
            body: `${o.customer_name} — ${currency(Number(o.total))}`,
          });
        });
      }
    } catch {
      /* ignore */
    }
  }, [knownIds, notifEnabled, playChime]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (cancelled) return;
      await checkNew();
    };
    const timer = window.setTimeout(() => void run(), 0);
    const id = window.setInterval(() => void run(), 30000);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.clearInterval(id);
    };
  }, [checkNew]);

  const enableNotifications = async () => {
    try {
      if (
        typeof Notification !== "undefined" &&
        "permission" in Notification
      ) {
        const perm = await Notification.requestPermission();
        setNotifEnabled(perm === "granted");
      }
    } catch {
      setNotifEnabled(false);
    }
    playChime();
  };

  if (alerts.length === 0) return null;

  return (
    <div className="mb-6 rounded-lg border border-brand-200 bg-brand-50 p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-lg text-white">
            🔔
          </span>
          <h2 className="text-base font-bold text-brand-800">
            {alerts.length} new{" "}
            {alerts.length === 1 ? "order" : "orders"}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={enableNotifications}
            className="rounded-md border border-brand-300 bg-white px-2.5 py-1 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-100"
          >
            {notifEnabled
              ? "Notifications on"
              : "Turn on notifications"}
          </button>
          <button
            type="button"
            onClick={() => setAlerts([])}
            className="rounded-md border border-stone-300 bg-white px-2.5 py-1 text-xs font-medium text-stone-600 transition-colors hover:bg-stone-100"
          >
            Dismiss
          </button>
        </div>
      </div>

      <ul className="space-y-2">
        {alerts.map((o) => (
          <li
            key={o.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-stone-200 bg-white px-3 py-2"
          >
            <div>
              <Link
                href={`/admin/orders/${o.id}`}
                className="font-semibold text-brand-700 hover:underline"
              >
                {formatOrderNo(o.order_no)}
              </Link>
              <span className="ml-2 text-sm text-stone-600">
                {o.customer_name} · {currency(Number(o.total))}
              </span>
            </div>
            <span className="text-xs text-stone-400">
              {new Date(o.created_at).toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}