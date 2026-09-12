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
  ArrowUpRight,
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
    return <div className="app-loading"><span className="spinner" />Opening your workspace…</div>;
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <Link className="brand" href="/listings" aria-label="Ivy Lens home">
          <span className="brand-mark">IL</span>
          <span><strong>Ivy Lens</strong><small>Bangalore property desk</small></span>
        </Link>
        <nav className="side-nav" aria-label="Primary navigation">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href === "/listings" && pathname.startsWith("/listings/"));
            return <Link key={href} href={href} className={active ? "active" : ""}><Icon size={19} strokeWidth={1.8} />{label}</Link>;
          })}
        </nav>
        <a className="sidebar-hire" href="https://www.linkedin.com/in/vinay-joshi-347852296/" target="_blank" rel="noreferrer"><Sparkles size={16} />Hire Vinay<ArrowUpRight size={15} /></a>
        <div className="side-profile">
          <div className="avatar">{session.user?.email?.slice(4, 5) || "D"}</div>
          <div><strong>{session.user?.email?.split("@")[0]}</strong><small>Demo account</small></div>
          <button onClick={logout} className="icon-button" title="Sign out" aria-label="Sign out"><LogOut size={18} /></button>
        </div>
      </aside>
      <main className="main">{children}</main>
      <nav className="mobile-nav" aria-label="Primary navigation">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href === "/listings" && pathname.startsWith("/listings/"));
          return <Link key={href} href={href} className={active ? "active" : ""}><Icon size={20} /><span>{label}</span></Link>;
        })}
      </nav>
    </div>
  );
}

export default function AppShell({ children }) {
  return <SessionProvider><Shell>{children}</Shell></SessionProvider>;
}
