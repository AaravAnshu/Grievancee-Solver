import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import api from "../api/client";

const STAFF_ROLES = ["CLASS_COORDINATOR", "TECHNICAL_DEPT", "HOSTEL_WARDEN", "LIBRARY_STAFF", "MAINTENANCE", "HOD", "ADMIN"];
function pretty(s) { return String(s).replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()); }

export default function ForwardModal({ complaint, onClose, onForwarded }) {
  const [role, setRole] = useState(complaint.assignedRole || "ADMIN");
  const [userId, setUserId] = useState("");
  const [remarks, setRemarks] = useState("");
  const [staff, setStaff] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setUserId("");
    api.get(`/users/by-role/${role}`).then((res) => setStaff(res.data)).catch(() => setStaff([]));
  }, [role]);

  async function handleForward() {
    setBusy(true);
    setError("");
    try {
      const res = await api.put(`/complaints/${complaint.id}/forward`, { role, userId: userId || undefined, remarks });
      onForwarded(res.data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(34,48,60,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }} onClick={onClose}>
      <div className="ps-fade-up" style={{ width: 420, background: "var(--card)", border: "1px solid var(--hairline)", padding: "24px 26px" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <h3 className="serif" style={{ fontSize: 18, margin: 0 }}>Forward complaint</h3>
          <X size={18} style={{ cursor: "pointer", color: "var(--ink-soft)" }} onClick={onClose} />
        </div>
        <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "0 0 18px" }}>
          Case №{String(complaint.id).slice(-4)} — currently with {pretty(complaint.assignedRole)}
        </p>

        <div className="ps-field">
          <label>Forward to role</label>
          <select className="ps-input" value={role} onChange={(e) => setRole(e.target.value)}>
            {STAFF_ROLES.map((r) => <option key={r} value={r}>{pretty(r)}</option>)}
          </select>
        </div>
        <div className="ps-field">
          <label>Specific person (optional)</label>
          <select className="ps-input" value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">Any {pretty(role)} on file</option>
            {staff.map((s) => <option key={s.id} value={s.id}>{s.name}{s.location ? ` — ${s.location}` : ""}</option>)}
          </select>
        </div>
        <div className="ps-field">
          <label>Note for the record (optional)</label>
          <textarea className="ps-input" style={{ minHeight: 64 }} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Why is this being forwarded?" />
        </div>

        {error && <div style={{ color: "var(--stamp)", fontSize: 13, marginBottom: 10 }}>{error}</div>}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="ps-btn-outline" onClick={onClose}>Cancel</button>
          <button className="ps-primary-btn" onClick={handleForward} disabled={busy}>{busy ? "Forwarding…" : "Forward"}</button>
        </div>
      </div>
    </div>
  );
}
