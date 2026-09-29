import { useState, useRef, useEffect, useCallback } from "react";
import { T, TENANTS, STEPS, PHASE_IDX, LOG_LABELS, LOG_COLS, ts, genRef, tryParseOffer, card } from "./tokens";
import type { ChatMessage, LogEntry, Offer } from "./tokens";
import { Pulse } from "./shared";
import { PhoneMsg } from "./PhoneMsg";
import { AgentPanel } from "./AgentPanel";
import { MarketingPanel } from "./MarketingPanel";
import { OperationsView } from "./OperationsView";
import { CDPView } from "./CDPView";
import { calculatePricing } from "./pricing";

export default function TravelOSUltimate() {
  const [tab, setTab] = useState("agent");
  const [phase, setPhase] = useState("idle");
  const [status, setStatus] = useState("inquiry");
  
  // 1. ИНИЦИАЛИЗАЦИЯ НА ТИКЕТ #TOS-8821
  const [messages, setMessages] = useState<ChatMessage[]>([{ 
    id: 1, dir: "agent", 
    text: "👋 Здравей, Хриси! Получих нов имейл запитване #TOS-8821. Даниел Каменов (АБВ ООД) търси Букурещ за юни. Искаш ли да проверя наличности или първо да уточним подробностите?", 
    time: ts() 
  }]);
  
  const [isTranslated, setIsTranslated] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([{ id: 1, type: "sys", text: "Тикет #TOS-8821 заведен автоматично от имейл запитване ✓", time: ts() }]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [bookingRef, setBookingRef] = useState<string | null>(null);
  const [approved, setApproved] = useState(false);
  const [payState, setPayState] = useState<string | null>(null);
  const [voucherDone, setVoucherDone] = useState(false);

  const msgsRef = useRef<HTMLDivElement>(null);
  const tenant = TENANTS["sunshine"];
  const acc = tenant.accent;

  // SCROLL LOGIC
  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [messages, loading]);

  const addMsg = useCallback((msg: Partial<ChatMessage>) => setMessages(p => [...p, { id: Date.now(), time: ts(), ...msg } as ChatMessage]), []);
  const addLog = useCallback((type: string, text: string) => setLogs(p => [{ id: Date.now(), type, text, time: ts() }, ...p]), []);

  // MAIN SEND LOGIC
  const sendMsg = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");

    // 2. LOGIC: МУЛТИЕЗИЧЕН ПРЕВОД
    let textToDisplay = text;
    if (isTranslated && /^[a-zA-Z\s.,!?]+$/.test(text)) {
      textToDisplay = `[Превод]: ${text} (Оригинал: EN)`;
      addLog("sys", "AI: Извършен автоматичен превод от English към Български ✓");
    }
    
    addMsg({ dir: "client", text: textToDisplay });
    setLoading(true);

    // 3. LOGIC: ИНТЕЛИГЕНТНО УТОЧНЯВАНЕ (Clarification)
    if (text.toLowerCase().includes("букурещ") && !text.includes("12") && !offer) {
       setTimeout(() => {
         addMsg({ dir: "agent", text: "Хриси, Даниел не е дал точни дати. Подготвил съм въпрос за полет в сряда вместо четвъртък, защото цената пада с 40% (€120 спестяване). Да го пратя ли?" });
         addLog("ai", "Inquiry Audit: Липсващи дати. Открита възможност за 40% оптимизация.");
         setLoading(false);
       }, 1000);
       return;
    }

    // 4. LOGIC: СЦЕНАРИЯТ ДАНИЕЛ КАМЕНОВ (Offer Generation)
    if (text.includes("12") || text.includes("13")) {
      addLog("ai", "CDP Match: Daniel Kamenov (Manager @ ABV OOD). Прилагам данъчни лимити и фирмена политика.");
      
      const pricing = calculatePricing(45, "OTP", 60, "Manager");

      const draftOffer: Offer = {
        hotel: "Ibis Bucharest Politehnica 3★",
        destination: "Букурещ",
        checkin: "12.06",
        checkout: "13.06",
        nights: 1,
        adults: 1,
        board: "Superior Twin Room (22кв.м) + 🅿️ + 🍳",
        price: pricing.finalPrice, // €58
        price_total: pricing.finalPrice,
        comp_price: 60,
        comp_name: "Booking.com",
        margin: pricing.margin,
        vendor_cost: 45,
        includes: "Twin beds, City View, No ROH ✓",
        vendor: "RateHawk",
      };

      setTimeout(() => {
        addMsg({ dir: "agent", text: "✅ Готово! Подбихме Booking.com с €2. Офертата е напълно признат разход (Tax Compliant). Очаквам твоето одобрение." });
        setOffer(draftOffer);
        setBookingRef(genRef());
        setPhase("offer_ready");
        setStatus("offer");
        setLoading(false);
      }, 1200);
      return;
    }

    setTimeout(() => { setMessages(p => [...p, { id: Date.now(), dir: "agent", text: "Разбрах! Обработвам информацията.", time: ts() } as ChatMessage]); setLoading(false); }, 800);
  }, [input, loading, isTranslated, offer, addMsg, addLog]);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: T.bg, color: T.text }}>
      
      {/* HEADER: ХРИСИ & ПРЕВОД */}
      <div style={{ background: T.surf, borderBottom: `1px solid ${T.border}`, padding: "0 20px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: acc, color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>T</div>
          <div style={{ fontSize: 14, fontWeight: 800 }}>TravelOS Pro 5.1</div>
          <div style={{ width: 1, height: 20, background: T.border }} />
          <div style={{ fontSize: 11 }}>Добре дошла, <strong>Хриси</strong>! <span style={{ opacity: 0.5 }}>| Тикет #TOS-8821</span></div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, cursor: "pointer", color: isTranslated ? acc : T.muted }}>
             <input type="checkbox" checked={isTranslated} onChange={e => setIsTranslated(e.target.checked)} style={{ accentColor: acc }} />
             Искам превод
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: T.muted }}>
            <Pulse color={acc} /> <span style={{ color: acc, fontWeight: 700 }}>AI Co-pilot: Online</span>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", borderBottom: `1px solid ${T.border}`, background: T.surf }}>
        {([["agent", "💬 Чат & Агент"], ["operations", "🛡️ Shield"], ["marketing", "📊 Marketing"], ["cdp", "👥 CDP"]] as const).map(([id, label]) => (
          <div key={id} onClick={() => setTab(id)} style={{ padding: "12px 20px", fontSize: 11, fontWeight: 700, cursor: "pointer", color: tab === id ? acc : T.muted, borderBottom: `2px solid ${tab === id ? acc : "transparent"}` }}>{label}</div>
        ))}
      </div>

      {/* MAIN CONTENT AREA */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "280px 1fr 280px", overflow: "hidden" }}>
        
        {/* PHONE SIMULATOR */}
        <div style={{ borderRight: `1px solid ${T.border}`, padding: 14, display: "flex", flexDirection: "column" }}>
           <div style={{ flex: 1, background: "#12112a", borderRadius: 24, border: "4px solid #252340", overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div ref={msgsRef} style={{ flex: 1, overflowY: "auto", padding: 10, display: "flex", flexDirection: "column", gap: 8, background: "#141424" }}>
                {messages.map(m => <PhoneMsg key={m.id} m={m} tenant={tenant} onPay={() => setPayState("paid")} payState={payState} />)}
                {loading && <div style={{ fontSize: 9, color: T.muted, padding: 10 }}>AI мисли...</div>}
              </div>
              <div style={{ padding: 10, background: "#1a1838", display: "flex", gap: 6 }}>
                <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMsg()} placeholder="Отговор на Даниел..." style={{ flex: 1, background: "#252344", border: "none", borderRadius: 15, padding: "8px 12px", color: "#fff", fontSize: 11, outline: "none" }} />
                <button onClick={sendMsg} style={{ background: acc, border: "none", width: 28, height: 28, borderRadius: "50%", cursor: "pointer" }}>➤</button>
              </div>
           </div>
        </div>

        {/* CENTER TABS */}
        <div style={{ borderRight: `1px solid ${T.border}`, overflowY: "auto" }}>
           {tab === "agent" && <AgentPanel offer={offer} bookingRef={bookingRef} status={status} approved={approved} payState={payState} voucherDone={voucherDone} onOpenIntake={() => {}} onApprove={() => setApproved(true)} accent={acc} />}
           {tab === "operations" && <OperationsView accent={acc} onLog={addLog} />}
           {tab === "marketing" && <MarketingPanel accent={acc} metaConnected={false} onConnectMeta={() => {}} />}
           {tab === "cdp" && <CDPView accent={acc} />}
        </div>

        {/* LOGS */}
        <div style={{ overflowY: "auto", padding: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: T.muted, marginBottom: 12, textTransform: "uppercase" }}>System Logs</div>
          {logs.map(l => (
            <div key={l.id} style={{ fontSize: 10, padding: 8, background: T.surf2, borderRadius: 6, marginBottom: 6, borderLeft: `2px solid ${acc}` }}>
              <div style={{ color: T.text }}>{l.text}</div>
              <div style={{ fontSize: 8, opacity: 0.3, marginTop: 4 }}>{l.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
