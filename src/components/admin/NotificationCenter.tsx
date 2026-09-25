"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "snr_panel_seen_notifs";

interface OrderNotif {
  itemType: "order";
  id: string;
  order_no: number | null;
  customer_name: string;
  total: number;
  created_at: string;
}

interface StockNotif {
  itemType: "stock";
  id: string;
  name: string;
  stock_qty: number;
}

type NotifItem = OrderNotif | StockNotif;

type Seen = Record<string, number | true>;

function keyOf(item: NotifItem) {
  return item.itemType === "order" ? `order:${item.id}` : `stock:${item.id}`;
}

function isUnread(item: NotifItem, seen: Seen): boolean {
  const k = keyOf(item);
  if (item.itemType === "stock") {
    const v = seen[k];
    if (v === undefined) return true;
    return item.stock_qty < (typeof v === "number" ? v : Number.MAX_SAFE_INTEGER);
  }
  return !(k in seen);
}

function markItem(item: NotifItem, seen: Seen): Seen {
  const k = keyOf(item);
  return {
    ...seen,
    [k]: item.itemType === "stock" ? item.stock_qty : true,
  };
}

function formatOrderNo(n: number | null) {
  return n == null ? "#---" : `#SNR${String(n).padStart(5, "0")}`;
}

function currency(n: number) {
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export default function NotificationCenter() {
  const [seen, setSeen] = useState<Seen>(() => {
    try {
      if (typeof window !== "undefined") {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const v = JSON.parse(raw) as Seen;
          if (v && typeof v === "object") return v;
        }
      }
    } catch {
      /* ignore */
    }
    return {};
  });
  const [items, setItems] = useState<NotifItem[]>([]);
  const [open, setOpen] = useState(false);
  const [notifOn, setNotifOn] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seen));
    } catch {
      /* ignore */
    }
  }, [seen]);

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

  const notifyBrowser = useCallback(
    (fresh: NotifItem[]) => {
      if (
        !notifOn ||
        typeof Notification === "undefined" ||
        Notification.permission !== "granted"
      ) {
        return;
      }
      fresh.slice(0, 5).forEach((item) => {
        if (item.itemType === "order") {
          new Notification(`New order ${formatOrderNo(item.order_no)}`, {
            body: `${item.customer_name} — ${currency(item.total)}`,
          });
        } else {
          new Notification("Low stock alert", {
            body: `${item.name} — only ${item.stock_qty} left`,
          });
        }
      });
    },
    [notifOn]
  );

  const fetchFeed = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const feed: NotifItem[] = [
        ...(data.orders ?? []).map(
          (o: {
            id: string;
            order_no: number | null;
            customer_name: string;
            total: number;
            created_at: string;
          }) => ({
            itemType: "order" as const,
            id: o.id,
            order_no: o.order_no,
            customer_name: o.customer_name,
            total: Number(o.total || 0),
            created_at: o.created_at,
          })
        ),
        ...(data.stock ?? []).map(
          (s: { id: string; name: string; stock_qty: number }) => ({
            itemType: "stock" as const,
            id: s.id,
            name: s.name,
            stock_qty: Number(s.stock_qty || 0),
          })
        ),
      ];
      setItems(feed);

      if (initializedRef.current) {
        const fresh = feed.filter(
          (item) => !seenIdsRef.current.has(keyOf(item))
        );
        if (fresh.length > 0) {
          playChime();
          notifyBrowser(fresh);
        }
      }
      initializedRef.current = true;
      seenIdsRef.current = new Set(feed.map(keyOf));
    } catch {
      /* ignore */
    }
  }, [notifyBrowser, playChime]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (cancelled) return;
      await fetchFeed();
    };
    const timer = window.setTimeout(() => void run(), 0);
    const id = window.setInterval(() => void run(), 30000);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.clearInterval(id);
    };
  }, [fetchFeed]);

  const unreadCount = items.filter((it) => isUnread(it, seen)).length;

  const clearItem = (item: NotifItem) => {
    setSeen((s) => markItem(item, s));
  };

  const clearAll = () => {
    setSeen((s) => items.reduce((acc, it) => markItem(it, acc), s));
  };

  const toggleNotifications = async () => {
    try {
      if (typeof Notification !== "undefined" && "permission" in Notification) {
        const perm = await Notification.requestPermission();
        setNotifOn(perm === "granted");
      }
    } catch {
      setNotifOn(false);
    }
    playChime();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-brand-50 hover:text-brand-700"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <span aria-hidden>🔔</span>
        <span className="flex-1 text-left">Notifications</span>
        {unreadCount > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="fixed left-60 top-4 z-50 w-[26rem] max-w-[calc(100vw-17rem)] overflow-hidden rounded-lg border border-stone-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-stone-200 bg-stone-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <span aria-hidden>🔔</span>
                <span className="text-sm font-bold text-stone-800">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleNotifications}
                  className="rounded-md border border-brand-300 bg-white px-2 py-1 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-100"
                >
                  {notifOn ? "Sounds on" : "Enable sound"}
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  disabled={items.length === 0}
                  className="rounded-md border border-stone-300 bg-white px-2 py-1 text-xs font-medium text-stone-600 transition-colors hover:bg-stone-100 disabled:opacity-40"
                >
                  Clear all
                </button>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2">
              {items.length === 0 && (
                <p className="px-3 py-8 text-center text-sm text-stone-400">
                  No notifications yet.
                </p>
              )}

              {items.map((item) => {
                const unread = isUnread(item, seen);
                return (
                  <div
                    key={keyOf(item)}
                    className={`group mb-1 flex items-center rounded-md border px-3 py-2 ${
                      unread
                        ? "border-amber-200 bg-amber-50"
                        : "border-transparent bg-white"
                    }`}
                  >
                    {item.itemType === "order" ? (
                      <Link
                        href={`/admin/orders/${item.id}`}
                        onClick={() => clearItem(item)}
                        className="flex flex-1 items-center gap-2 text-sm"
                      >
                        <span aria-hidden>🧾</span>
                        <span className="flex-1">
                          <span className="font-semibold text-stone-800">
                            New order {formatOrderNo(item.order_no)}
                          </span>
                          <span className="block text-xs text-stone-500">
                            {item.customer_name} · {currency(item.total)} ·{" "}
                            {new Date(item.created_at).toLocaleTimeString(
                              "en-IN",
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </span>
                        </span>
                      </Link>
                    ) : (
                      <Link
                        href="/admin/products"
                        onClick={() => clearItem(item)}
                        className="flex flex-1 items-center gap-2 text-sm"
                      >
                        <span aria-hidden>📦</span>
                        <span className="flex-1">
                          <span className="font-semibold text-stone-800">
                            Low stock: {item.name}
                          </span>
                          <span
                            className={`block text-xs ${
                              item.stock_qty === 0
                                ? "font-semibold text-red-600"
                                : "text-amber-600"
                            }`}
                          >
                            Only {item.stock_qty} left
                          </span>
                        </span>
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => clearItem(item)}
                      title="Clear notification"
                      className="ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-100 hover:text-red-600"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-stone-200 bg-stone-50 px-4 py-2 text-[11px] text-stone-400">
              Auto-checks every 30 s · low-stock threshold from admin settings
            </div>
          </div>
        </>
      )}
    </>
  );
}