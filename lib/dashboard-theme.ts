/** Shared dashboard styling — matches /dashboard overview (dark + light). */
export const dc = {
  eyebrow:
    "text-[10px] font-black uppercase tracking-[0.3em] text-violet-600 dark:text-[oklch(0.78_0.16_285)]",
  title: "text-4xl font-black tracking-tight text-foreground",
  titleGradient:
    "bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent",
  subtitle: "text-sm text-muted-foreground",
  iconBox:
    "flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/20",
  statCard:
    "dashboard-card group relative overflow-hidden rounded-[2rem] border border-border/60 bg-card/80 p-8 shadow-lg backdrop-blur-xl transition-shadow hover:shadow-xl",
  statLabel:
    "text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground",
  statValue: "text-3xl font-black text-foreground sm:text-4xl",
  heroCard:
    "group relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-600 via-violet-600 to-indigo-700 p-8 shadow-xl shadow-violet-500/25 dark:from-[oklch(0.48_0.2_285)] dark:via-[oklch(0.42_0.18_280)] dark:to-[oklch(0.38_0.16_275)] dark:shadow-[0_20px_50px_-12px_oklch(0.35_0.18_285/50%)]",
  plCardBase:
    "group relative overflow-hidden rounded-[2rem] border p-8 shadow-lg backdrop-blur-xl transition-shadow hover:shadow-xl",
  plCardUp:
    "border-emerald-500/20 bg-emerald-500/5 dark:border-[oklch(0.55_0.14_155/35%)] dark:bg-[oklch(0.2_0.06_155/40%)]",
  plCardDown:
    "border-rose-500/20 bg-rose-500/5 dark:border-[oklch(0.55_0.16_25/35%)] dark:bg-[oklch(0.2_0.07_25/40%)]",
  plTextUp: "text-emerald-600 dark:text-[oklch(0.78_0.16_155)]",
  plTextDown: "text-rose-600 dark:text-[oklch(0.75_0.18_25)]",
  accentCard:
    "dashboard-card border border-border/60 bg-card/70 dark:border-[oklch(0.45_0.08_285/25%)] dark:bg-[oklch(0.16_0.04_288/40%)]",
  sectionCard:
    "dashboard-card rounded-[2rem] border border-border/60 bg-card/70 p-8 shadow-lg backdrop-blur-xl",
  tableWrap:
    "dashboard-card overflow-hidden rounded-[2rem] border border-border/60 bg-card/70 shadow-lg backdrop-blur-xl",
  tableHead:
    "border-b border-border/60 bg-muted/30 dark:bg-[oklch(0.16_0.04_288/50%)]",
  th: "text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground",
  tr: "transition-colors hover:bg-accent/50 dark:hover:bg-[oklch(0.2_0.05_288/50%)]",
  spinner: "h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-violet-600",
  btnPrimary:
    "flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-violet-500/20 transition-all hover:scale-[1.02] hover:shadow-violet-500/30",
  btnIcon:
    "rounded-2xl border border-border/60 bg-card/80 p-3 text-muted-foreground transition-all hover:bg-accent hover:text-foreground",
  emptyWrap: "rounded-2xl border border-dashed border-border bg-muted/20 p-10 text-center dark:bg-[oklch(0.16_0.04_288/30%)]",
  modalOverlay:
    "fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-md",
  modalPanel:
    "dashboard-card relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-border/60 bg-card shadow-2xl",
  input:
    "w-full rounded-2xl border border-border/60 bg-muted/30 px-6 py-4 font-bold text-foreground outline-none transition-all focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/20 dark:bg-[oklch(0.16_0.04_288/50%)]",
  select:
    "rounded-2xl border border-border/60 bg-card/80 px-4 py-3.5 text-sm font-bold text-foreground outline-none shadow-sm transition-all hover:bg-accent dark:bg-[oklch(0.16_0.04_288/50%)]",
  modalLabel: "mb-3 block text-[10px] font-black uppercase tracking-widest text-muted-foreground",
  modalTitle: "text-2xl font-black text-foreground",
  modalSub: "text-sm font-medium text-muted-foreground",
  dropdownMenu:
    "absolute z-50 mt-4 w-full overflow-hidden rounded-[2rem] border border-border/60 bg-popover shadow-2xl",
  badgeUp:
    "inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/15 px-3 py-1 text-xs font-black text-emerald-600 dark:bg-[oklch(0.25_0.08_155/40%)] dark:text-[oklch(0.78_0.16_155)]",
  badgeDown:
    "inline-flex items-center gap-1.5 rounded-xl bg-rose-500/15 px-3 py-1 text-xs font-black text-rose-600 dark:bg-[oklch(0.25_0.08_25/40%)] dark:text-[oklch(0.75_0.18_25)]",
  avatar:
    "flex h-12 w-12 items-center justify-center rounded-2xl border border-border/60 bg-card font-black text-violet-600 shadow-sm transition-all duration-500 group-hover:bg-violet-600 group-hover:text-white dark:text-[oklch(0.75_0.15_285)]",
};
