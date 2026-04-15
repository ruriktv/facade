export type BreakpointKey = "lg" | "md" | "sm";

export type WidgetKind =
  | "date"
  | "weather"
  | "searchConsole"
  | "ga4"
  | "accessibility"
  | "optimizely"
  | "news"
  | "github"
  | "wtt"
  | "hsc";

export type WidgetCategory = "core" | "analytics" | "campaigns" | "public";

export type WidgetDefinition = {
  id: string;
  kind: WidgetKind;
  title: string;
  subtitle: string;
  category: WidgetCategory;
  enabled: boolean;
};

export type ThemeDefinition = {
  id: string;
  label: string;
  description: string;
  variables: Record<string, string>;
};

export type DashboardProfile = {
  id: string;
  name: string;
  description: string;
  widgetIds: string[];
};

export type GridLayoutItem = {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
};

export type LayoutMap = Record<BreakpointKey, GridLayoutItem[]>;
export type ProfileLayouts = Record<string, LayoutMap>;

export type PublicFeedOption = {
  id: string;
  title: string;
  description: string;
  mode: "free" | "free-tier";
  notes: string;
};

export const widgetCatalog: WidgetDefinition[] = [
  {
    id: "date",
    kind: "date",
    title: "Today",
    subtitle: "Local date, planning rhythm, and quick context",
    category: "core",
    enabled: true,
  },
  {
    id: "weather",
    kind: "weather",
    title: "Weather",
    subtitle: "Sydney conditions and short-range outlook",
    category: "core",
    enabled: true,
  },
  {
    id: "search-console",
    kind: "searchConsole",
    title: "Search Console",
    subtitle: "Core Web Vitals monitoring across your key properties",
    category: "analytics",
    enabled: true,
  },
  {
    id: "ga4",
    kind: "ga4",
    title: "GA4 Campaigns",
    subtitle: "Traffic and campaign context around active experiments",
    category: "analytics",
    enabled: true,
  },
  {
    id: "axeauditor",
    kind: "accessibility",
    title: "axeAuditor",
    subtitle: "Accessibility checkpoints, regressions, and release confidence",
    category: "analytics",
    enabled: true,
  },
  {
    id: "optimizely",
    kind: "optimizely",
    title: "Optimizely",
    subtitle: "Web experimentation status, contributors, and targeted URLs",
    category: "campaigns",
    enabled: true,
  },
  {
    id: "news",
    kind: "news",
    title: "News Brief",
    subtitle: "A small executive scan of headline movement",
    category: "public",
    enabled: false,
  },
  {
    id: "github-trends",
    kind: "github",
    title: "Frontend and AI GitHub Trends",
    subtitle: "Repos to watch for tooling and ecosystem shifts",
    category: "public",
    enabled: false,
  },
  {
    id: "wtt",
    kind: "wtt",
    title: "Table Tennis",
    subtitle: "WTT results, fixtures, and player movement",
    category: "public",
    enabled: false,
  },
  {
    id: "hsc",
    kind: "hsc",
    title: "NSW Learning",
    subtitle: "HSC suggestions and high-school support resources",
    category: "public",
    enabled: false,
  },
];

export const initialProfiles: DashboardProfile[] = [
  {
    id: "chapter-overview",
    name: "Chapter Overview",
    description: "Default operating board for CRO, search, analytics, and accessibility.",
    widgetIds: ["date", "weather", "search-console", "ga4", "optimizely", "axeauditor"],
  },
  {
    id: "technology",
    name: "Technology",
    description: "AI engineering, frontend tooling, GitHub movement, and relevant news.",
    widgetIds: ["github-trends", "news"],
  },
  {
    id: "family-mode",
    name: "Personal",
    description: "HSC study support plus table tennis results, live score, and upcoming events.",
    widgetIds: ["hsc", "wtt", "news"],
  },
];

