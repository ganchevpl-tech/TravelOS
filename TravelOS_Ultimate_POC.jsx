import { useState, useRef, useEffect, useCallback } from "react";

// ── Design tokens ─────────────────────────────────────────────
const T = {
  bg:"#06090f", surf:"#0d1117", surf2:"#131923",
  border:"rgba(255,255,255,0.07)",
  green:"#22c55e", orange:"#f97316", red:"#ef4444",
  text:"#e2e8f0", muted:"rgba(255,255,255,0.38)",
  viber:"#7360f2", stripe:"#635bff",
};

// ── Tenants ───────────────────────────────────────────────────
const TENANTS = {
  sunshine:{ name:"Sunshine Travel", icon:"✈️", accent:"#00e5b8", accent2:"#2563eb",
    voice:"Приятелски и топъл тон. Фокус върху семейни пакети и beach holidays." },
  balkan:  { name:"Balkan Tours",    icon:"🏔️", accent:"#f59e0b", accent2:"#b45309",
    voice:"Авантюристичен тон. Фокус върху планински и екотуризъм пакети." },
  prima:   { name:"Prima Holidays",  icon:"🌊", accent:"#06b6d4", accent2:"#0e7490",
    voice:"Луксозен тон. Фокус върху 5★ хотели и VIP преживявания." },
};

const SF_NODES  = ["inquiry","offer","confirmed","payment","paid","voucher"];
const SF_LABELS = { inquiry:"Запитване", offer:"Оферта", confirmed:"Потвърдена", payment:"Плащане", paid:"Платена", voucher:"Ваучер ✓" };
const STEPS     = ["💬 Запитване","🤖 AI Оферта","✅ Одобрение","💳 Плащане","🎫 Ваучер"];
const PHASE_IDX = { idle:0, chatting:0, offer_ready:1, approved:2, paid:3, done:4 };
const LOG_LABELS= { sys:"SYSTEM", ai:"AI ENGINE", pay:"PAYMENT", ok:"SUCCESS", warn:"ALERT", mkt:"MARKETING" };
const LOG_COLS  = { sys:"#00e5b8", ai:"#2563eb", pay:"#635bff", ok:"#22c55e", warn:"#f97316", mkt:"#ec4899" };

