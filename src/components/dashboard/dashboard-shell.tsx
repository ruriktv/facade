"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import {
  Responsive,
  WidthProvider,
  type Layout,
  type ResponsiveLayouts,
} from "react-grid-layout/legacy";
import {
  Settings2,
  X,
} from "lucide-react";
import clsx from "clsx";
import {
  widgetCatalog,
  type DashboardProfile,
  type LayoutMap,
  type ThemeDefinition,
  type WidgetDefinition,
} from "@/lib/dashboard-data";
import { DashboardWidgetCard } from "@/components/dashboard/widget-card";
import type { DashboardShellProps } from "@/components/dashboard/types";

const ResponsiveGridLayout = WidthProvider(Responsive);
const STORAGE_KEY = "facade-dashboard-state";

type StoredDashboardState = {
  activeProfileId?: string;
  activeThemeId?: string;
  widgets?: WidgetDefinition[];
  layouts?: Record<string, LayoutMap>;
  profiles?: DashboardProfile[];
};

function normalizeStoredProfiles(profiles: DashboardProfile[]) {
  return profiles
    .filter((profile) => profile.id !== "campaign-watch")
    .map((profile) => {
      if (profile.id === "family-mode" || profile.name === "Family") {
        return {
          ...profile,
          id: "family-mode",
          name: "Personal",
          description: "HSC study support plus table tennis results, live score, and upcoming events.",
        };
      }

      return profile;
    });
}

function mergeProfilesWithDefaults(storedProfiles: DashboardProfile[], defaultProfiles: DashboardProfile[]) {
  const normalizedProfiles = normalizeStoredProfiles(storedProfiles);
  const storedProfileMap = new Map(normalizedProfiles.map((profile) => [profile.id, profile]));

  return defaultProfiles.map((profile) => storedProfileMap.get(profile.id) ?? profile);
}

function toLayouts(layoutMap: LayoutMap): ResponsiveLayouts {
  return layoutMap;
}

function applyTheme(theme: ThemeDefinition) {
  if (typeof document === "undefined") {
    return;
  }

  Object.entries(theme.variables).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });
}

function buildWidgetMap(widgets: WidgetDefinition[]) {
  return new Map(widgets.map((widget) => [widget.id, widget]));
}

function getStoredState(): StoredDashboardState | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return null;
    }

    const parsed = JSON.parse(saved) as StoredDashboardState;

    return parsed;
  } catch {
    return null;
  }
}

function buildResponsiveFallbackLayouts(widgetIds: string[]): LayoutMap {
  return {
    lg: widgetIds.map((id, index) => ({
      i: id,
      x: index % 2 === 0 ? 0 : 6,
      y: Math.floor(index / 2) * 5,
      w: 6,
      h: id === "optimizely" ? 7 : id === "search-console" ? 5 : 4,
      minW: 2,
      minH: 3,
    })),
    md: widgetIds.map((id, index) => ({
      i: id,
      x: index % 2 === 0 ? 0 : 3,
      y: Math.floor(index / 2) * 4,
      w: 3,
      h: id === "optimizely" ? 7 : id === "search-console" ? 5 : 4,
      minW: 2,
      minH: 3,
    })),
    sm: widgetIds.map((id, index) => ({
      i: id,
      x: 0,
      y: index * 4,
      w: 2,
      h: id === "optimizely" ? 8 : id === "search-console" ? 6 : 4,
      minW: 2,
      minH: 3,
    })),
  };
}

