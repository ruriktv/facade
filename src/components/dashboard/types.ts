"use client";

import type {
  DashboardProfile,
  LayoutMap,
  PublicFeedOption,
  ThemeDefinition,
  WidgetDefinition,
} from "@/lib/dashboard-data";

export type DashboardShellProps = {
  initialLayouts: Record<string, LayoutMap>;
  initialProfiles: DashboardProfile[];
  publicFeedCatalog: PublicFeedOption[];
  themeDefinitions: ThemeDefinition[];
};

export type DashboardState = {
  activeProfileId: string;
  activeThemeId: string;
  widgets: WidgetDefinition[];
};
