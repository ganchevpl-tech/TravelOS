// Design tokens mirroring the POC
export const T = {
  bg: "#06090f",
  surf: "#0d1117",
  surf2: "#131923",
  border: "rgba(255,255,255,0.07)",
  green: "#22c55e",
  orange: "#f97316",
  red: "#ef4444",
  text: "#e2e8f0",
  muted: "rgba(255,255,255,0.38)",
  viber: "#7360f2",
  stripe: "#635bff",
};

export const TENANTS: Record<string, Tenant> = {
  sunshine: {
    name: "Sunshine Travel",
    icon: "✈️",
    accent: "#10b981",
    accent2: "#047857",
    voice: "Приятелски и топъл тон. Фокус върху семейни пакети и beach holidays.",
  },
  balkan: {
    name: "Balkan Tours",
    icon: "🏔️",
    accent: "#f59e0b",
    accent2: "#b45309",
    voice: "Авантюристичен тон. Фокус върху планински и екотуризъм пакети.",
  },
  prima: {
    name: "Prima Holidays",
    icon: "🌊",
    accent: "#06b6d4",
    accent2: "#0e7490",
    voice: "Луксозен тон. Фокус върху 5★ хотели и VIP преживявания.",
  },
  imperial: {
    name: "Imperial Travel",
    icon: "👑",
    accent: "#a855f7",
    accent2: "#6b21a8",
    voice: "Премиум тон. Фокус върху ексклузивни дестинации, частни турове и луксозни круизи.",
  },
};

export interface Tenant {
  name: string;
  icon: string;
  accent: string;
  accent2: string;
  voice: string;
}

export interface Offer {
  hotel: string;
  destination: string;
  checkin: string;
  checkout: string;
  nights: number;
  adults: number;
  board: string;
  price: number;
  price_total: number;
  comp_price: number;
  comp_name: string;
  margin: number;
  vendor_cost: number;
  includes: string;
  vendor?: string;
}

export interface ChatMessage {
  id: number;
  dir?: "agent" | "client";
  text?: string;
  time: string;
  isOffer?: boolean;
  offer?: Offer;
  ref?: string;
}

export interface LogEntry {
  id: number;
  type: string;
  text: string;
  time: string;
}

export const SF_NODES = ["inquiry", "offer", "confirmed", "payment", "paid", "voucher"];
export const SF_LABELS: Record<string, string> = {
  inquiry: "Запитване",
  offer: "Оферта",
  confirmed: "Потвърдена",
  payment: "Плащане",
  paid: "Платена",
  voucher: "Ваучер ✓",
};
export const STEPS = ["💬 Запитване", "🤖 AI Оферта", "✅ Одобрение", "💳 Плащане", "🎫 Ваучер"];
export const PHASE_IDX: Record<string, number> = {
  idle: 0,
  chatting: 0,
  offer_ready: 1,
  approved: 2,
  paid: 3,
  done: 4,
};
export const LOG_LABELS: Record<string, string> = {
  sys: "SYSTEM",
  ai: "AI ENGINE",
  pay: "PAYMENT",
  ok: "SUCCESS",
  warn: "ALERT",
  mkt: "MARKETING",
};
export const LOG_COLS: Record<string, string> = {
  sys: "#00e5b8",
  ai: "#2563eb",
  pay: "#635bff",
  ok: "#22c55e",
  warn: "#f97316",
  mkt: "#ec4899",
};

export function ts() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

export function genRef() {
  return "BK-" + Math.random().toString(36).substr(2, 6).toUpperCase();
}

export function tryParseOffer(text: string): Offer | null {
  const m = text.match(/OFFER_JSON:(\{[\s\S]+?\})/);
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}

export const card = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  background: T.surf2,
  border: `1px solid ${T.border}`,
  borderRadius: 11,
  padding: 14,
  marginBottom: 12,
  ...extra,
});

export const cardTitle = (accent?: string): React.CSSProperties => ({
  fontFamily: "'Syne',sans-serif",
  fontSize: 10,
  fontWeight: 700,
  color: accent || T.muted,
  letterSpacing: "0.1em",
  textTransform: "uppercase" as const,
  marginBottom: 10,
});