export function DashboardShell({
  initialLayouts,
  initialProfiles,
  publicFeedCatalog,
  themeDefinitions,
}: DashboardShellProps) {
  const [profiles, setProfiles] = useState<DashboardProfile[]>(initialProfiles);
  const [layouts, setLayouts] = useState<Record<string, LayoutMap>>(initialLayouts);
  const [widgets, setWidgets] = useState(widgetCatalog);
  const [activeProfileId, setActiveProfileId] = useState(initialProfiles[0]?.id ?? "");
  const [activeThemeId, setActiveThemeId] = useState(themeDefinitions[0]?.id ?? "");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [gridRenderKey, setGridRenderKey] = useState(0);
  const [breakpoint, setBreakpoint] = useState<"lg" | "md" | "sm">("lg");

  const widgetMap = useMemo(() => buildWidgetMap(widgets), [widgets]);
  const activeProfile = profiles.find((profile) => profile.id === activeProfileId) ?? profiles[0];
  const currentTheme =
    themeDefinitions.find((theme) => theme.id === activeThemeId) ?? themeDefinitions[0];

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setMounted(true);

      const storedState = getStoredState();
      if (!storedState) {
        return;
      }

      startTransition(() => {
        if (storedState.profiles?.length) {
          setProfiles(mergeProfilesWithDefaults(storedState.profiles, initialProfiles));
        }
        if (storedState.layouts) {
          setLayouts(storedState.layouts);
        }
        if (storedState.widgets?.length) {
          setWidgets(storedState.widgets);
        }
        if (storedState.activeProfileId) {
          setActiveProfileId(
            storedState.activeProfileId === "campaign-watch"
              ? "chapter-overview"
              : storedState.activeProfileId,
          );
        }
        if (storedState.activeThemeId) {
          setActiveThemeId(storedState.activeThemeId);
        }
      });
    });

    const remeasure = () => {
      setGridRenderKey((current) => current + 1);
    };

    window.addEventListener("resize", remeasure);
    window.addEventListener("orientationchange", remeasure);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", remeasure);
      window.removeEventListener("orientationchange", remeasure);
    };
  }, [initialProfiles]);

  useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme]);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ activeProfileId, activeThemeId, widgets, layouts, profiles }),
    );
  }, [activeProfileId, activeThemeId, widgets, layouts, profiles, mounted]);

  const visibleWidgetIds = activeProfile.widgetIds.filter((widgetId) => widgetMap.get(widgetId)?.enabled);
  const widgetsForActiveProfile = activeProfile.widgetIds
    .map((widgetId) => widgetMap.get(widgetId))
    .filter((widget): widget is WidgetDefinition => Boolean(widget));

  const layoutForActiveProfile =
    layouts[activeProfile.id] ?? buildResponsiveFallbackLayouts(activeProfile.widgetIds);

  const filteredLayouts = Object.fromEntries(
    Object.entries(layoutForActiveProfile).map(([key, items]) => [
      key,
      items.filter((item) => visibleWidgetIds.includes(item.i)),
    ]),
  ) as LayoutMap;

  const handleLayoutChange = (
    _currentLayout: Layout,
    nextLayouts: Partial<Record<string, Layout>>,
  ) => {
    setLayouts((current) => ({
      ...current,
      [activeProfile.id]: nextLayouts as LayoutMap,
    }));
  };

  const handleWidgetToggle = (widgetId: string) => {
    setWidgets((current) =>
      current.map((widget) =>
        widget.id === widgetId ? { ...widget, enabled: !widget.enabled } : widget,
      ),
    );
  };

  const settingsPanel = (
    <div className="flex h-full flex-col overflow-hidden rounded-[32px] border border-border bg-panel-strong shadow-card backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <div className="text-sm font-semibold">Settings</div>
          <div className="text-sm text-muted">Theme, widgets, and layout order.</div>
        </div>
        <button
          type="button"
          onClick={() => setIsSettingsOpen(false)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background-elevated"
        >
          <X size={16} />
        </button>
      </div>

      <div className="dashboard-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <div className="space-y-6">
          <section className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
              Views
            </div>
            <div className="space-y-2">
              {profiles.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => setActiveProfileId(profile.id)}
                  className={clsx(
                    "w-full rounded-[20px] border px-4 py-3 text-left transition",
                    profile.id === activeProfile.id
                      ? "border-accent bg-accent-soft"
                      : "border-border bg-background-elevated hover:border-accent/40",
                  )}
                >
                  <div className="text-sm font-semibold">{profile.name}</div>
                  <div className="mt-1 text-sm leading-6 text-muted">{profile.description}</div>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
              Theme
            </div>
            <div className="space-y-2">
              {themeDefinitions.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setActiveThemeId(theme.id)}
                  className={clsx(
                    "w-full rounded-[20px] border px-4 py-3 text-left transition",
                    theme.id === activeThemeId
                      ? "border-accent bg-accent-soft"
                      : "border-border bg-background-elevated hover:border-accent/40",
                  )}
                >
                  <div className="text-sm font-semibold">{theme.label}</div>
                  <div className="mt-1 text-sm leading-6 text-muted">{theme.description}</div>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
              Widget Visibility
            </div>
            <div className="space-y-2">
              {widgetsForActiveProfile.map((widget) => (
                <button
                  key={widget.id}
                  type="button"
                  onClick={() => handleWidgetToggle(widget.id)}
                  className={clsx(
                    "flex w-full items-center justify-between rounded-[18px] border px-4 py-3 text-left transition",
                    widget.enabled
                      ? "border-accent/50 bg-accent-soft"
                      : "border-border bg-background-elevated hover:border-accent/30",
                  )}
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">{widget.title}</div>
                    <div className="truncate text-sm text-muted">{widget.subtitle}</div>
                  </div>
                  <div
                    className={clsx(
                      "rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
                      widget.enabled ? "bg-accent text-white" : "bg-foreground/8 text-muted",
                    )}
                  >
                    {widget.enabled ? "On" : "Off"}
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen px-4 py-4 text-foreground sm:px-5 lg:px-6">
      <button
        type="button"
        onClick={() => setIsSettingsOpen((current) => !current)}
        className="fixed right-4 top-4 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full border border-border bg-panel-strong text-foreground shadow-card backdrop-blur-xl transition hover:border-accent/40 sm:right-5 sm:top-5"
        aria-label={isSettingsOpen ? "Close settings" : "Open settings"}
      >
        {isSettingsOpen ? <X size={18} /> : <Settings2 size={18} />}
      </button>

      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-[1680px] gap-4 pt-14 sm:pt-16">
        <section className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="rounded-[32px] border border-border bg-panel px-2 py-2 shadow-card backdrop-blur-xl sm:px-3 sm:py-3">
            {mounted ? (
              <ResponsiveGridLayout
                key={`${activeProfile.id}-${gridRenderKey}`}
                className="layout dashboard-scrollbar"
                layouts={toLayouts(filteredLayouts)}
                breakpoints={{ lg: 1200, md: 768, sm: 0 }}
                cols={{ lg: 12, md: 6, sm: 2 }}
                rowHeight={86}
                margin={[14, 14]}
                containerPadding={[0, 0]}
                draggableHandle=".widget-drag-handle"
                compactType="vertical"
                preventCollision={false}
                onLayoutChange={handleLayoutChange}
                onBreakpointChange={(nextBreakpoint) =>
                  setBreakpoint(nextBreakpoint as "lg" | "md" | "sm")
                }
                isResizable
                isDraggable
                isBounded
                measureBeforeMount={false}
                useCSSTransforms
              >
                {visibleWidgetIds.map((widgetId) => {
                  const widget = widgetMap.get(widgetId);
                  if (!widget) {
                    return null;
                  }

                  return (
                    <div key={widget.id} className="min-h-0">
                      <DashboardWidgetCard
                        widget={widget}
                        activeProfile={activeProfile}
                        publicFeedCatalog={publicFeedCatalog}
                        breakpoint={breakpoint}
                      />
                    </div>
                  );
                })}
              </ResponsiveGridLayout>
            ) : (
              <div className="grid gap-4 p-3 md:grid-cols-2 xl:grid-cols-3">
                {visibleWidgetIds.map((widgetId) => {
                  const widget = widgetMap.get(widgetId);
                  if (!widget) {
                    return null;
                  }

                  return (
                    <DashboardWidgetCard
                      key={widget.id}
                      widget={widget}
                      activeProfile={activeProfile}
                      publicFeedCatalog={publicFeedCatalog}
                      breakpoint="lg"
                    />
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <aside className={clsx("hidden w-[360px] shrink-0 lg:block", !isSettingsOpen && "lg:hidden")}>
          {settingsPanel}
        </aside>
      </div>

      {isSettingsOpen ? (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setIsSettingsOpen(false)}
          />
          <div className="absolute inset-x-3 bottom-3 top-3">{settingsPanel}</div>
        </div>
      ) : null}
    </main>
  );
}
