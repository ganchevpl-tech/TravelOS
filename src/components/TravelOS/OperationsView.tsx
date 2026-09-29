import { useState } from "react";
import { T } from "./tokens";
import { marketFees, updateMarketFees } from "./pricing";
import { ABV_PROFILE } from "./CDPView";
import { ShieldCheck, Globe, Zap, Landmark, Receipt, CreditCard } from "lucide-react";

interface Props {
  accent: string;
  onLog: (type: string, text: string) => void;
}

export function OperationsView({ accent, onLog }: Props) {
  const [local, setLocal] = useState(marketFees.local);
  const [europe, setEurope] = useState(marketFees.europe);
  const [isPaid, setIsPaid] = useState(false);

  const saveFees = () => {
    updateMarketFees({ ...marketFees, local, europe });
    onLog("sys", `GM: Ценовите правила са обновени ✓`);
  };

  const cardBox: React.CSSProperties = {
    background: T.surf,
    border: `1px solid ${T.border}`,
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
  };

  return (
    <div style={{ maxWidth: 920, margin: "0 auto", paddingBottom: 40 }}>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 800, color: T.text }}>🛡️ Shield & Operations</div>
          <div style={{ fontSize: 12, color: T.muted }}>Управление на ликвидност и B2B разплащания</div>
        </div>
        <div style={{ background: `${accent}15`, color: accent, padding: "5px 12px", borderRadius: 20, fontSize: 10, fontWeight: 700, border: `1px solid ${accent}30` }}>
          FINANCIAL SHIELD: ACTIVE ✓
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
        {/* ЛЯВА КОЛОНА: ПЛАЩАНИЯ */}
        <div>
          <div style={cardBox}>
            <div style={{ fontSize: 11, fontWeight: 800, color: T.muted, marginBottom: 15, display: "flex", alignItems: "center", gap: 8 }}>
              <Landmark size={14} color={accent}/> OPEN BANKING WATCHDOG
            </div>
            <div style={{ background: isPaid ? `${accent}10` : "#f9731610", border: `1px solid ${isPaid ? accent + '40' : '#f9731640'}`, borderRadius: 10, padding: 14 }}>
               <div style={{ fontSize: 10, fontWeight: 700, color: isPaid ? accent : "#f97316", marginBottom: 4 }}>
                 {isPaid ? "🔔 ПЛАЩАНЕТО ПОЛУЧЕНО" : "⏳ ОЧАКВА СЕ ПЛАЩАНЕ"}
               </div>
               <div style={{ fontSize: 13, fontWeight: 600 }}>€120.00 от АБВ ООД</div>
               <div style={{ fontSize: 10, color: T.muted }}>Реф: #TOS-8821 · Даниел Каменов</div>
            </div>
            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <button onClick={() => { setIsPaid(true); onLog("pay", "Банка: Потвърден входящ превод от АБВ ООД (€120) ✓"); }} style={{ flex: 1, background: T.surf2, border: `1px solid ${T.border}`, color: T.text, padding: "8px", borderRadius: 8, fontSize: 10, cursor: "pointer" }}>Симулирай превод</button>
              <button onClick={() => onLog("pay", "Stripe: Генериран линк за спешно плащане 💳")} style={{ flex: 1, background: "#635bff", color: "white", border: "none", padding: "8px", borderRadius: 8, fontSize: 10, cursor: "pointer" }}>💳 Stripe Link</button>
            </div>
          </div>

          <div style={cardBox}>
            <div style={{ fontSize: 11, fontWeight: 800, color: T.muted, marginBottom: 15, display: "flex", alignItems: "center", gap: 8 }}>
              <Globe size={14} color={accent}/> СЕТЪЛМЕНТ С АБАКС
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12 }}>
              <span>Дължими за пакети</span>
              <span style={{ color: T.red, fontWeight: 700 }}>-€8,400</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 12 }}>
              <span>Комисионни за получаване</span>
              <span style={{ color: T.green, fontWeight: 700 }}>+€1,200</span>
            </div>
            <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 700 }}>НЕТНО САЛДО</span>
              <span style={{ fontSize: 18, color: accent, fontWeight: 800 }}>€7,200</span>
            </div>
            <button onClick={() => onLog("sys", "Генериран протокол за прихващане с Абакс ✓")} style={{ marginTop: 14, width: "100%", background: T.surf2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>📄 Генерирай Протокол (Clearing)</button>
          </div>
        </div>

        {/* ДЯСНА КОЛОНА: P&L И ЦЕНИ */}
        <div>
          <div style={{ ...cardBox, background: `linear-gradient(135deg, ${T.surf}, ${accent}08)` }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: T.muted, marginBottom: 15 }}>📊 P&L ПРЕГЛЕД (ЮНИ)</div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 9, color: T.muted }}>ЛИКВИДНОСТ</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>€14,200</div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: T.muted }}>ЧИСТ МАРЖ</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: accent }}>€3,150</div>
            </div>
          </div>

          <div style={cardBox}>
            <div style={{ fontSize: 11, fontWeight: 800, color: T.muted, marginBottom: 15 }}>⚙️ PRICING ENGINE</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <input type="number" value={local} onChange={e => setLocal(Number(e.target.value))} style={{ background: T.surf2, border: `1px solid ${T.border}`, color: "#fff", padding: "8px", borderRadius: 6, fontSize: 12 }} />
              <input type="number" value={europe} onChange={e => setEurope(Number(e.target.value))} style={{ background: T.surf2, border: `1px solid ${T.border}`, color: "#fff", padding: "8px", borderRadius: 6, fontSize: 12 }} />
            </div>
            <button onClick={saveFees} style={{ width: "100%", background: "transparent", border: `1px solid ${accent}60`, color: accent, padding: "8px", borderRadius: 8, fontSize: 10, fontWeight: 700, cursor: "pointer" }}>💾 Запази таксите</button>
          </div>
        </div>
      </div>

      {/* FOOTER: FULFILLMENT */}
      <div style={{ ...cardBox, marginTop: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: T.muted, marginBottom: 15 }}>📤 READY FOR ISSUE · АВТОМАТИЗАЦИЯ</div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div style={{ flex: 1, padding: 12, background: T.surf2, borderRadius: 8, fontSize: 11 }}>
            <strong>Даниел Каменов (#TOS-8821)</strong><br/>
            <span style={{ opacity: 0.6 }}>Ibis Bucharest · Twin Room · Tax Compliant ✓</span>
          </div>
          <button disabled={!isPaid} onClick={() => onLog("ok", "🚀 Резервацията е потвърдена в RateHawk. Билетът е издаден в Emirates! ✓")} style={{ background: isPaid ? accent : T.muted, color: "#000", border: "none", borderRadius: 10, padding: "12px 20px", fontSize: 12, fontWeight: 800, cursor: isPaid ? "pointer" : "not-allowed" }}>🚀 Потвърди & Издай</button>
        </div>
      </div>
    </div>
  );
}
