"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowUpRight, Database, KeyRound, Mail, MapPin, ShieldCheck } from "lucide-react";
import { SessionProvider, useSession } from "../../components/session-context";
import { Turnstile } from "@marsidev/react-turnstile";

function LoginForm() {
  const { session, login } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("demo1@ivy.homes");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const turnstileRef = useRef(null);

  useEffect(() => {
    if (session) router.replace("/listings");
  }, [router, session]);

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (!captchaToken) {
      setError("Please complete the security verification.");
      return;
    }
    setLoading(true);
    try {
      await login(email, password, captchaToken);
    } catch (nextError) {
      setError(nextError.message);
      setCaptchaToken(null);
      turnstileRef.current?.reset();
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-paper lg:grid-cols-[1.08fr_.92fr]">
      <section className="login-backdrop flex min-h-90 flex-col bg-forest px-7 py-7 text-[#f9f6ec] sm:px-10 lg:min-h-screen lg:px-[clamp(40px,7vw,112px)] lg:py-11">
        <div className="flex items-center gap-3"><span className="grid size-9.5 shrink-0 place-items-center rounded-[11px] bg-gold font-serif text-lg font-extrabold tracking-[-.04em] text-forest">IL</span><span><strong className="block font-serif text-xl">Ivy Lens</strong><small className="mt-px block text-[.7rem] text-[#adbbb5]">An Ivy Homes engineering assignment by Vinay Joshi</small></span></div>
        <div className="my-9 max-w-162.5 sm:my-14 lg:my-auto">
          <p className="m-0 text-[.74rem] font-bold tracking-[.13em] text-[#e2bc74] uppercase">Ivy Homes assignment · Bangalore</p>
          <h1 className="my-4 max-w-190 font-serif text-[clamp(3rem,5.4vw,5.15rem)] leading-[.98] font-medium tracking-[-.055em]">A property browser that checks the data before you trust it.</h1>
          <p className="max-w-140 text-lg text-[#cad5d0]">Built by Vinay Joshi after auditing the complete challenge API: corrected units, reliable filters, persistent saves, and insights grounded in all retrievable records.</p>
          <div className="mt-7 flex flex-wrap gap-2.5">
            <a href="https://app.notion.com/p/Ivy-home-assignment-Vinay-Joshi-3d8e8c1de17f80e98737dbedc03f8df2" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] bg-gold px-4 text-[.82rem] font-bold text-forest transition hover:-translate-y-0.5 hover:bg-[#e1b662]">See my approach<ArrowUpRight size={17} /></a>
            <a href="https://mail.google.com/mail/?view=cm&fs=1&to=vinayjjoshi.310%40gmail.com&su=Ivy%20Homes%20Opportunity&body=Hi%20Vinay%2C%0A%0AI%27d%20like%20to%20discuss%20an%20opportunity%20with%20you.%0A%0AThanks%2C" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] border border-white/25 bg-white/5 px-4 text-[.82rem] font-bold text-[#f7f3e7] transition hover:-translate-y-0.5 hover:bg-white/10"><Mail size={17} />Hire Vinay</a>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-3.5 text-[.82rem] text-[#d5ded9] max-[420px]:grid">
          <span className="flex items-center gap-2"><Database size={18} /><strong className="text-[#f0ca82]">4,700</strong> sale records reconciled</span>
          <span className="flex items-center gap-2"><ShieldCheck size={18} /><strong className="text-[#f0ca82]">25</strong> documented findings</span>
          <span className="flex items-center gap-2"><MapPin size={18} />Electronic City assignment</span>
        </div>
      </section>
      <section className="grid place-items-center bg-cream px-5 pt-7 pb-11 sm:p-10">
        <form className="grid w-full max-w-107.5 gap-5 rounded-[20px] border border-line bg-paper p-7 shadow-card sm:p-9.5" onSubmit={submit}>
          <div><p className="m-0 text-[.74rem] font-bold tracking-[.13em] text-forest-light uppercase">Reviewer access</p><h2 className="mt-1.5 font-serif text-3xl leading-tight font-medium tracking-[-.035em]">Explore the corrected property desk</h2><p className="mt-2.5 text-[.82rem] leading-relaxed text-ink-soft">Use a provided demo account to test listings, rentals, projects, saves, and the audit-backed insights.</p></div>
          <label className="text-[.8rem] font-bold text-ink-soft">Email<input className="mt-1.5 min-h-12 w-full rounded-[9px] border border-[#d3d7d1] px-3 text-ink outline-none focus:border-forest-light focus:ring-3 focus:ring-forest-light/10" value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="username" required /></label>
          <label className="text-[.8rem] font-bold text-ink-soft">Password<input className="mt-1.5 min-h-12 w-full rounded-[9px] border border-[#d3d7d1] px-3 text-ink outline-none focus:border-forest-light focus:ring-3 focus:ring-forest-light/10" value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" placeholder="Enter the shared demo password" required /></label>
          <div className="min-h-16.5 overflow-hidden rounded-lg" aria-label="Security verification">
            <Turnstile
              ref={turnstileRef}
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
              className="w-full"
              options={{ action: "login", theme: "light", size: "flexible", refreshExpired: "auto" }}
              onSuccess={(token) => { setCaptchaToken(token); setError(""); }}
              onExpire={() => setCaptchaToken(null)}
              onError={() => { setCaptchaToken(null); setError("Security verification could not load. Please try again."); }}
              onUnsupported={() => { setCaptchaToken(null); setError("This browser cannot complete the security verification."); }}
            />
          </div>
          {error && <div className="rounded-lg bg-[#f8e7e3] px-3 py-2.5 text-[.82rem] text-[#8f382e]" role="alert" aria-live="polite">{error}</div>}
          <button className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-forest px-4 font-bold text-white hover:bg-[#205243] disabled:bg-forest/65" disabled={loading}>{loading ? "Signing in…" : <>Sign in <ArrowRight size={18} /></>}</button>
          <p className="-mt-2 flex items-center justify-center gap-1 text-center text-[.76rem] text-[#7b8882]"><KeyRound size={14} /> Use demo1, demo2 or demo3 @ivy.homes.</p>
        </form>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return <SessionProvider><LoginForm /></SessionProvider>;
}
