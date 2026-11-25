import React from "react";
import { Radio } from "lucide-react";

const VB_W = 620, VB_H = 260;
export const STUDENT_POS = { x: 36, y: 130 };
export const HUB_POS = { x: 240, y: 130 };
export const TARGET_POS = {
  CLASS_COORDINATOR: { x: 470, y: 24 },
  TECHNICAL_DEPT: { x: 470, y: 62 },
  HOSTEL_WARDEN: { x: 470, y: 100 },
  LIBRARY_STAFF: { x: 470, y: 138 },
  MAINTENANCE: { x: 470, y: 176 },
  HOD: { x: 470, y: 214 },
  ADMIN: { x: 470, y: 252 },
};
const pct = (v, total) => `${(v / total) * 100}%`;

function pretty(s) {
  if (!s) return "";
  return String(s).replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

// Mirrors the server's RoutingService closely enough to preview a decision
// client-side as the student types, without a network round trip per keystroke.
export function specificity(rule) {
  let s = 0;
  if (rule.subCategory) s++;
  if (rule.locationPattern) s++;
  return s;
}
export function matchesRule(rule, complaint) {
  const subOk = !rule.subCategory || (complaint.subCategory && complaint.subCategory.toLowerCase().includes(rule.subCategory.toLowerCase()));
  const locOk = !rule.locationPattern || (complaint.location && complaint.location.toUpperCase().startsWith(rule.locationPattern.toUpperCase()));
  return subOk && locOk;
}
export function previewRoute(complaint, rules) {
  if (!complaint.category) return null;
  if (complaint.category === "HARASSMENT") return { role: "HOD", confidential: true };
  const candidates = rules.filter((r) => r.category === complaint.category && r.active !== false);
  const matched = candidates.filter((r) => matchesRule(r, complaint));
  if (matched.length === 0) return { role: "ADMIN", confidential: false };
  matched.sort((a, b) => specificity(b) - specificity(a));
  return { role: matched[0].assignedRole, confidential: false };
}

export default function RoutingMap({ activeRole, confidential, dot, pulseRole, hoveredRole, setHoveredRole, staffByRole }) {
  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: `${VB_W} / ${VB_H}`, background: "#efead9", border: "1px solid var(--hairline)" }}>
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <line x1={STUDENT_POS.x} y1={STUDENT_POS.y} x2={HUB_POS.x} y2={HUB_POS.y} stroke="var(--ink-soft)" strokeWidth="2" />
        {Object.entries(TARGET_POS).map(([role, p]) => {
          const active = role === activeRole;
          return (
            <line key={role} x1={HUB_POS.x} y1={HUB_POS.y} x2={p.x} y2={p.y}
              stroke={active ? (confidential ? "var(--stamp)" : "var(--verdigris)") : "var(--hairline)"}
              strokeWidth={active ? 2.6 : 1.2}
              strokeDasharray={active ? "0" : "3,4"}
              style={{ transition: "stroke 0.25s ease, stroke-width 0.25s ease" }} />
          );
        })}
      </svg>

      <div style={{ position: "absolute", left: pct(STUDENT_POS.x, VB_W), top: pct(STUDENT_POS.y, VB_H), transform: "translate(-50%,-50%)", textAlign: "center" }}>
        <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--ink)", margin: "0 auto 4px" }} />
        <div style={{ fontSize: 10, color: "var(--ink-soft)", whiteSpace: "nowrap" }}>Student</div>
      </div>

      <div style={{ position: "absolute", left: pct(HUB_POS.x, VB_W), top: pct(HUB_POS.y, VB_H), transform: "translate(-50%,-50%)", textAlign: "center" }}>
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--card)", border: "2px solid var(--ink)", margin: "0 auto 4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Radio size={15} color="var(--ink)" />
        </div>
        <div style={{ fontSize: 10, color: "var(--ink-soft)", whiteSpace: "nowrap" }}>Routing Engine</div>
      </div>

      {Object.entries(TARGET_POS).map(([role, p]) => {
        const active = role === activeRole;
        const pulsing = role === pulseRole;
        const staff = staffByRole ? staffByRole[role] : null;
        return (
          <div key={role}
            onMouseEnter={() => setHoveredRole && setHoveredRole(role)}
            onMouseLeave={() => setHoveredRole && setHoveredRole(null)}
            className={pulsing ? "ps-pulse" : ""}
            style={{ position: "absolute", left: pct(p.x, VB_W), top: pct(p.y, VB_H), transform: "translate(-50%,-50%)", display: "flex", alignItems: "center", gap: 6 }}
          >
            <div style={{
              width: 12, height: 12, borderRadius: "50%", flexShrink: 0,
              background: active ? (confidential ? "var(--stamp)" : "var(--verdigris)") : "var(--card)",
              border: `2px solid ${active ? (confidential ? "var(--stamp)" : "var(--verdigris)") : "var(--hairline)"}`,
              transition: "background 0.25s ease, border-color 0.25s ease",
            }} />
            <div style={{ fontSize: 10.5, color: active ? "var(--ink)" : "var(--ink-soft)", fontWeight: active ? 600 : 400, whiteSpace: "nowrap" }}>{pretty(role)}</div>
            {hoveredRole === role && staff && (
              <div style={{ position: "absolute", left: "100%", top: "50%", transform: "translateY(-50%)", marginLeft: 8, background: "var(--ink)", color: "var(--card)", fontSize: 11, padding: "5px 9px", whiteSpace: "nowrap", zIndex: 5 }}>
                {staff}
              </div>
            )}
          </div>
        );
      })}

      <div style={{
        position: "absolute", left: pct(dot.x, VB_W), top: pct(dot.y, VB_H), width: 10, height: 10, marginLeft: -5, marginTop: -5,
        borderRadius: "50%", background: confidential ? "var(--stamp)" : "var(--verdigris)", opacity: dot.opacity,
        boxShadow: `0 0 10px 2px ${confidential ? "var(--stamp)" : "var(--verdigris)"}`,
        transition: "left 0.6s cubic-bezier(.4,0,.2,1), top 0.6s cubic-bezier(.4,0,.2,1), opacity 0.3s ease",
      }} />
    </div>
  );
}
