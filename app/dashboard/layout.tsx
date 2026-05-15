"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  ChevronLeft,
  ChevronRight,
  Database,
  PieChart,
  LogOut,
  Bell,
  Search,
  Menu,
  X,
  ShieldCheck,
  ArrowRightLeft,
} from "lucide-react";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { name: "Overview", icon: LayoutDashboard, href: "/dashboard" },
    { name: "Vaults", icon: Layers, href: "/dashboard/portfolios" },
    { name: "Inventory", icon: PieChart, href: "/dashboard/assets" },
    { name: "Transactions", icon: ArrowRightLeft, href: "/dashboard/transactions" },
    { name: "Catalog", icon: Database, href: "/dashboard/tickers" },
  ];

  const NavLink = ({
    item,
    mobile = false,
    onNavigate,
  }: {
    item: (typeof menuItems)[0];
    mobile?: boolean;
    onNavigate?: () => void;
  }) => {
    const isActive = pathname === item.href;
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        className={cn(
          "group relative flex items-center gap-3 rounded-xl transition-all duration-300",
          mobile ? "p-4 text-sm font-bold" : "p-3.5",
          isActive
            ? "dashboard-nav-active bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20"
            : "text-muted-foreground hover:bg-accent hover:text-foreground dark:hover:bg-accent/80",
          !mobile && isCollapsed && "justify-center"
        )}
      >
        <item.icon
          className={cn(
            "h-4 w-4 shrink-0 transition-transform group-hover:scale-110",
            isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground"
          )}
        />
        {(!isCollapsed || mobile) && (
          <span className="text-xs font-bold tracking-wide">{item.name}</span>
        )}
        {isActive && !isCollapsed && !mobile && (
          <span className="absolute right-3 h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />
        )}
      </Link>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background font-sans text-foreground">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "dashboard-sidebar relative hidden flex-col border-r border-border/60 bg-card/80 backdrop-blur-xl transition-all duration-500 md:flex dark:border-sidebar-border",
          isCollapsed ? "w-[5.25rem]" : "w-64"
        )}
      >
        <div
          className={cn(
            "mb-2 flex items-center gap-3 px-6 py-8 transition-all duration-500",
            isCollapsed && "justify-center px-3"
          )}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 shadow-lg shadow-violet-500/20">
            <Layers className="h-5 w-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="animate-in fade-in slide-in-from-left-2 duration-500">
              <h2 className="text-lg font-black tracking-tight text-foreground">Wealth.io</h2>
              <div className="-mt-0.5 flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-violet-500 dark:text-[oklch(0.72_0.16_285)]">
                <ShieldCheck className="h-2 w-2" /> Verified
              </div>
            </div>
          )}
        </div>

        <nav className="flex-grow space-y-1 px-3">
          {menuItems.map((item) => (
            <NavLink key={item.name} item={item} />
          ))}
        </nav>

        <div className="mt-auto p-3">
          <button
            type="button"
            className={cn(
              "flex w-full items-center gap-3 rounded-xl p-3.5 text-muted-foreground transition-all hover:bg-rose-500/10 hover:text-rose-500 dark:hover:text-rose-400",
              isCollapsed && "justify-center"
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span className="text-xs font-bold">Sign Out</span>}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-lg transition-all hover:text-foreground"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="dashboard-header z-40 flex h-16 shrink-0 items-center justify-between border-b border-border/60 bg-card/50 px-6 backdrop-blur-xl sm:px-10">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-accent md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden w-64 items-center gap-3 rounded-xl border border-border/60 bg-muted/40 px-4 py-2 transition-all focus-within:ring-2 focus-within:ring-violet-500/20 sm:flex md:w-80">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Global search..."
                className="w-full border-none bg-transparent text-xs font-medium text-foreground outline-none placeholder:text-muted-foreground/70"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            <ThemeToggle />
            <button
              type="button"
              className="relative rounded-xl p-2 text-muted-foreground transition-all hover:bg-accent hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full border border-card bg-violet-600" />
            </button>
            <div className="mx-1 hidden h-6 w-px bg-border sm:block" />
            <div className="flex items-center gap-3">
              <div className="hidden text-right xs:block">
                <p className="text-[11px] font-black text-foreground">Dev Shah</p>
                <p className="text-[8px] font-black uppercase tracking-widest text-violet-500 dark:text-[oklch(0.72_0.16_285)]">
                  Master Admin
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-600/15 to-indigo-600/15 text-xs font-black text-violet-600 dark:border-[oklch(0.5_0.12_285/40%)] dark:from-[oklch(0.35_0.12_285/30%)] dark:to-[oklch(0.32_0.1_275/30%)] dark:text-[oklch(0.8_0.14_285)]">
                DS
              </div>
            </div>
          </div>
        </header>

        <main className="dashboard-scroll relative flex-1 overflow-y-auto">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full bg-violet-500/10 blur-[100px] dark:dashboard-glow-violet" />
            <div className="absolute -bottom-32 -left-32 h-[320px] w-[320px] rounded-full bg-indigo-500/10 blur-[90px] dark:dashboard-glow-indigo" />
            <div className="absolute left-1/2 top-1/3 h-[200px] w-[200px] -translate-x-1/2 rounded-full bg-emerald-500/5 blur-[80px] dark:dashboard-glow-teal" />
          </div>
          <div className="relative z-10 min-h-full">{children}</div>
        </main>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] animate-in fade-in duration-300 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close menu overlay"
          />
          <aside className="absolute bottom-0 left-0 top-0 flex w-72 animate-in slide-in-from-left flex-col border-r border-border bg-card p-6 duration-500">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600">
                  <Layers className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-lg font-black tracking-tight">Wealth.io</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-xl p-2 hover:bg-accent"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="space-y-1">
              {menuItems.map((item) => (
                <NavLink
                  key={item.name}
                  item={item}
                  mobile
                  onNavigate={() => setIsMobileMenuOpen(false)}
                />
              ))}
            </nav>
            <div className="mt-auto flex items-center justify-between border-t border-border pt-6">
              <span className="text-xs font-bold text-muted-foreground">Appearance</span>
              <ThemeToggle />
            </div>
          </aside>
        </div>
      )}

      <style jsx global>{`
        .dashboard-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .dashboard-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .dashboard-scroll::-webkit-scrollbar-thumb {
          background: color-mix(in oklch, var(--muted-foreground) 25%, transparent);
          border-radius: 10px;
        }
        .dashboard-scroll::-webkit-scrollbar-thumb:hover {
          background: color-mix(in oklch, var(--violet, var(--primary)) 40%, transparent);
        }
      `}</style>
    </div>
  );
}
