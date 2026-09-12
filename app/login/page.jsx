"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, KeyRound, ShieldCheck } from "lucide-react";
import { SessionProvider, useSession } from "../../components/session-context";

function LoginForm() {
  const { session, login } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("demo1@ivy.homes");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) router.replace("/listings");
  }, [router, session]);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try { await login(email, password); }
    catch (nextError) { setError(nextError.message); setLoading(false); }
  }

  return (
    <main className="login-page">
      <section className="login-story">
        <div className="login-brand"><span className="brand-mark">IL</span><strong>Ivy Lens</strong></div>
        <div className="story-copy">
          <p className="eyebrow">Bangalore, read clearly</p>
          <h1>Property search with the fine print already checked.</h1>
          <p>Browse homes, rentals and projects through corrected prices, areas and availability.</p>
        </div>
        <div className="trust-list">
          <span><CheckCircle2 size={18} /> Corrected area and price units</span>
          <span><ShieldCheck size={18} /> Suspicious inventory screened out</span>
          <span><KeyRound size={18} /> Saved homes stay with your account</span>
        </div>
      </section>
      <section className="login-panel">
        <form className="login-card" onSubmit={submit}>
          <div><p className="eyebrow">Welcome back</p><h2>Sign in to your property desk</h2></div>
          <label>Email<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="username" required /></label>
          <label>Password<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" placeholder="Enter the shared demo password" required /></label>
          {error && <div className="form-error" role="alert">{error}</div>}
          <button className="primary-button" disabled={loading}>{loading ? "Signing in…" : <>Sign in <ArrowRight size={18} /></>}</button>
          <p className="form-note">Use demo1, demo2 or demo3 @ivy.homes.</p>
        </form>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return <SessionProvider><LoginForm /></SessionProvider>;
}
