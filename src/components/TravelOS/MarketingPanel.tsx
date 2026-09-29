import { T, card, cardTitle } from "./tokens";
import { DR, Tag } from "./shared";
import { 
  BarChart3, Target, Share2, MousePointer2, 
  Linkedin, Facebook, Smartphone, Zap, CheckCircle2 
} from "lucide-react";

interface Props {
  accent: string;
  metaConnected: boolean;
  onConnectMeta: () => void;
}

export function MarketingPanel({ accent, metaConnected = true, onConnectMeta }: Props) {
  const cardStyle = { ...card(), marginBottom: 20 };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", paddingBottom: 50 }}>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 800 }}>📊 Marketing & Growth</div>
          <div style={{ fontSize: 12, color: T.muted }}>ROI проследяване и автоматизирани B2B кампании</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
           <div style={{ fontSize: 10, background: `${accent}15`, color: accent, padding: "5px 12px", borderRadius: 20, fontWeight: 700, border: `1px solid ${accent}30` }}>
             META CAPI: CONNECTED ✓
           </div>
        </div>
      </div>

      {/* KPI GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 15, marginBottom: 20 }}>
        <KpiBox label="Cost per Lead (B2B)" val="€12.40" delta="↓ 8%" deltaCol={T.green} />
        <KpiBox label="Active Campaigns" val="4" delta="FB · LI · G" deltaCol={T.muted} />
        <KpiBox label="Ad Spend (Юни)" val="€1,250" delta="Бюджет: €2k" deltaCol={T.muted} />
        <KpiBox label="ROAS (ROI)" val="8.2x" delta="↑ Target: 6x" deltaCol={T.green} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: 20 }}>
        
        {/* АКТИВНИ КАМПАНИИ */}
        <div>
          <div style={cardStyle}>
            <div style={{ ...cardTitle(), display: "flex", alignItems: "center", gap: 8 }}>
              <Target size={16} /> АКТИВНИ B2B КАМПАНИИ
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <CampaignRow 
                name="ABV OOD Corporate Awareness" 
                channel="LinkedIn" 
                status="Active" 
                spend="€420" 
                leads="12" 
                color="#0a66c2" 
              />
              <CampaignRow 
                name="Munich Expo 2025 Early Bird" 
                channel="Facebook / IG" 
                status="Active" 
                spend="€280" 
                leads="45" 
                color="#1877f2" 
              />
              <CampaignRow 
                name="SME Business Travel - BG" 
                channel="Google Search" 
                status="Paused" 
                spend="€150" 
                leads="8" 
                color="#ea4335" 
              />
            </div>
            <button 
              onClick={onConnectMeta}
              style={{ width: "100%", marginTop: 20, background: accent, color: "#000", border: "none", padding: "12px", borderRadius: 10, fontWeight: 800, cursor: "pointer", fontFamily: "'Syne',sans-serif" }}
            >
              🔗 Connect New Ad Account
            </button>
          </div>

          <div style={cardStyle}>
            <div style={{ ...cardTitle(), display: "flex", alignItems: "center", gap: 8 }}>
              <Zap size={16} /> AI АВТОМАТИЗАЦИЯ (META CAPI)
            </div>
            <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.6, marginBottom: 15 }}>
              Системата автоматично изпраща „Purchase“ събитие към Facebook Pixel, когато Хриси потвърди плащането в Shield панела. Това оптимизира рекламата Ви за реални продажби, а не просто кликове.
            </div>
            <div style={{ background: T.surf2, padding: 12, borderRadius: 10, display: "flex", alignItems: "center", gap: 10 }}>
               <CheckCircle2 size={18} color={T.green} />
               <div style={{ fontSize: 11 }}>
                  <strong>Server-side Tracking Active</strong> <br/>
                  <span style={{ opacity: 0.6 }}>Успешно подадени 14 конверсии за последните 24ч.</span>
               </div>
            </div>
          </div>
        </div>

        {/* СТАТИСТИКА КАНАЛИ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={cardStyle}>
            <div style={cardTitle()}>ПРИХОДИ ПО КАНАЛИ</div>
            <ChannelStat label="Direct / Repeat" val="€8,400" pct={65} col={accent} />
            <ChannelStat label="Social Ads" val="€3,200" pct={25} col="#1877f2" />
            <ChannelStat label="Email Ingestion" val="€1,200" pct={10} col="#f59e0b" />
          </div>

          <div style={cardStyle}>
            <div style={{ ...cardTitle(), display: "flex", alignItems: "center", gap: 8 }}>
              <Smartphone size={16} /> VIBER BROADCAST
            </div>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 10 }}>Последно съобщение: Мюнхен Експо Early Bird</div>
            <DR label="Изпратени" value="1,240" />
            <DR label="Отворени" value="876 (71%)" vc={accent} />
            <DR label="Кликнали" value="312 (36%)" vc="#f59e0b" />
          </div>
        </div>

      </div>
    </div>
  );
}

// ПОМОЩНИ КОМПОНЕНТИ
function KpiBox({ label, val, delta, deltaCol }: any) {
  return (
    <div style={{ background: T.surf, border: `1px solid ${T.border}`, padding: 15, borderRadius: 12, textAlign: "center" }}>
      <div style={{ fontSize: 10, color: T.muted, marginBottom: 5, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 5 }}>{val}</div>
      <div style={{ fontSize: 10, fontWeight: 700, color: deltaCol }}>{delta}</div>
    </div>
  );
}

function CampaignRow({ name, channel, status, spend, leads, color }: any) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", background: T.surf2, borderRadius: 10 }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700 }}>{name}</div>
        <div style={{ fontSize: 10, color: T.muted }}>{channel} · {leads} leads</div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 11, fontWeight: 700 }}>{spend}</div>
        <Tag color={status === "Active" ? T.green : T.red}>{status}</Tag>
      </div>
    </div>
  );
}

function ChannelStat({ label, val, pct, col }: any) {
  return (
    <div style={{ marginBottom: 15 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 5 }}>
        <span>{label}</span>
        <span style={{ fontWeight: 700 }}>{val}</span>
      </div>
      <div style={{ height: 6, background: T.border, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: col }} />
      </div>
    </div>
  );
}
