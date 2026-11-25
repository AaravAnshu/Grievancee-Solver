import React, { useEffect, useMemo, useRef, useState } from "react";
import { FileText, Inbox, ClipboardList, Settings2, Users, ShieldAlert, Pin, LogOut, Send, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import RoutingMap, { STUDENT_POS, HUB_POS, TARGET_POS, previewRoute } from "../components/RoutingMap";
import ForwardModal from "../components/ForwardModal";
import Crest from "../components/Crest";

const STATUS_COLORS = {
  SUBMITTED: ["var(--ochre)", "var(--ochre-soft)"],
  ASSIGNED: ["var(--ochre)", "var(--ochre-soft)"],
  IN_PROGRESS: ["var(--ochre)", "var(--ochre-soft)"],
  ESCALATED: ["var(--stamp)", "var(--stamp-soft)"],
  RESOLVED: ["var(--verdigris)", "var(--verdigris-soft)"],
  CLOSED: ["var(--verdigris)", "var(--verdigris-soft)"],
};
const STATUS_ICONS = {
  SUBMITTED: Clock, ASSIGNED: Clock, IN_PROGRESS: Clock,
  ESCALATED: AlertTriangle, RESOLVED: CheckCircle2, CLOSED: CheckCircle2,
};
const STATUSES = ["SUBMITTED", "ASSIGNED", "IN_PROGRESS", "ESCALATED", "RESOLVED", "CLOSED"];
const CATEGORIES = ["ACADEMIC", "TECHNICAL", "INFRASTRUCTURE", "HOSTEL", "LIBRARY", "HARASSMENT", "OTHER"];
const STAFF_ROLES = ["CLASS_COORDINATOR", "TECHNICAL_DEPT", "HOSTEL_WARDEN", "LIBRARY_STAFF", "MAINTENANCE", "HOD", "ADMIN"];
const CATEGORY_HINTS = {
  ACADEMIC: { sub: "attendance, marks, timetable", loc: "SECTION-A" },
  TECHNICAL: { sub: "wifi, computer, projector", loc: "LAB-3" },
  INFRASTRUCTURE: { sub: "furniture, electricity, washroom", loc: "BLOCK-MAIN" },
  HOSTEL: { sub: "room, mess, water supply", loc: "BLOCK-2" },
  LIBRARY: { sub: "book, fine, timing", loc: "" },
  HARASSMENT: { sub: "kept confidential — always to HOD", loc: "" },
  OTHER: { sub: "anything not covered above", loc: "" },
};

function pretty(s) { if (!s) return ""; return String(s).replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()); }

function tabsForRole(role) {
  if (role === "STUDENT") return [["submit", "New complaint", FileText], ["my", "My complaints", Inbox]];
  if (role === "ADMIN") return [["queue", "My queue", Inbox], ["all", "All complaints", ClipboardList], ["rules", "Routing rules", Settings2], ["staff", "Registry", Users]];
  if (role === "HOD") return [["queue", "My queue", Inbox], ["all", "All complaints", ClipboardList]];
  return [["queue", "My queue", Inbox]];
}

