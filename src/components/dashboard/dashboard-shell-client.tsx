"use client";

import dynamic from "next/dynamic";
import type { DashboardShellProps } from "@/components/dashboard/types";

const DashboardShell = dynamic(
  () => import("@/components/dashboard/dashboard-shell").then((mod) => mod.DashboardShell),
  {
    ssr: false,
    loading: () => (
      <main className="min-h-screen px-4 py-4 text-foreground sm:px-5 lg:px-6">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-[1680px] items-center justify-center rounded-[32px] border border-border bg-panel-strong shadow-card backdrop-blur-xl">
          <div className="flex items-center gap-3 rounded-[18px] border border-border bg-background-elevated px-4 py-3 text-sm text-muted">
            <span className="inline-flex h-5 w-5 animate-spin rounded-full border-2 border-border border-t-accent" />
            <span>Loading dashboard...</span>
          </div>
        </div>
      </main>
    ),
  },
);

export function DashboardShellClient(props: DashboardShellProps) {
  return <DashboardShell {...props} />;
}
