import type { ChatMessage, Tenant } from "./tokens";

interface PhoneMsgProps {
  m: ChatMessage;
  tenant: Tenant;
  onPay: () => void;
  payState: string | null;
}

export function PhoneMsg({ m, tenant, onPay, payState }: PhoneMsgProps) {
  if (m.isOffer && m.offer) {
    const o = m.offer;
    const isBank = o.price_total >= 1000;
    const btnBg = payState === "paid" ? "#22c55e" : payState === "processing" ? "#555" : isBank ? "linear-gradient(135deg,#1a4fa8,#003087)" : "linear-gradient(135deg,#635bff,#4f46e5)";
    const btnTxt = payState === "paid" ? "✅ Платено!" : payState === "processing" ? "⏳ Обработва се..." : isBank ? "🏦 Bank Transfer (0% fee) — UniCredit" : "💳 Плати с карта / Apple Pay";
    return (
      <div style={{ alignSelf: "flex-start", maxWidth: "94%", animation: "msgIn .3s" }}>
        <div style={{ background: "#1e1c3a", border: "1px solid rgba(115,96,242,.35)", borderRadius: 12, padding: 11, fontSize: 11 }}>
          <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4 }}>🏨 {o.hotel}</div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,.4)", marginBottom: 6 }}>{o.destination} · {o.checkin}–{o.checkout} · {o.adults} възр. · {o.board}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginBottom: 4 }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 20, color: "#00e5b8" }}>€{o.price}</span>
            <span style={{ fontSize: 9, color: "rgba(255,255,255,.3)" }}>на човек</span>
            <span style={{ fontSize: 9, color: "rgba(255,255,255,.25)", textDecoration: "line-through" }}>€{o.comp_price}</span>
          </div>
          <span style={{ fontSize: 8, background: "rgba(0,229,184,.12)", color: "#00e5b8", borderRadius: 20, padding: "2px 7px", display: "inline-block", marginBottom: 6 }}>
            Спестявате €{Math.round((o.comp_price - o.price) * o.adults)}
          </span>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,.4)", lineHeight: 1.7, marginBottom: 8 }}>
            💰 Общо: <strong style={{ color: "#00e5b8" }}>€{o.price_total}</strong> · ✦ {o.includes}
          </div>
          <button onClick={onPay} disabled={!!payState} style={{ width: "100%", border: "none", borderRadius: 8, padding: 10, fontSize: 11, fontWeight: 700, cursor: payState ? "default" : "pointer", background: btnBg, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            {btnTxt}
          </button>
          {isBank && <div style={{ fontSize: 8, color: "rgba(255,255,255,.3)", textAlign: "center", marginTop: 4 }}>IBAN: BG80 UNCR 9660 1011 3424 01 · €{o.price_total}</div>}
        </div>
        <div style={{ fontSize: 8, color: "rgba(255,255,255,.22)", marginTop: 2, paddingLeft: 3 }}>{tenant.name} · {m.time}</div>
        <div style={{ fontSize: 7, color: "rgba(255,255,255,.15)", paddingLeft: 3, display: "flex", alignItems: "center", gap: 3 }}>⚡ Sent via Infobip API · offer_message</div>
      </div>
    );
  }
  const isClient = m.dir === "client";
  return (
    <div style={{ alignSelf: isClient ? "flex-end" : "flex-start", maxWidth: "85%", animation: "msgIn .3s" }}>
      <div style={{ padding: "8px 10px", borderRadius: 12, fontSize: 11, lineHeight: 1.55, whiteSpace: "pre-wrap", background: isClient ? "#7360f2" : "#2a284e", borderBottomRightRadius: isClient ? 3 : 12, borderBottomLeftRadius: isClient ? 12 : 3 }}>
        {m.text}
      </div>
      <div style={{ fontSize: 8, color: "rgba(255,255,255,.22)", marginTop: 2, padding: "0 3px", textAlign: isClient ? "right" : "left" }}>
        {isClient ? "Вие" : tenant.name} · {m.time}
      </div>
      {!isClient && <div style={{ fontSize: 7, color: "rgba(255,255,255,.15)", paddingLeft: 3 }}>⚡ Sent via Infobip API</div>}
    </div>
  );
}