function Field({ label, hint, children }) {
  return (
    <div className="ps-field">
      <label>{label}{hint ? <span style={{ opacity: 0.65 }}> — {hint}</span> : null}</label>
      {children}
    </div>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const tabs = tabsForRole(user.role);
  const [tab, setTab] = useState(tabs[0][0]);

  const [rules, setRules] = useState([]);
  const [myComplaints, setMyComplaints] = useState([]);
  const [queue, setQueue] = useState([]);
  const [allComplaints, setAllComplaints] = useState([]);
  const [staffAccounts, setStaffAccounts] = useState([]);
  const [staffByRole, setStaffByRole] = useState({});

  const [form, setForm] = useState({ title: "", description: "", category: "TECHNICAL", subCategory: "", location: "" });
  const [ruleForm, setRuleForm] = useState({ category: "TECHNICAL", subCategory: "", locationPattern: "", assignedRole: "TECHNICAL_DEPT" });
  const [staffForm, setStaffForm] = useState({ name: "", email: "", password: "password123", role: "TECHNICAL_DEPT", department: "", location: "" });

  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [dot, setDot] = useState({ ...HUB_POS, opacity: 0 });
  const [pulseRole, setPulseRole] = useState(null);
  const [hoveredRole, setHoveredRole] = useState(null);
  const [forwardTarget, setForwardTarget] = useState(null);

  const toastTimer = useRef(null);
  const flightTimers = useRef([]);

  const canForward = user.role === "ADMIN" || user.role === "HOD";

  function fireToast(msg) {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3400);
  }

  useEffect(() => {
    api.get("/routing-rules").then((res) => setRules(res.data)).catch(() => {});
    if (user.role === "ADMIN") {
      api.get("/users").then((res) => {
        setStaffAccounts(res.data);
        const map = {};
        res.data.forEach((u) => { if (!map[u.role]) map[u.role] = u.name; });
        setStaffByRole(map);
      }).catch(() => {});
    }
  }, [user.role]);

  useEffect(() => { loadForTab(tab); }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  function loadForTab(t) {
    if (t === "my") api.get("/complaints/my").then((res) => setMyComplaints(res.data)).catch((e) => fireToast(e.message));
    if (t === "queue") api.get("/complaints/queue").then((res) => setQueue(res.data)).catch((e) => fireToast(e.message));
    if (t === "all") api.get("/complaints/all").then((res) => setAllComplaints(res.data)).catch((e) => fireToast(e.message));
    if (t === "rules") api.get("/routing-rules").then((res) => setRules(res.data)).catch((e) => fireToast(e.message));
    if (t === "staff") api.get("/users").then((res) => setStaffAccounts(res.data)).catch((e) => fireToast(e.message));
  }

  const livePreview = useMemo(() => previewRoute(form, rules), [form, rules]);

  function runFlight(role) {
    flightTimers.current.forEach(clearTimeout);
    const target = TARGET_POS[role];
    setDot({ ...STUDENT_POS, opacity: 1 });
    flightTimers.current = [
      setTimeout(() => setDot({ ...HUB_POS, opacity: 1 }), 250),
      setTimeout(() => setDot({ ...target, opacity: 1 }), 950),
      setTimeout(() => setPulseRole(role), 1600),
      setTimeout(() => setDot((d) => ({ ...d, opacity: 0 })), 1750),
      setTimeout(() => setPulseRole(null), 2400),
    ];
  }

  async function submitComplaint() {
    if (!form.title.trim() || !form.description.trim()) { setError("Add a title and description first."); return; }
    setError("");
    try {
      const res = await api.post("/complaints", form);
      runFlight(res.data.assignedRole);
      fireToast(`Case filed and sent to ${pretty(res.data.assignedRole)}.`);
      setTimeout(() => {
        setForm({ title: "", description: "", category: "TECHNICAL", subCategory: "", location: "" });
        setTab("my");
      }, 2200);
    } catch (err) {
      setError(err.message);
    }
  }

  async function updateStatus(id, status) {
    if (!status) return;
    try {
      await api.put(`/complaints/${id}/status`, { status });
      fireToast(`Case updated to ${pretty(status)}.`);
      loadForTab(tab);
    } catch (err) {
      fireToast(err.message);
    }
  }

  async function addRule() {
    try {
      await api.post("/routing-rules", {
        ...ruleForm,
        subCategory: ruleForm.subCategory.trim() || null,
        locationPattern: ruleForm.locationPattern.trim() || null,
      });
      setRuleForm({ category: "TECHNICAL", subCategory: "", locationPattern: "", assignedRole: "TECHNICAL_DEPT" });
      fireToast("New rule filed — it takes effect immediately.");
      loadForTab("rules");
    } catch (err) {
      fireToast(err.message);
    }
  }
  async function removeRule(id) {
    await api.delete(`/routing-rules/${id}`);
    loadForTab("rules");
  }
  async function createStaff() {
    try {
      await api.post("/users", staffForm);
      fireToast("Staff account created.");
      setStaffForm({ name: "", email: "", password: "password123", role: "TECHNICAL_DEPT", department: "", location: "" });
      loadForTab("staff");
    } catch (err) {
      fireToast(err.message);
    }
  }

  function onForwarded() {
    fireToast("Complaint forwarded.");
    loadForTab(tab);
  }

  function RecordCard({ c, showActions }) {
    const [fg, bg] = STATUS_COLORS[c.status] || ["var(--ink-soft)", "var(--kraft)"];
    const StatusIcon = STATUS_ICONS[c.status] || Clock;
    return (
      <div className="ps-card" style={{ borderLeft: `4px solid ${fg}` }}>
        <div style={{ position: "absolute", top: 0, right: 0, width: 0, height: 0, borderStyle: "solid", borderWidth: "0 24px 24px 0", borderColor: `transparent ${fg} transparent transparent` }} />
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 2 }}>
          <span className="serif" style={{ fontWeight: 600, fontSize: 13, color: "var(--ink-soft)" }}>CASE №{String(c.id).slice(-4).toUpperCase()}</span>
          {c.confidential && <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, color: "var(--stamp)", fontWeight: 600 }}><ShieldAlert size={12} /> confidential</span>}
        </div>
        <p className="serif" style={{ fontSize: 17, fontWeight: 600, margin: "0 0 6px" }}>{c.title}</p>
        <p style={{ fontSize: 13.5, color: "var(--ink-soft)", margin: "0 0 10px", lineHeight: 1.5 }}>{c.description}</p>
        <div style={{ fontSize: 12, color: "var(--ink-soft)", display: "flex", flexWrap: "wrap", gap: "4px 14px", marginBottom: 10 }}>
          <span>{pretty(c.category)}{c.subCategory ? " / " + c.subCategory : ""}</span>
          {c.location && <span>· {c.location}</span>}
          <span>· filed by {c.submittedBy ? c.submittedBy.name : "—"}</span>
        </div>
        {c.forwardHistory && c.forwardHistory.length > 0 && (
          <div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginBottom: 8, fontStyle: "italic" }}>
            Forwarded {c.forwardHistory.length}× — last by {c.forwardHistory[c.forwardHistory.length - 1].by}
          </div>
        )}
        <div style={{ borderTop: "1px dashed var(--hairline)", paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>→ routed to <b style={{ color: "var(--ink)" }}>{c.assignedTo ? c.assignedTo.name : "Unassigned"}</b> ({pretty(c.assignedRole)})</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, padding: "3px 10px 3px 7px", color: fg, background: bg, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4, letterSpacing: "0.02em" }}>
              <StatusIcon size={11} /> {pretty(c.status)}
            </span>
            {showActions && (
              <select defaultValue="" onChange={(e) => { updateStatus(c.id, e.target.value); e.target.value = ""; }} style={{ fontSize: 12, padding: "4px 6px", border: "1px solid var(--hairline)", background: "#fff" }}>
                <option value="">Update…</option>
                {STATUSES.map((s) => <option key={s} value={s}>{pretty(s)}</option>)}
              </select>
            )}
            {canForward && (
              <button className="ps-chip" onClick={() => setForwardTarget(c)}>
                <Send size={12} /> Forward
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  function List({ list, showActions }) {
    if (!list.length) return <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--ink-soft)", fontSize: 14, border: "1px dashed var(--hairline)", background: "var(--card)" }}>This drawer is empty.</div>;
    return <div>{list.map((c) => <RecordCard key={c.id} c={c} showActions={showActions} />)}</div>;
  }

  return (
    <div className="ps-dot-grid" style={{ background: "var(--kraft)", minHeight: "100vh" }}>
      <div style={{ padding: "18px 24px 14px", borderBottom: "2px solid var(--ink)", background: "linear-gradient(180deg, var(--card), var(--kraft) 220%)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Crest size={40} />
            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.12em", color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: 3 }}>Office of Student Grievances</div>
              <div className="serif" style={{ fontSize: 26, fontWeight: 700, lineHeight: 1 }}>Project Solver</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ background: "var(--card)", border: "1px solid var(--hairline)", padding: "7px 14px 7px 7px", display: "flex", alignItems: "center", gap: 9, boxShadow: "0 4px 10px -6px rgba(34,48,60,0.35)" }}>
              <div style={{
                width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(150deg, var(--verdigris), var(--ink))",
                color: "var(--card)", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Fraunces', Georgia, serif",
              }}>
                {user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 9.5, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Signed in as</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{user.name} · {pretty(user.role)}</div>
              </div>
            </div>
            <button onClick={logout} className="ps-chip" title="Sign out"><LogOut size={13} /> Sign out</button>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "flex-start" }}>
        <div style={{ display: "flex", flexDirection: "column", paddingTop: 18, flexShrink: 0 }}>
          {tabs.map(([id, label, Icon]) => {
            const active = tab === id;
            return (
              <div key={id} onClick={() => setTab(id)} className={active ? "" : "ps-tab"}
                style={{
                  clipPath: "polygon(0 0, 88% 0, 100% 50%, 88% 100%, 0 100%)",
                  background: active ? "var(--card)" : "var(--kraft-dark)", color: active ? "var(--ink)" : "var(--ink-soft)",
                  padding: "12px 22px 12px 16px", marginBottom: 6, marginRight: active ? 0 : 10,
                  cursor: "pointer", fontSize: 13, fontWeight: active ? 600 : 500,
                  display: "flex", alignItems: "center", gap: 8,
                  borderTop: active ? "1px solid var(--hairline)" : "1px solid transparent",
                  borderBottom: active ? "1px solid var(--hairline)" : "1px solid transparent",
                }}>
                <Icon size={15} />{label}
              </div>
            );
          })}
        </div>

        <div style={{ flex: 1, background: "var(--card)", minHeight: 500, padding: "26px 30px 60px", borderLeft: "1px solid var(--hairline)" }}>
          <div key={tab} className="ps-fade-up" style={{ maxWidth: 660 }}>
            {tab === "submit" && (
              <div>
                <h3 className="serif ps-heading" style={{ fontSize: 19 }}>File a new complaint</h3>
                <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "0 0 16px" }}>Watch the map light up the path as you type — that's the routing engine deciding live.</p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <Field label="Category">
                    <select className="ps-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{pretty(c)}</option>)}
                    </select>
                  </Field>
                  <Field label="Location tag" hint={CATEGORY_HINTS[form.category].loc}>
                    <input className="ps-input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                  </Field>
                </div>
                <Field label="Title"><input className="ps-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Short summary" /></Field>
                <Field label="Description"><textarea className="ps-input" style={{ minHeight: 70 }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What happened, when, and where" /></Field>
                <Field label="Keyword" hint={CATEGORY_HINTS[form.category].sub}><input className="ps-input" value={form.subCategory} onChange={(e) => setForm({ ...form, subCategory: e.target.value })} /></Field>

                <div style={{ margin: "18px 0" }}>
                  <RoutingMap
                    activeRole={livePreview ? livePreview.role : null}
                    confidential={livePreview ? livePreview.confidential : false}
                    dot={dot} pulseRole={pulseRole} hoveredRole={hoveredRole} setHoveredRole={setHoveredRole}
                    staffByRole={staffByRole}
                  />
                </div>

                <button onClick={submitComplaint} className="ps-primary-btn">Submit complaint</button>
                {error && <div style={{ color: "var(--stamp)", fontSize: 13, marginTop: 10 }}>{error}</div>}
              </div>
            )}

            {tab === "my" && <div><h3 className="serif ps-heading" style={{ fontSize: 19 }}>My complaints</h3><List list={myComplaints} showActions={false} /></div>}
            {tab === "queue" && <div><h3 className="serif ps-heading" style={{ fontSize: 19 }}>My queue</h3><List list={queue} showActions={true} /></div>}
            {tab === "all" && <div><h3 className="serif ps-heading" style={{ fontSize: 19 }}>All complaints</h3><List list={allComplaints} showActions={true} /></div>}

            {tab === "rules" && (
              <div>
                <h3 className="serif ps-heading" style={{ fontSize: 19 }}>Routing rules</h3>
                <div style={{ border: "1px solid var(--hairline)", background: "var(--kraft)", padding: 16, marginBottom: 22 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
                    <Field label="Category">
                      <select className="ps-input" value={ruleForm.category} onChange={(e) => setRuleForm({ ...ruleForm, category: e.target.value })}>
                        {CATEGORIES.filter((c) => c !== "HARASSMENT").map((c) => <option key={c} value={c}>{pretty(c)}</option>)}
                      </select>
                    </Field>
                    <Field label="Keyword (optional)"><input className="ps-input" placeholder="wifi" value={ruleForm.subCategory} onChange={(e) => setRuleForm({ ...ruleForm, subCategory: e.target.value })} /></Field>
                    <Field label="Location pattern (optional)"><input className="ps-input" placeholder="LAB-" value={ruleForm.locationPattern} onChange={(e) => setRuleForm({ ...ruleForm, locationPattern: e.target.value })} /></Field>
                    <Field label="Assign to">
                      <select className="ps-input" value={ruleForm.assignedRole} onChange={(e) => setRuleForm({ ...ruleForm, assignedRole: e.target.value })}>
                        {STAFF_ROLES.map((r) => <option key={r} value={r}>{pretty(r)}</option>)}
                      </select>
                    </Field>
                  </div>
                  <button onClick={addRule} className="ps-primary-btn" style={{ marginTop: 10, padding: "9px 18px", fontSize: 13.5 }}>File rule</button>
                </div>
                <table className="ps-table">
                  <thead><tr>{["Category", "Keyword", "Location", "Routed to", ""].map((h) => <th key={h}>{h}</th>)}</tr></thead>
                  <tbody>
                    {rules.map((r) => (
                      <tr key={r._id}>
                        <td>{pretty(r.category)}</td>
                        <td>{r.subCategory || <em style={{ color: "var(--ink-soft)" }}>any</em>}</td>
                        <td>{r.locationPattern || <em style={{ color: "var(--ink-soft)" }}>any</em>}</td>
                        <td>{pretty(r.assignedRole)}</td>
                        <td><a onClick={() => removeRule(r._id)} className="ps-link">withdraw</a></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab === "staff" && (
              <div>
                <h3 className="serif ps-heading" style={{ fontSize: 19 }}>Registry of staff</h3>
                <div style={{ border: "1px solid var(--hairline)", background: "var(--kraft)", padding: 16, marginBottom: 22 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
                    <Field label="Name"><input className="ps-input" value={staffForm.name} onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })} /></Field>
                    <Field label="Email"><input className="ps-input" value={staffForm.email} onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })} /></Field>
                    <Field label="Password"><input className="ps-input" value={staffForm.password} onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })} /></Field>
                    <Field label="Role">
                      <select className="ps-input" value={staffForm.role} onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}>
                        {STAFF_ROLES.map((r) => <option key={r} value={r}>{pretty(r)}</option>)}
                      </select>
                    </Field>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 4 }}>
                    <Field label="Department"><input className="ps-input" placeholder="CSE" value={staffForm.department} onChange={(e) => setStaffForm({ ...staffForm, department: e.target.value })} /></Field>
                    <Field label="Scope / location"><input className="ps-input" placeholder="e.g. BRANCH-CSE, SECTION-A, BLOCK-2" value={staffForm.location} onChange={(e) => setStaffForm({ ...staffForm, location: e.target.value })} /></Field>
                  </div>
                  <button onClick={createStaff} className="ps-primary-btn" style={{ marginTop: 6, padding: "9px 18px", fontSize: 13.5 }}>Create account</button>
                </div>
                <table className="ps-table">
                  <thead><tr>{["Name", "Email", "Role", "Scope"].map((h) => <th key={h}>{h}</th>)}</tr></thead>
                  <tbody>
                    {staffAccounts.map((u) => (
                      <tr key={u.id}><td>{u.name}</td><td>{u.email}</td><td>{pretty(u.role)}</td><td>{u.location || "—"}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div className="ps-toast" style={{ position: "fixed", bottom: 22, right: 22, background: "linear-gradient(160deg, #2c3e4c, var(--ink))", color: "var(--card)", padding: "12px 18px", fontSize: 13, maxWidth: 320, display: "flex", alignItems: "flex-start", gap: 9, boxShadow: "0 14px 30px -10px rgba(34,48,60,0.7)" }}>
          <Pin size={13} style={{ marginTop: 2, flexShrink: 0 }} />{toast}
        </div>
      )}

      {forwardTarget && <ForwardModal complaint={forwardTarget} onClose={() => setForwardTarget(null)} onForwarded={onForwarded} />}
    </div>
  );
}