function ts() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}:${String(d.getSeconds()).padStart(2,"0")}`;
}
function genRef() { return "BK-" + Math.random().toString(36).substr(2,6).toUpperCase(); }
function tryParseOffer(text) {
  const m = text.match(/OFFER_JSON:(\{[\s\S]+?\})/);
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch { return null; }
}

// ── Reusable style atoms ──────────────────────────────────────
const card = (extra={}) => ({ background:T.surf2, border:`1px solid ${T.border}`, borderRadius:11, padding:14, marginBottom:12, ...extra });
const cardTitle = (accent) => ({ fontFamily:"'Syne',sans-serif", fontSize:10, fontWeight:700, color: accent||T.muted, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:10 });
const DR = ({ label, value, vc }) => (
  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:`1px solid rgba(255,255,255,0.04)`, fontSize:11 }}>
    <span style={{ color:T.muted }}>{label}</span>
    <span style={{ fontWeight:600, color:vc||T.text, fontFamily: vc?"'JetBrains Mono',monospace":undefined }}>{value}</span>
  </div>
);
const Tag = ({ children, color="#00e5b8" }) => (
  <span style={{ display:"inline-flex", alignItems:"center", gap:3, fontSize:8, padding:"2px 7px", borderRadius:20, fontWeight:700, background:`${color}18`, color, border:`1px solid ${color}30` }}>{children}</span>
);
const Pulse = ({ color="#00e5b8" }) => (
  <span style={{ display:"inline-block", width:6, height:6, borderRadius:"50%", background:color, boxShadow:`0 0 6px ${color}`, animation:"pulse 2s infinite" }} />
);

// ── Marketing panel (static) ──────────────────────────────────
function MarketingPanel({ accent, metaConnected, onConnectMeta }) {
  const bars = [
    ["Тунис Summer",  accent,   280, 4200, 85],
    ["Гърция Beach",  "#2563eb",220, 3100, 78],
    ["Египет All-In", "#f97316",180, 1800, 60],
    ["Дубай Luxury",  "#ec4899",160, 2100, 72],
  ];
  const campaigns = [
    ["Тунис Early Bird","Facebook","🟢 Active","CPL €2.80", accent],
    ["Greece Summer 2025","Instagram Reels","🟢 Active","CPL €4.10","#60a5fa"],
    ["Egypt All-Inclusive","Viber Broadcast","🟡 Paused","CPL €3.90","#f59e0b"],
    ["Dubai VIP Package","Google Search","🟢 Active","CPL €6.20","#ec4899"],
  ];
  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
        {[["Cost per Lead","€3.40","↓ 18% vs last month",accent],["Active Campaigns","4","FB · IG · Viber · Google","#60a5fa"],
          ["Ad Spend (Апр)","€840","Budget: €1,000","#f97316"],["ROAS","8.4×","↑ Target: 6×",T.green]].map(([l,v,s,c])=>(
          <div key={l} style={{ background:T.surf, border:`1px solid ${T.border}`, borderRadius:9, padding:12, textAlign:"center" }}>
            <div style={{ fontSize:9, color:T.muted }}>{l}</div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:18, color:c, margin:"4px 0" }}>{v}</div>
            <div style={{ fontSize:9, color:T.muted }}>{s}</div>
          </div>
        ))}
      </div>
      <div style={card()}>
        <div style={cardTitle()}>📊 Ad Spend vs Margin</div>
        {bars.map(([name,c,spend,margin,pct])=>(
          <div key={name} style={{ marginBottom:10 }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, marginBottom:3 }}>
              <span>{name}</span>
              <span style={{ color:T.muted }}>€{spend} → <span style={{ color:T.green }}>€{margin}</span></span>
            </div>
            <div style={{ height:7, background:T.surf, borderRadius:4 }}>
              <div style={{ height:"100%", borderRadius:4, background:c, width:`${pct}%`, transition:"width 0.8s" }} />
            </div>
          </div>
        ))}
      </div>
      <div style={card()}>
        <div style={cardTitle()}>🎯 Active Campaigns</div>
        {campaigns.map(([name,ch,status,cpl,c])=>(
          <div key={name} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 0", borderBottom:`1px solid ${T.border}` }}>
            <div>
              <div style={{ fontSize:11, fontWeight:600 }}>{name}</div>
              <div style={{ fontSize:9, color:T.muted }}>{ch} · {cpl}</div>
            </div>
            <span style={{ fontSize:9, background:`${c}18`, color:c, border:`1px solid ${c}30`, borderRadius:20, padding:"2px 8px", fontWeight:700 }}>{status}</span>
          </div>
        ))}
        <button onClick={onConnectMeta} style={{ marginTop:12, width:"100%", background:T.surf, border:`1px solid ${T.border}`, color:T.text, borderRadius:8, padding:"9px 0", fontSize:11, fontWeight:700, cursor:"pointer" }}>
          🔗 Connect Meta Business Manager
        </button>
        <div style={{ marginTop:6, padding:"8px 12px", background: metaConnected?"rgba(34,197,94,0.08)":T.surf, border:`1px solid ${metaConnected?"rgba(34,197,94,0.3)":T.border}`, borderRadius:8, fontSize:10, color:metaConnected?T.green:T.muted, textAlign:"center" }}>
          {metaConnected ? "✓ Meta Connected · Auto-posting ON" : "⚙️ Meta не е свързан"}
        </div>
      </div>
      <div style={card()}>
        <div style={cardTitle()}>📱 Viber Broadcast Stats</div>
        {[["Изпратени","1,240","#60a5fa"],["Доставени","1,198 (96.6%)",T.green],["Отворени","876 (73.1%)",accent],["Кликнали","312 (35.6%)","#f97316"]].map(([l,v,c])=>(
          <DR key={l} label={l} value={v} vc={c} />
        ))}
      </div>
    </div>
  );
}

// ── MAIN ─────────────────────────────────────────────────────
export default function TravelOSUltimate() {
  const [tenantKey, setTenantKey]       = useState("sunshine");
  const [tab, setTab]                   = useState("agent");
  const [phase, setPhase]               = useState("idle");
  const [status, setStatus]             = useState("inquiry");
  const [messages, setMessages]         = useState([{ id:1, dir:"agent", text:"👋 Здравейте! Аз съм AI асистентът на Sunshine Travel. Как мога да ви помогна? ✈️🌴", time:ts() }]);
  const [logs, setLogs]                 = useState([{ id:1, type:"sys", text:"TravelOS engine ON · Viber · Competitor monitor · Infobip API active", time:ts() }]);
  const [loading, setLoading]           = useState(false);
  const [input, setInput]               = useState("");
  const [history, setHistory]           = useState([]);
  const [offer, setOffer]               = useState(null);
  const [bookingRef, setBookingRef]     = useState(null);
  const [approved, setApproved]         = useState(false);
  const [payState, setPayState]         = useState(null);
  const [voucherDone, setVoucherDone]   = useState(false);
  const [metaConn, setMetaConn]         = useState(false);
  const [showIntake, setShowIntake]     = useState(false);
  const [showMeta, setShowMeta]         = useState(false);
  const [intakeText, setIntakeText]     = useState("");
  const [intakePhone, setIntakePhone]   = useState("+359 88 456 7890");
  const [clock, setClock]               = useState("");

  const msgsRef = useRef(null);
  const idRef   = useRef(20);
  const nextId  = () => ++idRef.current;

  const tenant = TENANTS[tenantKey];
  const acc    = tenant.accent;

  useEffect(() => {
    const iv = setInterval(() => {
      const d = new Date();
      setClock(`${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`);
    }, 1000);
    setClock(() => { const d=new Date(); return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; });
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [messages, loading]);

  const addMsg = useCallback((msg) => setMessages(p => [...p, { id:nextId(), time:ts(), ...msg }]), []);
  const addLog = useCallback((type, text) => setLogs(p => [{ id:nextId(), type, text, time:ts() }, ...p]), []);

  // Switch tenant
  const switchTenant = useCallback((key) => {
    setTenantKey(key);
    const T2 = TENANTS[key];
    setMessages([{ id:nextId(), dir:"agent", text:`👋 Здравейте! Аз съм AI асистентът на ${T2.name}. Как мога да ви помогна?`, time:ts() }]);
    setHistory([]); setPhase("idle"); setStatus("inquiry"); setOffer(null);
    setApproved(false); setPayState(null); setVoucherDone(false);
    addLog("sys", `Tenant → ${T2.name} · Brand Voice активиран`);
  }, [addLog]);

  // System prompt
  const sysPrompt = useCallback(() =>
    `Ти си AI асистент на агенция "${tenant.name}". Отговаряш само на български.
Brand Voice: ${tenant.voice}
Правила: при дестинация → оферта веднага. Завърши с:
OFFER_JSON:{"hotel":"Хотел 5★","destination":"X","checkin":"20 Юли","checkout":"27 Юли","nights":7,"adults":2,"board":"All Inclusive","price":789,"price_total":1578,"comp_price":795,"comp_name":"Booking.com","margin":17.5,"vendor_cost":650,"includes":"полети, трансфер, застраховка"}
Цени/ч: Гърция €400-600, Тунис €600-800, Египет €700-900, Дубай €900-1400, Малдиви €1500-2500, Европа €300-600.
price=comp_price×0.995, price≥vendor_cost×1.03. Преди JSON: 1-2 изречения.`, [tenant]);

  const callAPI = useCallback(async (hist) => {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, system:sysPrompt(), messages:hist })
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const d = await r.json();
    return d.content[0]?.text || "";
  }, [sysPrompt]);

  // Send chat message
  const sendMsg = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    addMsg({ dir:"client", text });
    if (phase === "idle") setPhase("chatting");
    setLoading(true);
    addLog("ai", `Клиент: "${text.substring(0,50)}..." → анализира...`);

    const newHist = [...history, { role:"user", content:text }];
    setHistory(newHist);
    try {
      const reply = await callAPI(newHist);
      const parsed = tryParseOffer(reply);
      if (parsed && !["offer_ready","approved","paid","done"].includes(phase)) {
        const pre = reply.replace(/OFFER_JSON:[\s\S]+$/,"").trim();
        if (pre) addMsg({ dir:"agent", text:pre });
        const ref = genRef();
        setOffer(parsed); setBookingRef(ref);
        setPhase("offer_ready"); setStatus("offer");
        addMsg({ dir:"agent", isOffer:true, offer:parsed, ref });
        setHistory(h => [...h, { role:"assistant", content:`[Оферта: ${parsed.hotel} €${parsed.price}/ч]` }]);
        addLog("ai", `Pricing Engine: ${parsed.hotel} → €${parsed.price}/ч · Марж ${parsed.margin}% ✓`);
        addLog("sys", `CMS sync ✓ · Instagram queued · ${parsed.price_total>=1000?"Bank routing":"Stripe routing"}`);
      } else {
        addMsg({ dir:"agent", text:reply });
        setHistory(h => [...h, { role:"assistant", content:reply }]);
      }
    } catch(e) {
      addMsg({ dir:"agent", text:"⚠️ Временен проблем — опитайте отново." });
      addLog("warn", "API грешка: " + e.message);
    }
    setLoading(false);
  }, [input, loading, phase, history, callAPI, addMsg, addLog]);

  // Phone intake outreach
  const initiateOutreach = useCallback(async () => {
    if (!intakeText.trim()) return;
    setShowIntake(false);
    setLoading(true);
    addLog("sys", `Phone intake: "${intakeText.substring(0,50)}" → AI outreach...`);
    const hist = [{ role:"user", content:`Агентът получи обаждане: "${intakeText}". Генерирай САМО кратко потвърдително Viber съобщение (2-3 изречения, без оферта).` }];
    try {
      const reply = await callAPI(hist);
      addMsg({ dir:"agent", text:reply });
      setHistory([{ role:"assistant", content:reply }]);
      if (phase === "idle") setPhase("chatting");
      addLog("sys", `Viber outreach изпратен към ${intakePhone} ✓`);
    } catch(e) {
      addMsg({ dir:"agent", text:"👋 Получихме вашето запитване! Ще се свържем скоро с оферта. ✈️" });
      addLog("warn", "Outreach API грешка: " + e.message);
    }
    setLoading(false);
    setIntakeText("");
  }, [intakeText, intakePhone, callAPI, addMsg, addLog, phase]);

  const agentApprove = useCallback(() => {
    if (phase !== "offer_ready" || approved) return;
    setApproved(true); setPhase("approved"); setStatus("payment");
    addLog("sys", `Агент одобри ${bookingRef}. ${offer?.price_total>=1000?"Bank transfer инструкции":"Stripe Payment Link"} генериран.`);
    addMsg({ dir:"agent", text:`✅ Резервацията е потвърдена!\n${offer?.price_total>=1000?`🏦 Моля преведете €${offer.price_total} по:\nIBAN: BG80 UNCR 9660 1011 3424 01\nОснование: ${bookingRef}`:"💳 Натиснете бутона в офертата за плащане."}` });
  }, [phase, approved, bookingRef, offer, addLog, addMsg]);

  const clientPay = useCallback(() => {
    if (phase !== "approved") {
      addMsg({ dir:"agent", text:"⚠️ Резервацията трябва да бъде одобрена от агент преди плащане." });
      addLog("warn", "Financial Shield: Плащане без одобрение — блокирано.");
      return;
    }
    setPayState("processing");
    const isBank = offer?.price_total >= 1000;
    addLog("pay", `${isBank?"Bank Transfer initiated":"Stripe checkout.session.created"} · ${bookingRef}`);
    setTimeout(() => {
      setPayState("paid"); setPhase("paid"); setStatus("paid");
      addLog("pay", `${isBank?"Bank webhook: transfer confirmed":"Stripe: payment_intent.succeeded"} · €${offer?.price_total} ✓`);
      addLog("ok", "Financial Shield: Payment verified ✓ Ваучер отключен.");
      addMsg({ dir:"agent", text:`✅ Плащането е получено!\n🎫 Ваучер: ${bookingRef}\nПриятно пътуване! ✈️🌴` });
      setTimeout(() => {
        setVoucherDone(true); setPhase("done"); setStatus("voucher");
        addLog("ok", `Ваучер ${bookingRef} генериран и изпратен в Viber ✓`);
      }, 600);
    }, 1800);
  }, [phase, offer, bookingRef, addMsg, addLog]);

  // Step pills
  const cur = PHASE_IDX[phase] || 0;

  // ── RENDER ────────────────────────────────────────────────
  return (
    <div style={{ height:"100vh", display:"flex", flexDirection:"column", background:T.bg, color:T.text, fontFamily:"'Mulish',sans-serif", overflow:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=JetBrains+Mono:wght@400;500&family=Mulish:wght@400;500;600&display=swap');
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes msgIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:none}}
        @keyframes slideIn{from{opacity:0;transform:translateX(8px)}to{opacity:1;transform:none}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:2px}
        input,textarea{outline:none}
      `}</style>

      {/* ── TOPBAR ── */}
      <div style={{ background:T.surf, borderBottom:`1px solid ${T.border}`, padding:"0 16px", height:50, display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
        <div style={{ width:28, height:28, borderRadius:7, background:`linear-gradient(135deg,${acc},${tenant.accent2})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, flexShrink:0 }}>
          {tenant.icon}
        </div>
        <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:14, whiteSpace:"nowrap" }}>{tenant.name}</span>
        <div style={{ width:1, height:20, background:T.border, flexShrink:0 }} />
        <select value={tenantKey} onChange={e=>switchTenant(e.target.value)} style={{ background:T.surf2, border:`1px solid ${T.border}`, color:T.text, fontFamily:"'Mulish',sans-serif", fontSize:11, padding:"4px 8px", borderRadius:7, cursor:"pointer" }}>
          <option value="sunshine">✈️ Sunshine Travel</option>
          <option value="balkan">🏔️ Balkan Tours</option>
          <option value="prima">🌊 Prima Holidays</option>
        </select>
        <div style={{ width:1, height:20, background:T.border, flexShrink:0 }} />
        {/* Step pills */}
        <div style={{ display:"flex", alignItems:"center", gap:4, flex:1, justifyContent:"center", flexWrap:"wrap" }}>
          {STEPS.map((s,i) => (
            <span key={s} style={{ background: i<cur?`${T.green}10`:i===cur?`${acc}10`:T.surf2, border:`1px solid ${i<cur?"rgba(34,197,94,.35)":i===cur?acc:T.border}`, borderRadius:20, padding:"3px 10px", fontSize:9, color:i<cur?T.green:i===cur?acc:T.muted, whiteSpace:"nowrap" }}>
              {i<cur?"✓ ":""}{s}
            </span>
          ))}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:10, color:T.muted, flexShrink:0 }}>
          <Pulse color={acc} /><span style={{ color:acc, fontWeight:700 }}>AI Engine</span>
        </div>
      </div>

      {/* ── MAIN GRID ── */}
      <div style={{ flex:1, display:"grid", gridTemplateColumns:"272px 1fr 280px", overflow:"hidden" }}>

        {/* ── PHONE ── */}
        <div style={{ borderRight:`1px solid ${T.border}`, display:"flex", flexDirection:"column", alignItems:"center", padding:"14px 12px", gap:10, overflow:"hidden" }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:9, fontWeight:700, color:T.muted, letterSpacing:"0.1em", textTransform:"uppercase", alignSelf:"flex-start" }}>💬 Viber канал</div>
          <div style={{ width:248, flex:1, minHeight:0, background:"#12112a", borderRadius:26, border:"4px solid #252340", overflow:"hidden", display:"flex", flexDirection:"column", boxShadow:"0 16px 40px rgba(0,0,0,.6)" }}>
            <div style={{ background:"#252340", height:18, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:7, color:"rgba(255,255,255,.15)" }}>{clock} ● ● ●</div>
            {/* Phone header */}
            <div style={{ background:T.viber, padding:"8px 10px", flexShrink:0, display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:28, height:28, borderRadius:"50%", background:"rgba(255,255,255,.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, flexShrink:0 }}>{tenant.icon}</div>
              <div>
                <div style={{ fontSize:11, fontWeight:700 }}>{tenant.name}</div>
                <div style={{ fontSize:8, opacity:.65 }}>AI Асистент · Viber Business</div>
              </div>
              <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:3, background:"rgba(255,255,255,.15)", borderRadius:20, padding:"2px 6px", fontSize:8, whiteSpace:"nowrap" }}>
                <div style={{ width:4, height:4, borderRadius:"50%", background:"#4ade80" }} />
                <span style={{ fontWeight:700 }}>Infobip</span>
                <span style={{ color:"#4ade80" }}>✓</span>
              </div>
            </div>
            {/* Messages */}
            <div ref={msgsRef} style={{ flex:1, overflowY:"auto", padding:"9px 7px", display:"flex", flexDirection:"column", gap:7, background:"#141424" }}>
              {messages.map(m => <PhoneMsg key={m.id} m={m} tenant={tenant} onPay={clientPay} payState={payState} />)}
              {loading && (
                <div style={{ alignSelf:"flex-start", background:"#2a284e", borderRadius:12, padding:"8px 11px", display:"flex", gap:4, animation:"msgIn .3s" }}>
                  {[0,.2,.4].map((d,i) => <span key={i} style={{ width:5, height:5, background:"rgba(255,255,255,.4)", borderRadius:"50%", display:"inline-block", animation:`pulse 1.2s ${d}s infinite` }} />)}
                </div>
              )}
            </div>
            {/* Input */}
            <div style={{ padding:"7px 8px", background:"#1a1838", borderTop:"1px solid rgba(255,255,255,.06)", display:"flex", gap:5, alignItems:"center", flexShrink:0 }}>
              <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendMsg()}
                placeholder="Напишете съобщение..."
                disabled={loading}
                style={{ flex:1, background:"#252344", border:`1px solid rgba(255,255,255,.08)`, borderRadius:17, padding:"6px 10px", color:"#fff", fontSize:10, fontFamily:"'Mulish',sans-serif", opacity:loading?.5:1 }} />
              <button onClick={sendMsg} disabled={loading||!input.trim()} style={{ width:28, height:28, borderRadius:"50%", background:T.viber, border:"none", color:"white", cursor:loading?"default":"pointer", fontSize:12, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, opacity:(loading||!input.trim())?.4:1 }}>➤</button>
            </div>
          </div>
          <div style={{ fontSize:9, color:T.muted, textAlign:"center", lineHeight:1.7 }}>
            Клиентът пише тук · AI отговаря live<br/><span style={{ color:acc }}>"Искам Тунис за 2-ма юли"</span>
          </div>
        </div>

        {/* ── CENTER ── */}
        <div style={{ borderRight:`1px solid ${T.border}`, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          {/* Tabs */}
          <div style={{ display:"flex", borderBottom:`1px solid ${T.border}`, flexShrink:0, background:T.surf }}>
            {[["agent","🖥️ Agent Panel"],["marketing","📊 Marketing"]].map(([id,label])=>(
              <div key={id} onClick={()=>setTab(id)} style={{ padding:"11px 18px", fontSize:11, fontWeight:600, cursor:"pointer", color:tab===id?acc:T.muted, borderBottom:`2px solid ${tab===id?acc:"transparent"}`, background:tab===id?`${acc}06`:"transparent", transition:"all .2s" }}>{label}</div>
            ))}
          </div>
          <div style={{ flex:1, overflowY:"auto", padding:14 }}>
            {tab === "agent" ? (
              <AgentPanel offer={offer} offer2={{ offer, bookingRef, status, approved, payState, voucherDone, phase }}
                onOpenIntake={()=>setShowIntake(true)} onApprove={agentApprove} accent={acc} />
            ) : (
              <MarketingPanel accent={acc} metaConnected={metaConn} onConnectMeta={()=>setShowMeta(true)} />
            )}
          </div>
        </div>

        {/* ── LOG ── */}
        <div style={{ display:"flex", flexDirection:"column", overflow:"hidden" }}>
          <div style={{ padding:"12px 14px", borderBottom:`1px solid ${T.border}`, flexShrink:0, fontFamily:"'Syne',sans-serif", fontSize:11, fontWeight:700, display:"flex", alignItems:"center", gap:7 }}>
            <Pulse color={acc} /> Live System Log
          </div>
          <div style={{ flex:1, overflowY:"auto", padding:"8px 10px", display:"flex", flexDirection:"column", gap:6 }}>
            {logs.map(l => (
              <div key={l.id} style={{ background:T.surf2, borderRadius:7, padding:"8px 10px", borderLeft:`2px solid ${LOG_COLS[l.type]||T.border}`, animation:"slideIn .3s", fontSize:10 }}>
                <div style={{ fontSize:7, letterSpacing:"0.12em", color:T.muted, textTransform:"uppercase", marginBottom:2 }}>{LOG_LABELS[l.type]||l.type}</div>
                <div style={{ color:T.text, lineHeight:1.5 }}>{l.text}</div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"rgba(255,255,255,.18)", marginTop:2 }}>днес, {l.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── PHONE INTAKE MODAL ── */}
      {showIntake && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.8)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, animation:"fadeIn .2s" }}>
          <div style={{ background:T.surf, border:`1px solid ${T.border}`, borderRadius:14, padding:24, width:420, boxShadow:"0 20px 60px rgba(0,0,0,.5)" }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:16, marginBottom:6 }}>📞 Log Phone Inquiry</div>
            <div style={{ fontSize:12, color:T.muted, marginBottom:14, lineHeight:1.6 }}>Въведете резюме на обаждането. AI ще изпрати първото Viber съобщение автоматично.</div>
            <textarea value={intakeText} onChange={e=>setIntakeText(e.target.value)} placeholder="Клиент звъни — иска 5 нощувки Рим, бюджет €1500, май, 2 човека..." style={{ width:"100%", background:T.surf2, border:`1px solid ${T.border}`, borderRadius:8, padding:"10px 12px", color:T.text, fontSize:11, fontFamily:"'Mulish',sans-serif", resize:"vertical", minHeight:80 }} />
            <div style={{ marginTop:10 }}>
              <div style={{ fontSize:10, color:T.muted, marginBottom:4 }}>Viber номер</div>
              <input value={intakePhone} onChange={e=>setIntakePhone(e.target.value)} style={{ width:"100%", background:T.surf2, border:`1px solid ${T.border}`, borderRadius:7, padding:"8px 10px", color:T.text, fontSize:11, fontFamily:"'Mulish',sans-serif" }} />
            </div>
            <div style={{ display:"flex", gap:8, marginTop:14 }}>
              <button onClick={initiateOutreach} style={{ flex:1, background:acc, color:"#000", border:"none", borderRadius:8, padding:"10px 0", fontSize:12, fontWeight:800, cursor:"pointer", fontFamily:"'Syne',sans-serif" }}>🚀 Initiate AI Outreach</button>
              <button onClick={()=>setShowIntake(false)} style={{ background:T.surf2, border:`1px solid ${T.border}`, color:T.text, borderRadius:8, padding:"10px 14px", fontSize:12, cursor:"pointer" }}>✕</button>
            </div>
          </div>
        </div>
      )}

      {/* ── META MODAL ── */}
      {showMeta && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.8)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, animation:"fadeIn .2s" }}>
          <div style={{ background:T.surf, border:`1px solid ${T.border}`, borderRadius:14, padding:24, width:400, boxShadow:"0 20px 60px rgba(0,0,0,.5)" }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:16, marginBottom:6 }}>🔗 Connect Meta Business Manager</div>
            <div style={{ fontSize:12, color:T.muted, marginBottom:14, lineHeight:1.6 }}>Свържете Meta акаунта за автоматично пускане на реклами.</div>
            <div style={card()}>
              {[["Business ID","1234567890"],["Ad Account","act_9876543210"],["Pixel ID","345678901234"],["Access Level","Admin ✓"]].map(([l,v])=><DR key={l} label={l} value={v} />)}
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>{ setMetaConn(true); setShowMeta(false); addLog("mkt","Meta Business Manager свързан ✓ Auto-post активиран"); }} style={{ flex:1, background:acc, color:"#000", border:"none", borderRadius:8, padding:"10px 0", fontSize:12, fontWeight:800, cursor:"pointer", fontFamily:"'Syne',sans-serif" }}>✓ Authorize & Connect</button>
              <button onClick={()=>setShowMeta(false)} style={{ background:T.surf2, border:`1px solid ${T.border}`, color:T.text, borderRadius:8, padding:"10px 14px", fontSize:12, cursor:"pointer" }}>✕</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Phone Message ─────────────────────────────────────────────
function PhoneMsg({ m, tenant, onPay, payState }) {
  if (m.isOffer && m.offer) {
    const o = m.offer;
    const isBank = o.price_total >= 1000;
    const btnBg = payState==="paid"?"#22c55e":payState==="processing"?"#555":isBank?"linear-gradient(135deg,#1a4fa8,#003087)":"linear-gradient(135deg,#635bff,#4f46e5)";
    const btnTxt = payState==="paid"?"✅ Платено!":payState==="processing"?"⏳ Обработва се...":isBank?"🏦 Bank Transfer (0% fee) — UniCredit":"💳 Плати с карта / Apple Pay";
    return (
      <div style={{ alignSelf:"flex-start", maxWidth:"94%", animation:"msgIn .3s" }}>
        <div style={{ background:"#1e1c3a", border:"1px solid rgba(115,96,242,.35)", borderRadius:12, padding:11, fontSize:11 }}>
          <div style={{ fontWeight:700, fontSize:12, marginBottom:4 }}>🏨 {o.hotel}</div>
          <div style={{ fontSize:9, color:"rgba(255,255,255,.4)", marginBottom:6 }}>{o.destination} · {o.checkin}–{o.checkout} · {o.adults} възр. · {o.board}</div>
          <div style={{ display:"flex", alignItems:"baseline", gap:5, marginBottom:4 }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:20, color:"#00e5b8" }}>€{o.price}</span>
            <span style={{ fontSize:9, color:"rgba(255,255,255,.3)" }}>на човек</span>
            <span style={{ fontSize:9, color:"rgba(255,255,255,.25)", textDecoration:"line-through" }}>€{o.comp_price}</span>
          </div>
          <span style={{ fontSize:8, background:"rgba(0,229,184,.12)", color:"#00e5b8", borderRadius:20, padding:"2px 7px", display:"inline-block", marginBottom:6 }}>Спестявате €{Math.round((o.comp_price-o.price)*o.adults)}</span>
          <div style={{ fontSize:9, color:"rgba(255,255,255,.4)", lineHeight:1.7, marginBottom:8 }}>💰 Общо: <strong style={{ color:"#00e5b8" }}>€{o.price_total}</strong> · ✦ {o.includes}</div>
          <button onClick={onPay} disabled={!!payState} style={{ width:"100%", border:"none", borderRadius:8, padding:10, fontSize:11, fontWeight:700, cursor:payState?"default":"pointer", background:btnBg, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>{btnTxt}</button>
          {isBank && <div style={{ fontSize:8, color:"rgba(255,255,255,.3)", textAlign:"center", marginTop:4 }}>IBAN: BG80 UNCR 9660 1011 3424 01 · €{o.price_total}</div>}
        </div>
        <div style={{ fontSize:8, color:"rgba(255,255,255,.22)", marginTop:2, paddingLeft:3 }}>{tenant.name} · {m.time}</div>
        <div style={{ fontSize:7, color:"rgba(255,255,255,.15)", paddingLeft:3, display:"flex", alignItems:"center", gap:3 }}>⚡ Sent via Infobip API · offer_message</div>
      </div>
    );
  }
  const isClient = m.dir === "client";
  return (
    <div style={{ alignSelf:isClient?"flex-end":"flex-start", maxWidth:"85%", animation:"msgIn .3s" }}>
      <div style={{ padding:"8px 10px", borderRadius:12, fontSize:11, lineHeight:1.55, whiteSpace:"pre-wrap", background:isClient?"#7360f2":"#2a284e", borderBottomRightRadius:isClient?3:12, borderBottomLeftRadius:isClient?12:3 }}>{m.text}</div>
      <div style={{ fontSize:8, color:"rgba(255,255,255,.22)", marginTop:2, padding:"0 3px", textAlign:isClient?"right":"left" }}>{isClient?"Вие":tenant.name} · {m.time}</div>
      {!isClient && <div style={{ fontSize:7, color:"rgba(255,255,255,.15)", paddingLeft:3 }}>⚡ Sent via Infobip API</div>}
    </div>
  );
}

// ── Agent Panel ───────────────────────────────────────────────
function AgentPanel({ offer2, onOpenIntake, onApprove, accent }) {
  const { offer, bookingRef, status, approved, payState, voucherDone } = offer2;
  const sfIdx = SF_NODES.indexOf(status);
  return (
    <div>
      {/* Phone intake */}
      <div style={{ ...card(), borderColor:"rgba(249,115,22,.25)", background:"rgba(249,115,22,.04)" }}>
        <div style={cardTitle()}>📞 Manual Lead Intake</div>
        <div style={{ fontSize:11, color:T.muted, marginBottom:10, lineHeight:1.6 }}>Агент получи телефонно обаждане? AI изпраща първото Viber съобщение автоматично.</div>
        <button onClick={onOpenIntake} style={{ width:"100%", background:T.surf, border:`1px solid ${T.border}`, color:T.text, borderRadius:8, padding:"9px 0", fontSize:11, fontWeight:700, cursor:"pointer" }}>📞 Log Phone Inquiry → AI Outreach</button>
      </div>
      {/* Status flow */}
      <div style={card()}>
        <div style={cardTitle()}>Статус машина</div>
        <div style={{ display:"flex", alignItems:"center", gap:3, flexWrap:"wrap" }}>
          {SF_NODES.map((n,i) => [
            <div key={n} style={{ background:i<sfIdx?`${T.green}10`:i===sfIdx?`${accent}10`:T.surf, border:`1px solid ${i<sfIdx?"rgba(34,197,94,.35)":i===sfIdx?accent:T.border}`, borderRadius:5, padding:"4px 8px", fontSize:9, color:i<sfIdx?T.green:i===sfIdx?accent:T.muted, transition:"all .35s" }}>{SF_LABELS[n]}</div>,
            i<SF_NODES.length-1 && <span key={"a"+i} style={{ fontSize:9, color:T.border }}>→</span>
          ])}
        </div>
      </div>
      {/* Booking details */}
      {offer && <>
        <div style={card()}>
          <div style={cardTitle()}>Детайли на резервацията</div>
          <DR label="Ref" value={bookingRef} vc={accent} />
          <DR label="Хотел" value={offer.hotel} />
          <DR label="Период" value={`${offer.checkin}–${offer.checkout} (${offer.nights}н)`} />
          <DR label="Пансион" value={offer.board} />
          <DR label="Обща сума" value={`€${offer.price_total}`} vc={accent} />
          <DR label="Марж" value={`€${Math.round(offer.price_total-offer.vendor_cost*offer.adults)} (${offer.margin}%)`} vc={T.green} />
          <DR label={`vs ${offer.comp_name}`} value={`-€${Math.round((offer.comp_price-offer.price)*offer.adults)} ✓`} vc={accent} />
          {offer.price_total>=1000 && <DR label="Плащане" value="🏦 Банков превод" vc="#60a5fa" />}
        </div>
        {/* Engine */}
        <div style={card()}>
          <div style={cardTitle()}>⚙️ Pricing Engine</div>
          <div style={{ display:"flex", alignItems:"center", gap:5 }}>
            {[{l:"Вендор",v:`€${offer.vendor_cost}`},{arrow:true},{l:"Min марж",v:`€${Math.round(offer.vendor_cost*1.03)}`,hi:"warn"},{arrow:true},{l:"Нашата цена",v:`€${offer.price}`,hi:"acc"}].map((b,i)=>
              b.arrow ? <span key={i} style={{ color:T.muted, fontSize:11 }}>→</span>
              : <div key={i} style={{ flex:1, background:b.hi==="acc"?`${accent}08`:b.hi==="warn"?"rgba(249,115,22,.06)":T.surf, border:`1px solid ${b.hi==="acc"?accent:b.hi==="warn"?"#f97316":T.border}`, borderRadius:7, padding:"7px 5px", textAlign:"center" }}>
                  <div style={{ fontSize:8, color:T.muted, marginBottom:2 }}>{b.l}</div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, color:b.hi==="acc"?accent:b.hi==="warn"?"#f97316":T.text }}>{b.v}</div>
                </div>
            )}
          </div>
          <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginTop:8 }}>
            <Tag color={accent}>🤖 -0.5% від {offer.comp_name}</Tag>
            <Tag color="#60a5fa">📱 CMS sync</Tag>
            <Tag color="#60a5fa">📣 Instagram queued</Tag>
            {offer.price_total>=1000 && <Tag color="#f97316">🏦 Bank routing</Tag>}
          </div>
        </div>
        <button onClick={onApprove} disabled={approved} style={{ width:"100%", background:approved?"#1c2e25":accent, color:approved?"#2d6a4f":"#000", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:13, border:"none", borderRadius:10, padding:12, cursor:approved?"default":"pointer", marginBottom:12, display:"flex", alignItems:"center", justifyContent:"center", gap:6, transition:"all .2s" }}>
          {approved ? "✓ Изпратено на клиента!" : "✓ Одобри и изпрати на клиента"}
        </button>
      </>}
      {/* Shield */}
      <div style={card()}>
        <div style={cardTitle()}>🛡️ Financial Shield</div>
        {[["Ваучер без плащане", voucherDone?"Издаден ✓":payState==="paid"?"Отключен ✓":"— блокиран", voucherDone||payState==="paid"],
          ["Stripe / Bank Webhook","Активен ✓",true],
          ["Марж проверка", offer?`${offer.margin}% ✓`:"— чака", !!offer],
          ["Ликвидност до 15-о","€5,600 OK",true],
          ["Плащане получено", payState==="paid"?"Потвърдено ✓":"— чака", payState==="paid"]
        ].map(([l,v,ok]) => (
          <div key={l} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"5px 0", borderBottom:`1px solid rgba(255,255,255,.04)`, fontSize:11 }}>
            <span style={{ color:T.muted }}>{l}</span>
            <span style={{ fontWeight:700, color:ok?T.green:T.muted }}>{v}</span>
          </div>
        ))}
      </div>
      {/* Voucher */}
      {voucherDone && offer && (
        <div style={{ ...card(), background:"linear-gradient(135deg,rgba(0,229,184,.06),rgba(37,99,235,.06))", borderColor:"rgba(0,229,184,.3)" }}>
          <div style={cardTitle("#00e5b8")}>🎫 Ваучер издаден</div>
          <DR label="Ref" value={bookingRef} vc="#00e5b8" />
          <DR label="Хотел" value={offer.hotel} />
          <DR label="Сума" value={`€${offer.price_total} ✓`} vc={T.green} />
          <DR label="Статус" value="VOUCHER_ISSUED" vc={T.green} />
          <div style={{ textAlign:"center", fontSize:9, color:T.muted, marginTop:8 }}>Изпратен в Viber автоматично ✓</div>
        </div>
      )}
      {!offer && <div style={{ color:T.muted, fontSize:11, textAlign:"center", padding:20, lineHeight:1.8 }}>← Изчаква запитване<br/><span style={{ color:accent, fontSize:10 }}>Панелът се попълва автоматично</span></div>}
    </div>
  );
}
