import { useState } from "react";
import { T, card, cardTitle } from "./tokens";
import { DR } from "./shared";
import { marketFees, updateMarketFees } from "./pricing";

interface Props {
  accent: string;
  onLog: (type: string, text: string) => void;
}

export function OperationsPanel({ accent, onLog }: Props) {
  const [local, setLocal] = useState(marketFees.local);
  const [europe, setEurope] = useState(marketFees.europe);
  const [asia, setAsia] = useState(marketFees.asia);

  const saveFees = () => {
    updateMarketFees({ local, europe, asia });
    onLog("sys", "Операции: Ценовите правила са обновени ✓");
  };

  const feeInput = (val: number, set: (n: number) => void) => (
    <input
      type="number"
      value={val}
      onChange={e => set(Number(e.target.value) || 0)}
      style={{ width: 60, background: T.surf, border: `1px solid ${T.border}`, color: T.text, borderRadius: 6, padding: "3px 6px", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, textAlign: "right" }}
    />
  );

  return (
    <div>
      <div style={{ ...card(), borderColor: accent, background: `${accent}06` }}>
        <div style={cardTitle(accent)}>💼 Management & P&L Report</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div style={{ background: T.surf, border: `1px solid ${T.border}`, borderRadius: 8, padding: 10 }}>
            <div style={{ fontSize: 9, color: T.muted, marginBottom: 4 }}>Ликвидност (Банка)</div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 18, color: T.text }}>€14,200</div>
          </div>
          <div style={{ background: T.surf, border: `1px solid ${T.border}`, borderRadius: 8, padding: 10 }}>
            <div style={{ fontSize: 9, color: T.muted, marginBottom: 4 }}>Нетен Марж (Апр)</div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 18, color: accent }}>€3,150</div>
          </div>
        </div>
      </div>

      <div style={card()}>
        <div style={cardTitle()}>⛓️ B2B Settlement (Clearing)</div>
        <DR label="Дължимо към Абакс (пакети)" value="- €8,400" vc={T.red} />
        <DR label="Вземания от Абакс (комисионни)" value="+ €1,200" vc={T.green} />
        <div style={{ height: 1, background: T.border, margin: "8px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
          <span>Нетно Салдо за Сетълмент</span>
          <span style={{ color: accent, fontFamily: "'JetBrains Mono',monospace" }}>€7,200</span>
        </div>
        <button
          onClick={() => onLog("sys", "Генериран Протокол за прихващане с Абакс ✓")}
          style={{ marginTop: 10, width: "100%", background: T.surf, border: `1px solid ${T.border}`, color: T.text, borderRadius: 8, padding: "9px 0", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
        >
          📄 Генерирай Протокол за Прихващане
        </button>
      </div>

      <div style={card()}>
        <div style={cardTitle()}>⚙️ Operations Pricing Rules</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", fontSize: 11 }}>
          <span style={{ color: T.muted }}>🇧🇬 Local Fee</span>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>{feeInput(local, setLocal)}<span style={{ color: T.muted }}>€</span></div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", fontSize: 11 }}>
          <span style={{ color: T.muted }}>🇪🇺 Europe Fee</span>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>{feeInput(europe, setEurope)}<span style={{ color: T.muted }}>€</span></div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", fontSize: 11 }}>
          <span style={{ color: T.muted }}>🌏 Asia Fee</span>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>{feeInput(asia, setAsia)}<span style={{ color: T.muted }}>€</span></div>
        </div>
        <button
          onClick={saveFees}
          style={{ marginTop: 10, width: "100%", background: accent, border: "none", color: "#000", borderRadius: 8, padding: "9px 0", fontSize: 11, fontWeight: 800, cursor: "pointer" }}
        >
          💾 Запази настройките
        </button>
      </div>

      <div style={card()}>
        <div style={cardTitle()}>👥 Agent Performance & Targets</div>
        <DR label="Иван Петров (Таргет: €5000)" value="€3,200 (64%)" />
        <DR label="Мария Колева (Таргет: €5000)" value="€4,800 (96%)" vc={T.green} />
        <div style={{ fontSize: 9, color: T.muted, marginTop: 6 }}>* Бонусите се начисляват върху реализиран марж.</div>
      </div>

      <div style={{ ...card(), borderColor: T.orange }}>
        <div style={cardTitle(T.orange)}>⚠️ Refunds & Cancellations</div>
        <DR label="Чакащи връщания към клиенти" value="€1,100 (3 сделки)" vc={T.orange} />
      </div>
    </div>
  );
}
