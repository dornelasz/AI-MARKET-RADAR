"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "./icons";

const NAV: Array<{ href: string; label: string; icon: IconName }> = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/articles", label: "Artigos", icon: "articles" },
  { href: "/sources", label: "Fontes", icon: "sources" },
  { href: "/alerts", label: "Alertas", icon: "alerts" },
  { href: "/digest", label: "Digest", icon: "digest" },
  { href: "/settings", label: "Configurações", icon: "settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 z-20 border-b border-line bg-bg-subtle/85 backdrop-blur lg:h-screen lg:border-b-0 lg:border-r">
      <div className="flex items-center gap-2.5 px-4 py-4 lg:px-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft text-brand ring-1 ring-brand-muted/40">
          <Icon name="radar" className="h-5 w-5" />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-ink">AI Market Radar</p>
          <p className="text-[11px] text-ink-faint">Radar de mercado de IA</p>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible lg:px-3">
        {NAV.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-brand-soft text-ink ring-1 ring-brand-muted/40"
                  : "text-ink-muted hover:bg-bg-overlay hover:text-ink",
              )}
            >
              <Icon
                name={item.icon}
                className={cn(
                  "h-[18px] w-[18px] transition",
                  active ? "text-brand" : "text-ink-faint group-hover:text-ink-muted",
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
