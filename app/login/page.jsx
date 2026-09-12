"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowUpRight, Database, KeyRound, MapPin, ShieldCheck, UserRoundSearch } from "lucide-react";
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
        <div className="login-brand"><span className="brand-mark">IL</span><span><strong>Ivy Lens</strong><small>An Ivy Homes engineering assignment by Vinay Joshi</small></span></div>
        <div className="story-copy">
          <p className="eyebrow">Ivy Homes assignment · Bangalore</p>
          <h1>A property browser that checks the data before you trust it.</h1>
          <p>Built by Vinay Joshi after auditing the complete challenge API: corrected units, reliable filters, persistent saves, and insights grounded in all retrievable records.</p>
          <div className="creator-actions">
            <a href="https://app.notion.com/p/Ivy-home-assignment-Vinay-Joshi-3d8e8c1de17f80e98737dbedc03f8df2" target="_blank" rel="noreferrer" className="story-button primary-story-button">See my approach<ArrowUpRight size={17} /></a>
            <a href="https://www.linkedin.com/in/vinay-joshi-347852296/" target="_blank" rel="noreferrer" className="story-button secondary-story-button"><UserRoundSearch size={17} />Hire Vinay</a>
          </div>
        </div>
        <div className="trust-list">
          <span><Database size={18} /><strong>4,700</strong> sale records reconciled</span>
          <span><ShieldCheck size={18} /><strong>25</strong> documented findings</span>
          <span><MapPin size={18} />Electronic City assignment</span>
        </div>
      </section>
      <section className="login-panel">
        <form className="login-card" onSubmit={submit}>
          <div><p className="eyebrow">Reviewer access</p><h2>Explore the corrected property desk</h2><p className="login-intro">Use a provided demo account to test listings, rentals, projects, saves, and the audit-backed insights.</p></div>
          <label>Email<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="username" required /></label>
          <label>Password<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" placeholder="Enter the shared demo password" required /></label>
          {error && <div className="form-error" role="alert">{error}</div>}
          <button className="primary-button" disabled={loading}>{loading ? "Signing in…" : <>Sign in <ArrowRight size={18} /></>}</button>
          <p className="form-note"><KeyRound size={14} /> Use demo1, demo2 or demo3 @ivy.homes.</p>
        </form>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return <SessionProvider><LoginForm /></SessionProvider>;
}
