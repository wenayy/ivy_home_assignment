"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  BarChart3,
  Building2,
  Heart,
  Home,
  KeyRound,
  LogOut,
  Sparkles,
  Mail,
} from "lucide-react";
import { SessionProvider, useSession } from "./session-context";

const nav = [
  { href: "/listings", label: "Homes", icon: Home },
  { href: "/rentals", label: "Rentals", icon: KeyRound },
  { href: "/projects", label: "Projects", icon: Building2 },
  { href: "/saved", label: "Saved", icon: Heart },
  { href: "/insights", label: "Insights", icon: BarChart3 },
];

function Shell({ children }) {
  const { session, logout } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (session === null) router.replace("/login");
  }, [router, session]);

  if (session === undefined || session === null) {
    return <div className="flex min-h-screen items-center justify-center gap-3 text-ink-soft"><span className="size-5 animate-spin rounded-full border-2 border-[#cbd3ce] border-t-forest" />Opening your workspace…</div>;
  }

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-61 flex-col bg-forest px-4.5 pt-7 pb-5 text-[#f6f4ec] md:flex">
        <Link className="flex items-center gap-3 px-2 pb-7" href="/listings" aria-label="Ivy Lens home">
          <span className="grid size-9.5 shrink-0 place-items-center rounded-[11px] bg-gold font-serif text-lg font-extrabold tracking-[-.04em] text-forest">IL</span>
          <span><strong className="block font-serif text-xl tracking-tight">Ivy Lens</strong><small className="mt-px block text-[.73rem] text-[#b9c8c1]">Bangalore property desk</small></span>
        </Link>
        <nav className="grid gap-1" aria-label="Primary navigation">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href === "/listings" && pathname.startsWith("/listings/"));
            return <Link key={href} href={href} className={`flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-[.94rem] font-medium transition ${active ? "bg-[#f5f1e5] text-forest" : "text-[#cad5d0] hover:bg-white/7 hover:text-white"}`}><Icon size={19} strokeWidth={1.8} />{label}</Link>;
          })}
        </nav>
        <a className="mt-auto flex min-h-10.5 items-center gap-2 rounded-[10px] border border-gold/50 bg-gold/10 px-3 text-[.79rem] font-bold text-[#f0ca82] transition hover:-translate-y-0.5 hover:bg-gold hover:text-forest" href="https://mail.google.com/mail/?view=cm&fs=1&to=vinayjjoshi.310%40gmail.com&su=Ivy%20Homes%20Opportunity&body=Hi%20Vinay%2C%0A%0AI%27d%20like%20to%20discuss%20an%20opportunity%20with%20you.%0A%0AThanks%2C" target="_blank" rel="noreferrer"><Sparkles size={16} />Hire Vinay<Mail className="ml-auto" size={15} /></a>
        <div className="mt-3.5 grid grid-cols-[36px_1fr_34px] items-center gap-2 border-t border-white/15 px-2 pt-3.5">
          <div className="grid size-8.5 place-items-center rounded-full bg-[#2b6554] font-bold uppercase">{session.user?.email?.slice(4, 5) || "D"}</div>
          <div className="min-w-0"><strong className="block truncate text-[.84rem]">{session.user?.email?.split("@")[0]}</strong><small className="block truncate text-[.7rem] text-[#aebeb7]">Demo account</small></div>
          <button onClick={logout} className="grid size-8.5 place-items-center rounded-lg border-0 bg-transparent text-[#c4d1cb] hover:bg-white/10 hover:text-white" title="Sign out" aria-label="Sign out"><LogOut size={18} /></button>
        </div>
      </aside>
      <main className="min-h-screen pb-18 md:ml-61 md:pb-0">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid h-17 grid-cols-5 border-t border-line bg-paper/95 backdrop-blur-md md:hidden" aria-label="Primary navigation">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href === "/listings" && pathname.startsWith("/listings/"));
          return <Link key={href} href={href} className={`flex flex-col items-center justify-center gap-0.5 text-[.62rem] ${active ? "font-bold text-forest" : "text-[#6a7871]"}`}><Icon size={20} /><span>{label}</span></Link>;
        })}
      </nav>
    </div>
  );
}

export default function AppShell({ children }) {
  return <SessionProvider><Shell>{children}</Shell></SessionProvider>;
}
