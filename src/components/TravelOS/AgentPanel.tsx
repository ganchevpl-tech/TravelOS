import { T, SF_NODES, SF_LABELS, card, cardTitle, type Offer } from "./tokens";
import { DR, Tag } from "./shared";
import { User, Star, Ruler, BedDouble, Layout, CheckCircle, Zap } from "lucide-react";

interface Props {
  offer: Offer | null;
  bookingRef: string | null;
  status: string;
  approved: boolean;
  payState: string | null;
  voucherDone: boolean;
  onOpenIntake: () => void;
  onApprove: () => void;
  accent: string;
}

export function AgentPanel({ offer, bookingRef, status, approved, payState, voucherDone, onApprove, accent }: Props) {
  const sfIdx = SF_NODES.indexOf(status);

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* 1. ПЕРСОНАЛИЗАЦИЯ */}
      <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: accent, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#000" }}>Х</div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800 }}>Добре дошла, Хриси!</div>
          <div style={{ fontSize: 11, color: T.muted }}>Senior Travel Agent · ABV OOD Desk</div>
        </div>
      </div>

      {/* 2. ПРЕДСКАЗВАЩА АЛАРМА (MUNICH EXPO) */}
      <div style={{ ...card(), borderColor: "rgba(168,85,247,.35)", background: "linear-gradient(135deg, rgba(168,85,247,.08), rgba(168,85,247,.02))" }}>
        <div style={cardTitle("#a855f7")}>🔮 Predictive Alert</div>
        <div style={{ fontSize: 12, fontWeight: 800, color: T.text, marginBottom: 4 }}>Камен Петров — Munich Expo (Annual)</div>
        <div style={{ fontSize: 10, color: T.muted, lineHeight: 1.6, marginBottom: 8 }}>
          Миналата година резервира след 14 дни. AI прогнозира <strong style={{ color: "#a855f7" }}>94% шанс за сделка</strong>, ако предложим Early-bird до петък.
        </div>
        <button style={{ width: "100%", background: "#a855f7", color: "#fff", border: "none", borderRadius: 8, padding: "8px 0", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>
          🎯 Подготви оферта за Мюнхен
        </button>
      </div>

      {offer && (
        <>
          {/* 3. ДЕТАЙЛИ НА СТАЯТА И ОТЗИВИ */}
          <div style={card()}>
            <div style={cardTitle()}>📋 Детайли & Room Analytics</div>
            <DR label="Хотел" value={offer.hotel} />
            
            {/* Room Specs */}
            <div style={{ display: "flex", gap: 6, margin: "10px 0", flexWrap: "wrap" }}>
              <Tag color="#60a5fa"><BedDouble size={10}/> Twin Beds Guaranteed</Tag>
              <Tag color="#60a5fa"><Ruler size={10}/> 22 m²</Tag>
              <Tag color="#60a5fa"><Layout size={10}/> City View</Tag>
              <Tag color={T.green}><CheckCircle size={10}/> No ROH (Confirmed)</Tag>
            </div>

            {/* Social Proof */}
            <div style={{ background: T.surf2, borderRadius: 8, padding: "8px 12px", display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
               <div style={{ textAlign: "center" }}>
                 <div style={{ fontSize: 9, color: T.muted }}>Booking</div>
                 <div style={{ fontSize: 11, fontWeight: 800, color: T.green }}>8.7/10</div>
               </div>
               <div style={{ textAlign: "center", borderLeft: `1px solid ${T.border}`, paddingLeft: 10 }}>
                 <div style={{ fontSize: 9, color: T.muted }}>Google</div>
                 <div style={{ fontSize: 11, fontWeight: 800, color: "#f59e0b" }}>4.5/5</div>
               </div>
               <div style={{ textAlign: "center", borderLeft: `1px solid ${T.border}`, paddingLeft: 10 }}>
                 <div style={{ fontSize: 9, color: T.muted }}>TripAdvisor</div>
                 <div style={{ fontSize: 11, fontWeight: 800 }}>#10 in BUH</div>
               </div>
            </div>

            <DR label="Обща сума" value={`€${offer.price_total}`} vc={accent} />
            <DR label={`vs Booking.com`} value={`-€${Math.round((offer.comp_price - offer.price) * offer.adults)} ✓`} vc={T.green} />
          </div>

          {/* 4. TAX COMPLIANCE (MANAGER) */}
          <div style={card({ borderColor: "rgba(34,197,94,.3)", background: "rgba(34,197,94,.04)" })}>
            <div style={cardTitle(T.green)}>🛡️ Compliance & Tax Policy</div>
            <div style={{ fontSize: 10, marginBottom: 8 }}>Статут: <strong style={{ color: accent }}>Manager (АБВ ООД)</strong></div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
              <Tag color={T.green}>✅ ABV Policy OK</Tag>
              <Tag color={T.green}>✅ 100% Признат разход</Tag>
              <Tag color="#60a5fa">📅 Mon–Fri ✓</Tag>
            </div>
            <div style={{ fontSize: 10, color: T.muted, lineHeight: 1.4, padding: "6px 8px", background: T.surf, borderRadius: 6, marginBottom: 6 }}>
                💰 <strong>Savings Alert:</strong> Преместване на 11–12.06 спестява <strong>€95</strong>.
            </div>
          </div>

          {/* 5. ACTION BUTTON */}
          <button 
            onClick={onApprove} 
            disabled={approved} 
            style={{ 
              width: "100%", 
              background: approved ? "#1c2e25" : accent, 
              color: approved ? "#2d6a4f" : "#000", 
              fontFamily: "'Syne',sans-serif", 
              fontWeight: 800, 
              fontSize: 13, 
              border: "none", 
              borderRadius: 10, 
              padding: 14, 
              cursor: approved ? "default" : "pointer", 
              marginBottom: 12, 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              gap: 6, 
              boxShadow: approved ? "none" : `0 4px 14px ${accent}40`
            }}
          >
            {approved ? "✓ Одобрено & Изпратено" : "🚀 Review & Send to Client"}
          </button>
        </>
      )}

      {/* 6. STATUS МАШИНА */}
      <div style={card()}>
        <div style={cardTitle()}>Статус на тикета #TOS-8821</div>
        <div style={{ display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap" }}>
          {SF_NODES.map((n, i) => (
            <span key={n} style={{ display: "contents" }}>
              <div style={{ background: i < sfIdx ? `${T.green}10` : i === sfIdx ? `${accent}10` : T.surf, border: `1px solid ${i < sfIdx ? "rgba(34,197,94,.35)" : i === sfIdx ? accent : T.border}`, borderRadius: 5, padding: "4px 8px", fontSize: 9, color: i < sfIdx ? T.green : i === sfIdx ? accent : T.muted }}>
                {SF_LABELS[n]}
              </div>
              {i < SF_NODES.length - 1 && <span style={{ fontSize: 9, color: T.border }}>→</span>}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
