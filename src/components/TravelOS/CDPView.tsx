import { T, card, cardTitle } from "./tokens";
import { DR, Tag } from "./shared";
import { Building2, Users, FileText, History, ShieldAlert, Award } from "lucide-react";

interface Props {
  accent: string;
}

// Тези данни AI ще използва, за да попълва автоматично ППП и оферти
export const ABV_PROFILE = {
  name: "АБВ ООД",
  vat: "BG201234567",
  address: "гр. София, бул. Витоша 100",
  contact: "Петър Петров (Финансов директор)",
  email: "finance@abv-ood.bg",
  policy: {
    maxBG: 60,
    maxIntl: 120,
    requiresParking: true,
    requiresBreakfast: true,
    classCEO: "Business",
    classStaff: "Economy"
  }
};

export function CDPView({ accent }: Props) {
  const cardStyle = { ...card(), marginBottom: 20 };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", paddingBottom: 50 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 800 }}>👥 Customer Data Platform (CDP)</div>
        <div style={{ fontSize: 12, color: T.muted }}>Управление на корпоративни профили и Travel политики</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "350px 1fr", gap: 20 }}>
        
        {/* ЛЯВА КОЛОНА: ФИРМЕН ПРОФИЛ */}
        <div>
          <div style={cardStyle}>
            <div style={{ ...cardTitle(accent), display: "flex", alignItems: "center", gap: 8 }}>
              <Building2 size={16} /> ДАННИ ЗА ФИРМАТА
            </div>
            <div style={{ marginBottom: 15 }}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{ABV_PROFILE.name}</div>
              <div style={{ fontSize: 11, color: T.muted }}>Corporate Client since 2022</div>
            </div>
            <DR label="ЕИК / ДДС" value={ABV_PROFILE.vat} />
            <DR label="Адрес" value="София, Витоша 100" />
            <DR label="Лице за контакт" value={ABV_PROFILE.contact} />
            <DR label="Кредитен лимит" value="€5,000" vc={T.green} />
            <button style={{ width: "100%", marginTop: 15, background: T.surf2, border: `1px solid ${T.border}`, color: T.text, padding: "8px", borderRadius: 8, fontSize: 11, cursor: "pointer" }}>
              Промени данни
            </button>
          </div>

          <div style={{ ...cardStyle, borderLeft: `4px solid ${accent}` }}>
            <div style={{ ...cardTitle(accent), display: "flex", alignItems: "center", gap: 8 }}>
              <ShieldAlert size={16} /> TRAVEL POLICY
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ background: T.surf2, padding: 10, borderRadius: 8 }}>
                <div style={{ fontSize: 9, color: T.muted, marginBottom: 4 }}>МАКС. БЮДЖЕТ (НОЩУВКА)</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                   <span style={{ fontSize: 12 }}>България: <strong>€60</strong></span>
                   <span style={{ fontSize: 12 }}>Чужбина: <strong>€120</strong></span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <Tag color={accent}>🅿️ Задължителен паркинг</Tag>
                <Tag color={accent}>🍳 Задължителна закуска</Tag>
                <Tag color="#a855f7">🚫 Без ROH стаи</Tag>
                <Tag color="#60a5fa">✈️ Самолети: Economy</Tag>
              </div>
            </div>
          </div>
        </div>

        {/* ДЯСНА КОЛОНА: СЛУЖИТЕЛИ И ИСТОРИЯ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          
          {/* СЕКЦИЯ СЛУЖИТЕЛИ */}
          <div style={cardStyle}>
            <div style={{ ...cardTitle(), display: "flex", alignItems: "center", gap: 8 }}>
              <Users size={16} /> СЛУЖИТЕЛИ (TRAVELERS)
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}`, textAlign: "left" }}>
                  <th style={{ padding: "10px", fontSize: 10, color: T.muted }}>ИМЕ</th>
                  <th style={{ padding: "10px", fontSize: 10, color: T.muted }}>СТАТУТ</th>
                  <th style={{ padding: "10px", fontSize: 10, color: T.muted }}>ЛИМИТ / КЛАС</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: 12 }}>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: "12px 10px" }}><strong>Иван Георгиев</strong></td>
                  <td style={{ padding: "12px 10px" }}><span style={{ color: "#a855f7", fontWeight: 700 }}>CEO</span></td>
                  <td style={{ padding: "12px 10px" }}>Без лимит / Business Class</td>
                </tr>
                <tr style={{ borderBottom: `1px solid ${T.border}`, background: `${accent}05` }}>
                  <td style={{ padding: "12px 10px" }}><strong>Даниел Каменов</strong></td>
                  <td style={{ padding: "12px 10px" }}><span style={{ color: accent, fontWeight: 700 }}>Manager</span></td>
                  <td style={{ padding: "12px 10px" }}>€120 / Economy Premium</td>
                </tr>
                <tr>
                  <td style={{ padding: "12px 10px" }}><strong>Камен Петров</strong></td>
                  <td style={{ padding: "12px 10px" }}><span style={{ color: "#60a5fa", fontWeight: 700 }}>Specialist</span></td>
                  <td style={{ padding: "12px 10px" }}>€60 / Economy</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ИСТОРИЯ И ЦИКЛИЧНОСТ */}
          <div style={cardStyle}>
            <div style={{ ...cardTitle(), display: "flex", alignItems: "center", gap: 8 }}>
              <History size={16} /> ИСТОРИЯ И ПРЕДСКАЗАНИЯ
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
               <div style={{ background: T.surf2, padding: 12, borderRadius: 10, border: `1px solid ${T.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <Tag color="#f59e0b">🚩 ПРЕДСТОЯЩО</Tag>
                    <span style={{ fontSize: 9, color: T.muted }}>СЕПТЕМВРИ</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Мюнхен Експо</div>
                  <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>
                    Пътуващ: <strong>Камен Петров</strong> <br/>
                    AI предвижда заявка след 15 дни.
                  </div>
               </div>

               <div style={{ background: T.surf2, padding: 12, borderRadius: 10, border: `1px solid ${T.border}`, opacity: 0.6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <Tag color={T.green}>✅ ПРИКЛЮЧЕНО</Tag>
                    <span style={{ fontSize: 9, color: T.muted }}>ОКТОМВРИ 2024</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Букурещ Бизнес</div>
                  <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>
                    Хотел: <strong>Capital Hotel</strong> <br/>
                    Бележка: "Клиентът се оплака от шум."
                  </div>
               </div>
            </div>
          </div>

          {/* АВТОМАТИЧНИ ДОКУМЕНТИ (ТЕМПЛЕЙТИ) */}
          <div style={cardStyle}>
            <div style={{ ...cardTitle(), display: "flex", alignItems: "center", gap: 8 }}>
              <FileText size={16} /> ОДОБРЕНИ ТЕМПЛЕЙТИ (DMS)
            </div>
            <div style={{ display: "flex", gap: 10 }}>
               <div style={{ flex: 1, border: `1px dashed ${T.border}`, padding: 15, borderRadius: 10, textAlign: "center" }}>
                  <FileText size={20} style={{ marginBottom: 8, opacity: 0.5 }} />
                  <div style={{ fontSize: 11 }}>ППП Темплейт - АБВ</div>
               </div>
               <div style={{ flex: 1, border: `1px dashed ${T.border}`, padding: 15, borderRadius: 10, textAlign: "center" }}>
                  <Award size={20} style={{ marginBottom: 8, opacity: 0.5 }} />
                  <div style={{ fontSize: 11 }}>Договор Рамков - АБВ</div>
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