const sharedLg: LayoutMap = {
  lg: [
    { i: "date", x: 0, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    { i: "weather", x: 3, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    { i: "search-console", x: 6, y: 0, w: 6, h: 5, minW: 4, minH: 4 },
    { i: "ga4", x: 0, y: 3, w: 6, h: 5, minW: 4, minH: 4 },
    { i: "axeauditor", x: 6, y: 5, w: 6, h: 4, minW: 4, minH: 4 },
    { i: "optimizely", x: 0, y: 8, w: 12, h: 6, minW: 4, minH: 5 },
    { i: "news", x: 0, y: 8, w: 4, h: 4, minW: 3, minH: 3 },
    { i: "github-trends", x: 4, y: 8, w: 4, h: 4, minW: 3, minH: 3 },
    { i: "wtt", x: 8, y: 11, w: 4, h: 4, minW: 3, minH: 3 },
    { i: "hsc", x: 0, y: 12, w: 6, h: 4, minW: 4, minH: 3 },
  ],
  md: [
    { i: "date", x: 0, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    { i: "weather", x: 3, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    { i: "search-console", x: 0, y: 3, w: 6, h: 5, minW: 4, minH: 4 },
    { i: "ga4", x: 0, y: 8, w: 6, h: 5, minW: 4, minH: 4 },
    { i: "axeauditor", x: 0, y: 13, w: 6, h: 4, minW: 4, minH: 4 },
    { i: "optimizely", x: 0, y: 17, w: 6, h: 7, minW: 4, minH: 5 },
    { i: "news", x: 0, y: 19, w: 3, h: 4, minW: 3, minH: 3 },
    { i: "github-trends", x: 3, y: 19, w: 3, h: 4, minW: 3, minH: 3 },
    { i: "wtt", x: 0, y: 23, w: 3, h: 4, minW: 3, minH: 3 },
    { i: "hsc", x: 3, y: 23, w: 3, h: 4, minW: 3, minH: 3 },
  ],
  sm: [
    { i: "date", x: 0, y: 0, w: 2, h: 3, minW: 2, minH: 2 },
    { i: "weather", x: 0, y: 3, w: 2, h: 3, minW: 2, minH: 2 },
    { i: "search-console", x: 0, y: 6, w: 2, h: 6, minW: 2, minH: 4 },
    { i: "ga4", x: 0, y: 10, w: 2, h: 5, minW: 2, minH: 4 },
    { i: "axeauditor", x: 0, y: 15, w: 2, h: 4, minW: 2, minH: 4 },
    { i: "optimizely", x: 0, y: 19, w: 2, h: 8, minW: 2, minH: 5 },
    { i: "news", x: 0, y: 23, w: 2, h: 4, minW: 2, minH: 3 },
    { i: "github-trends", x: 0, y: 27, w: 2, h: 4, minW: 2, minH: 3 },
    { i: "wtt", x: 0, y: 31, w: 2, h: 4, minW: 2, minH: 3 },
    { i: "hsc", x: 0, y: 35, w: 2, h: 4, minW: 2, minH: 3 },
  ],
};

export const initialLayouts: ProfileLayouts = {
  "chapter-overview": sharedLg,
  technology: {
    lg: [
      { i: "github-trends", x: 0, y: 0, w: 6, h: 6, minW: 4, minH: 4 },
      { i: "news", x: 6, y: 0, w: 6, h: 6, minW: 4, minH: 4 },
    ],
    md: [
      { i: "github-trends", x: 0, y: 0, w: 6, h: 6, minW: 4, minH: 4 },
      { i: "news", x: 0, y: 6, w: 6, h: 6, minW: 4, minH: 4 },
    ],
    sm: [
      { i: "github-trends", x: 0, y: 0, w: 2, h: 6, minW: 2, minH: 4 },
      { i: "news", x: 0, y: 6, w: 2, h: 6, minW: 2, minH: 4 },
    ],
  },
  "family-mode": {
    lg: [
      { i: "hsc", x: 0, y: 0, w: 7, h: 6, minW: 4, minH: 4 },
      { i: "wtt", x: 7, y: 0, w: 5, h: 6, minW: 3, minH: 4 },
      { i: "news", x: 0, y: 6, w: 12, h: 4, minW: 4, minH: 3 },
    ],
    md: [
      { i: "hsc", x: 0, y: 0, w: 6, h: 6, minW: 4, minH: 4 },
      { i: "wtt", x: 0, y: 6, w: 6, h: 5, minW: 3, minH: 4 },
      { i: "news", x: 0, y: 11, w: 6, h: 4, minW: 3, minH: 3 },
    ],
    sm: [
      { i: "hsc", x: 0, y: 0, w: 2, h: 6, minW: 2, minH: 4 },
      { i: "wtt", x: 0, y: 6, w: 2, h: 5, minW: 2, minH: 4 },
      { i: "news", x: 0, y: 11, w: 2, h: 4, minW: 2, minH: 3 },
    ],
  },
};

export const themeDefinitions: ThemeDefinition[] = [
  {
    id: "paper-clay",
    label: "Paper Clay",
    description: "Soft editorial neutrals with terracotta accents.",
    variables: {
      "--background": "#f5f0e8",
      "--background-elevated": "rgba(255, 252, 247, 0.82)",
      "--panel": "rgba(255, 251, 246, 0.78)",
      "--panel-strong": "rgba(255, 251, 246, 0.92)",
      "--foreground": "#1d2a39",
      "--muted": "#5e6a76",
      "--accent": "#b4572e",
      "--accent-soft": "rgba(180, 87, 46, 0.14)",
      "--accent-strong": "#8f3f1e",
      "--border": "rgba(29, 42, 57, 0.1)",
      "--shadow": "0 18px 48px rgba(61, 49, 34, 0.12)",
      "--pattern":
        "radial-gradient(circle at top left, rgba(180, 87, 46, 0.18), transparent 30%), radial-gradient(circle at 80% 20%, rgba(30, 111, 103, 0.12), transparent 28%), linear-gradient(180deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0))",
    },
  },
  {
    id: "sea-glass",
    label: "Sea Glass",
    description: "Cool, executive, and quietly technical.",
    variables: {
      "--background": "#e8f0f1",
      "--background-elevated": "rgba(248, 252, 252, 0.85)",
      "--panel": "rgba(245, 250, 250, 0.78)",
      "--panel-strong": "rgba(250, 253, 253, 0.95)",
      "--foreground": "#19323d",
      "--muted": "#5f747e",
      "--accent": "#0b7a75",
      "--accent-soft": "rgba(11, 122, 117, 0.13)",
      "--accent-strong": "#085e5b",
      "--border": "rgba(25, 50, 61, 0.12)",
      "--shadow": "0 18px 42px rgba(29, 72, 91, 0.12)",
      "--pattern":
        "radial-gradient(circle at 15% 10%, rgba(11, 122, 117, 0.16), transparent 26%), radial-gradient(circle at 90% 12%, rgba(132, 169, 172, 0.18), transparent 24%), linear-gradient(180deg, rgba(255, 255, 255, 0.28), rgba(255, 255, 255, 0))",
    },
  },
  {
    id: "midnight-ledger",
    label: "Midnight Ledger",
    description: "A darker board for denser operational use.",
    variables: {
      "--background": "#0f1720",
      "--background-elevated": "rgba(20, 29, 39, 0.84)",
      "--panel": "rgba(17, 25, 34, 0.8)",
      "--panel-strong": "rgba(20, 29, 39, 0.94)",
      "--foreground": "#ebf2f7",
      "--muted": "#99acba",
      "--accent": "#f2a65a",
      "--accent-soft": "rgba(242, 166, 90, 0.14)",
      "--accent-strong": "#ffbf7d",
      "--border": "rgba(235, 242, 247, 0.1)",
      "--shadow": "0 22px 48px rgba(0, 0, 0, 0.34)",
      "--pattern":
        "radial-gradient(circle at 10% 10%, rgba(242, 166, 90, 0.18), transparent 26%), radial-gradient(circle at 85% 15%, rgba(86, 111, 141, 0.18), transparent 22%), linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0))",
    },
  },
];

export const publicFeedCatalog: PublicFeedOption[] = [
  {
    id: "weather-open-meteo",
    title: "Open-Meteo",
    description: "Free weather and forecast data without API keys for the first pass.",
    mode: "free",
    notes: "Great default for your weather card; no auth setup needed.",
  },
  {
    id: "news-gnews",
    title: "GNews",
    description: "A simple developer-friendly headline API with a free tier.",
    mode: "free-tier",
    notes: "Useful for a compact executive news card.",
  },
  {
    id: "github-trending-ecosyste-ms",
    title: "ecosyste.ms",
    description: "Open data endpoints for repository activity and ecosystem signals.",
    mode: "free",
    notes: "Good candidate for AI/frontend repo watchlists without scraping GitHub.",
  },
  {
    id: "wtt",
    title: "WTT / ITTF web data",
    description: "Likely requires a custom adapter unless an official feed is available.",
    mode: "free",
    notes: "I can help evaluate the cleanest compliant source once we reach that widget.",
  },
  {
    id: "nsw-education",
    title: "NSW Education and NESA resources",
    description: "Public pages and resources for HSC-related study support.",
    mode: "free",
    notes: "Best treated as curated links plus smart summaries in the early version.",
  },
];
