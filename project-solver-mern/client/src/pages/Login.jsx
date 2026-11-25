import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Crest from "../components/Crest";

const DEMO_ACCOUNTS = [
  { email: "student@solver.edu", label: "Student" },
  { email: "tech.cse@solver.edu", label: "Technical Dept" },
  { email: "coordinator.a@solver.edu", label: "Class Coordinator" },
  { email: "hod.cse@solver.edu", label: "HOD" },
  { email: "admin@solver.edu", label: "Admin" },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="Gs-login-shell ps-dot-grid" style={{ background: "var(--kraft)" }}>
      {/* Left — illustrated ink panel */}
      <div
        className="ps-login-illustration ps-fade-up"
        style={{
          flex: "0 0 44%", background: "linear-gradient(160deg, var(--ink) 0%, #14202b 100%)",
          color: "var(--card)", padding: "48px 40px", display: "flex", flexDirection: "column",
          justifyContent: "space-between", position: "relative", overflow: "hidden",
        }}
      >
        <svg viewBox="0 0 300 400" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.16 }}>
          <line x1="20" y1="200" x2="150" y2="80" stroke="var(--card)" strokeWidth="1" />
          <line x1="20" y1="200" x2="150" y2="150" stroke="var(--card)" strokeWidth="1" />
          <line x1="20" y1="200" x2="150" y2="220" stroke="var(--card)" strokeWidth="1" />
          <line x1="20" y1="200" x2="150" y2="290" stroke="var(--card)" strokeWidth="1" />
          <line x1="20" y1="200" x2="150" y2="360" stroke="var(--card)" strokeWidth="1" />
          <circle cx="20" cy="200" r="5" fill="var(--card)" />
          {[80, 150, 220, 290, 360].map((y) => <circle key={y} cx="150" cy={y} r="4" fill="var(--card)" />)}
        </svg>

        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 12 }}>
          <Crest size={46} ink="var(--card)" paper="transparent" />
          <div>
            <div style={{ fontSize: 10.5, letterSpacing: "0.14em", opacity: 0.75, textTransform: "uppercase" }}>Office of</div>
            <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 18, fontWeight: 600 }}>Student Grievances</div>
          </div>
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          <div className="ps-serif-huge">Every complaint,<br />filed to the right desk.</div>
          <p style={{ opacity: 0.75, fontSize: 13.5, lineHeight: 1.6, marginTop: 14, maxWidth: 320 }}>
            A rule-based registry that routes each case to the responsible
            coordinator, department, or warden automatically — and escalates
            on its own if nobody acts.
          </p>
        </div>

        <div style={{ position: "relative", zIndex: 1, fontSize: 11.5, opacity: 0.6, letterSpacing: "0.04em" }}>
          Est. registry № 001 — Project Solver
        </div>
      </div>

      {/* Right — the actual form */}
      <div style={{ flex: "1 1 56%", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div className="ps-fade-up" style={{ width: 380, background: "var(--card)", border: "1px solid var(--hairline)", padding: "38px 36px", boxShadow: "0 18px 40px -12px rgba(34,48,60,0.2)" }}>
          <h1 className="serif" style={{ fontSize: 25, margin: "0 0 4px" }}>Sign in</h1>
          <p style={{ color: "var(--ink-soft)", fontSize: 13.5, margin: "0 0 26px" }}>Access your grievance dashboard.</p>

          <form onSubmit={handleSubmit}>
            <div className="ps-field">
              <label htmlFor="email">College email</label>
              <input id="email" className="ps-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@solver.edu" required />
            </div>
            <div className="ps-field">
              <label htmlFor="password">Password</label>
              <input id="password" className="ps-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <button className="ps-primary-btn" style={{ width: "100%", marginTop: 6 }} disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
            </button>
            {error && <div style={{ color: "var(--stamp)", fontSize: 13, marginTop: 12 }}>{error}</div>}
          </form>

          <p style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 18 }}>
            New student? <Link to="/register" className="ps-link" style={{ color: "var(--verdigris)" }}>Create an account</Link>
          </p>

          <div style={{ marginTop: 22, paddingTop: 16, borderTop: "1px dashed var(--hairline)" }}>
            <div style={{ fontSize: 11, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 9 }}>
              Demo accounts (password: password123)
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {DEMO_ACCOUNTS.map((a) => (
                <button
                  key={a.email}
                  type="button"
                  onClick={() => { setEmail(a.email); setPassword("password123"); }}
                  className="ps-chip"
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
