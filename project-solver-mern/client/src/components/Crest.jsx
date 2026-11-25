import React from "react";

// A small ornamental seal/crest — the app's mark, used in the header and on
// the login screen instead of leaving the brand as plain text.
export default function Crest({ size = 44, ink = "#22303C", paper = "#F7F3E8" }) {
  const ticks = Array.from({ length: 16 }, (_, i) => i);
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ flexShrink: 0 }}>
      <circle cx="50" cy="50" r="47" fill={paper} stroke={ink} strokeWidth="2.5" />
      <circle cx="50" cy="50" r="38" fill="none" stroke={ink} strokeWidth="1" opacity="0.5" />
      {ticks.map((i) => {
        const angle = (i / ticks.length) * Math.PI * 2;
        const x1 = 50 + Math.cos(angle) * 41, y1 = 50 + Math.sin(angle) * 41;
        const x2 = 50 + Math.cos(angle) * 45, y2 = 50 + Math.sin(angle) * 45;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={ink} strokeWidth="1.5" opacity="0.6" />;
      })}
      <text x="50" y="60" textAnchor="middle" fontFamily="'Fraunces', Georgia, serif" fontWeight="700" fontSize="34" fill={ink}>PS</text>
    </svg>
  );
}
