import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", department: "", location: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await register(form);
      navigate("/login");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--kraft)" }}>
      <div className="ps-fade-up" style={{ width: 380, background: "var(--card)", border: "1px solid var(--hairline)", padding: "36px 34px" }}>
        <h1 className="serif" style={{ fontSize: 24, margin: "0 0 4px" }}>Create a student account</h1>
        <p style={{ color: "var(--ink-soft)", fontSize: 13.5, margin: "0 0 24px" }}>Staff accounts are created by an Admin, not here.</p>

        <form onSubmit={handleSubmit}>
          <div className="ps-field"><label>Full name</label><input className="ps-input" value={form.name} onChange={(e) => set("name", e.target.value)} required /></div>
          <div className="ps-field"><label>College email</label><input className="ps-input" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required /></div>
          <div className="ps-field"><label>Password</label><input className="ps-input" type="password" value={form.password} onChange={(e) => set("password", e.target.value)} required /></div>
          <div className="ps-field"><label>Department</label><input className="ps-input" placeholder="CSE" value={form.department} onChange={(e) => set("department", e.target.value)} /></div>
          <div className="ps-field"><label>Section (e.g. SECTION-A)</label><input className="ps-input" placeholder="SECTION-A" value={form.location} onChange={(e) => set("location", e.target.value)} /></div>
          <button className="ps-btn" style={{ width: "100%", marginTop: 6 }} disabled={busy}>{busy ? "Creating…" : "Create account"}</button>
          {error && <div style={{ color: "var(--stamp)", fontSize: 13, marginTop: 12 }}>{error}</div>}
        </form>

        <p style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 18 }}>
          Already registered? <Link to="/login" className="ps-link" style={{ color: "var(--verdigris)" }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
