import { T } from "./tokens";

export function DR({ label, value, vc }: { label: string; value: string; vc?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid rgba(255,255,255,0.04)`, fontSize: 11 }}>
      <span style={{ color: T.muted }}>{label}</span>
      <span style={{ fontWeight: 600, color: vc || T.text, fontFamily: vc ? "'JetBrains Mono',monospace" : undefined }}>{value}</span>
    </div>
  );
}

export function Tag({ children, color = "#00e5b8" }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 8, padding: "2px 7px", borderRadius: 20, fontWeight: 700, background: `${color}18`, color, border: `1px solid ${color}30` }}>
      {children}
    </span>
  );
}

export function Pulse({ color = "#00e5b8" }: { color?: string }) {
  return (
    <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}`, animation: "pulse 2s infinite" }} />
  );
}
