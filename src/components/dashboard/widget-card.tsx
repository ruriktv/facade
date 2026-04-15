"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  BreakpointKey,
  DashboardProfile,
  PublicFeedOption,
  WidgetDefinition,
} from "@/lib/dashboard-data";
import {
  Activity,
  BadgeCheck,
  CalendarDays,
  ChartSpline,
  Check,
  ChevronDown,
  ChevronUp,
  CloudSun,
  FlaskConical,
  GraduationCap,
  Newspaper,
  RefreshCw,
  SearchCheck,
  TableProperties,
  Trophy,
} from "lucide-react";
import clsx from "clsx";

type WidgetCardProps = {
  widget: WidgetDefinition;
  activeProfile: DashboardProfile;
  publicFeedCatalog: PublicFeedOption[];
  breakpoint: BreakpointKey;
};

const dateFormatter = new Intl.DateTimeFormat("en-AU", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-AU", {
  hour: "numeric",
  minute: "2-digit",
});

const widgetIcons = {
  date: CalendarDays,
  weather: CloudSun,
  searchConsole: SearchCheck,
  ga4: Activity,
  accessibility: BadgeCheck,
  optimizely: FlaskConical,
  news: Newspaper,
  github: TableProperties,
  wtt: Trophy,
  hsc: GraduationCap,
};

const cwvProperties = [
  {
    name: "Primary Commerce",
    domain: "www.example.com",
    good: "84%",
    needsImprovement: "11%",
    poor: "5%",
    lcp: "2.1s",
    inp: "168ms",
    cls: "0.04",
  },
  {
    name: "Content Hub",
    domain: "content.example.com",
    good: "79%",
    needsImprovement: "15%",
    poor: "6%",
    lcp: "2.4s",
    inp: "190ms",
    cls: "0.06",
  },
  {
    name: "Campaign Microsites",
    domain: "offers.example.com",
    good: "88%",
    needsImprovement: "8%",
    poor: "4%",
    lcp: "1.9s",
    inp: "145ms",
    cls: "0.03",
  },
];

const optimizelyCampaigns = {
  running: [
    {
      title: "Checkout CTA",
      owner: "Alice",
      url: "/checkout",
      audiences: "All visitors, Checkout starters",
      daysRunning: "18 days",
      pageReach: "541,770",
      audienceReach: "99.53%",
      uniqueConversionSessions: "14,219",
      conversionLift: "+3.8%",
      confidence: "93%",
      significance: "Approaching",
    },
    {
      title: "PLP trust block",
      owner: "Ben",
      url: "/mens/*",
      audiences: "Mens shoppers, Returning visitors",
      daysRunning: "11 days",
      pageReach: "318,402",
      audienceReach: "72.10%",
      uniqueConversionSessions: "9,102",
      conversionLift: "+2.4%",
      confidence: "89%",
      significance: "Monitoring",
    },
    {
      title: "Homepage promo",
      owner: "Cara",
      url: "/",
      audiences: "Homepage traffic, Mobile visitors",
      daysRunning: "6 days",
      pageReach: "764,981",
      audienceReach: "100%",
      uniqueConversionSessions: "22,114",
      conversionLift: "+1.6%",
      confidence: "81%",
      significance: "Early",
    },
  ],
  paused: [
    {
      title: "Cart reassurance",
      owner: "Derek",
      url: "/cart",
      audiences: "Cart abandoners, Signed-in users",
      daysRunning: "24 days",
      pageReach: "184,300",
      audienceReach: "91.40%",
      uniqueConversionSessions: "6,941",
      conversionLift: "-0.4%",
      confidence: "54%",
      significance: "No winner",
    },
    {
      title: "PDP shipping callout",
      owner: "Emma",
      url: "/product/*",
      audiences: "Product detail viewers, Paid traffic",
      daysRunning: "14 days",
      pageReach: "205,441",
      audienceReach: "84.09%",
      uniqueConversionSessions: "7,338",
      conversionLift: "+0.9%",
      confidence: "61%",
      significance: "Paused",
    },
  ],
};

const OPTIMIZELY_CACHE_KEY = "facade-optimizely-cache-v3";
const OPTIMIZELY_CACHE_TTL_MS = 8 * 60 * 60 * 1000;
const OPTIMIZELY_RESULT_CACHE_KEY_PREFIX = "facade-optimizely-result-v1";
const SEARCH_CONSOLE_CACHE_KEY = "facade-search-console-cache-v1";
const GA4_CACHE_KEY = "facade-ga4-cache-v1";
const GOOGLE_WIDGET_CACHE_TTL_MS = 8 * 60 * 60 * 1000;

type GoogleSearchConsoleResponse = {
  ready: boolean;
  message: string;
  authUrl?: string;
  summaries?: Array<{
    property: string;
    origin?: string;
    coreWebVitalsUrl?: string;
    httpsUrl?: string;
    clicks?: number;
    impressions?: number;
    ctr?: number;
    avgPosition?: number;
    hasCruxApiKey?: boolean;
    crux?: {
      labels: string[];
      lcp: Array<number | string | null>;
      inp: Array<number | string | null>;
      cls: Array<number | string | null>;
    } | null;
    error?: string;
  }>;
};

type GoogleGa4Response = {
  ready: boolean;
  message: string;
  authUrl?: string;
  summaries?: Array<{
    label: string;
    id: string;
    sessions?: number;
    engagedSessions?: number;
    conversions?: number;
    error?: string;
  }>;
};

type LiveOptimizelyResponse = {
  ready: boolean;
  message: string;
  projects: Array<{ id: number; name: string }>;
  owners: string[];
  counts?: {
    projects: number;
    running: number;
    paused: number;
    notStarted: number;
  };
  campaigns: Array<{
    id: number;
    projectId: number;
    projectName: string;
    title: string;
    status: string;
    type: string;
    owner: string;
    lastUpdatedAt: string | null;
    url: string;
    targetSummary: string;
    fullTargeting: string;
    audiences: string[];
    daysRunning: number;
    quickMetric: string | null;
  }>;
};

type CampaignViewModel = {
  id: number | string;
  projectId: number;
  projectName: string;
  title: string;
  status: string;
  type: string;
  owner: string;
  lastUpdatedAt: string | null;
  url: string;
  targetSummary: string;
  fullTargeting: string;
  audiences: string;
  daysRunning: string;
  pageReach: string;
  audienceReach: string;
  uniqueConversionSessions: string;
  conversionLift: string;
  confidence: string;
  significance: string;
};

type ExperimentResultResponse = {
  ready: boolean;
  message: string;
  experimentId: number;
  pageReach: string;
  audienceReach: string;
  uniqueConversionSessions: string;
  conversionLift: string;
  confidence: string;
  significance: string;
};

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-border bg-background-elevated px-3 py-2">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}

function SummaryFilterPill({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "rounded-[16px] border px-3 py-2 text-left transition",
        active
          ? "border-accent bg-accent-soft shadow-[inset_0_0_0_1px_var(--accent)]"
          : "border-border bg-background-elevated hover:border-accent/40",
      )}
    >
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </button>
  );
}

function LoadingSpinner({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[18px] border border-border bg-background-elevated px-4 py-3 text-sm text-muted">
      <span className="inline-flex h-5 w-5 animate-spin rounded-full border-2 border-border border-t-accent" />
      <span>{label}</span>
    </div>
  );
}

function WidgetLoadingOverlay({ label }: { label: string }) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[22px] bg-panel-strong/86 backdrop-blur-sm">
      <LoadingSpinner label={label} />
    </div>
  );
}

function getCachedPayload<T>(cacheKey: string) {
  try {
    const cached = window.localStorage.getItem(cacheKey);
    if (!cached) {
      return null;
    }

    return JSON.parse(cached) as {
      updatedAt?: number;
      data?: T;
    };
  } catch {
    return null;
  }
}

function formatCacheWindow(updatedAt: number | null, ttlMs: number) {
  if (!updatedAt) {
    return "No cache yet";
  }

  const formatOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  };

  const refreshedAt = new Date(updatedAt).toLocaleString("en-AU", formatOptions);
  const refreshBy = new Date(updatedAt + ttlMs).toLocaleString("en-AU", formatOptions);

  return `Cached ${refreshedAt}. Refreshes by ${refreshBy}`;
}

function LineTrend() {
  const points = [70, 66, 74, 82, 78, 88, 92];
  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${index * 48} ${100 - point}`)
    .join(" ");

  return (
    <div className="mt-4 rounded-[22px] border border-border bg-background-elevated px-4 py-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Campaign sessions trend</div>
          <div className="text-sm text-muted">Last 7 reporting points</div>
        </div>
        <ChartSpline size={18} className="text-accent" />
      </div>
      <svg viewBox="0 0 288 100" className="mt-4 h-28 w-full overflow-visible">
        <defs>
          <linearGradient id="ga-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path
          d={`${path} L 288 100 L 0 100 Z`}
          fill="url(#ga-fill)"
          stroke="none"
        />
        <path
          d={path}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function CwvPropertyCard({
  name,
  domain,
  good,
  needsImprovement,
  poor,
  lcp,
  inp,
  cls,
}: (typeof cwvProperties)[number]) {
  return (
    <div className="rounded-[20px] border border-border bg-background-elevated px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold">{name}</div>
          <div className="truncate font-mono text-xs text-muted">{domain}</div>
        </div>
        <div className="rounded-full bg-accent-soft px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
          Good {good}
        </div>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <InfoPill label="Need work" value={needsImprovement} />
        <InfoPill label="Poor" value={poor} />
        <InfoPill label="LCP / INP / CLS" value={`${lcp} / ${inp} / ${cls}`} />
      </div>
    </div>
  );
}

function TinyTrend({
  values,
  color,
}: {
  values: Array<number | string | null>;
  color: string;
}) {
  const points = values
    .map((value) => (typeof value === "string" ? Number(value) : value))
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));

  if (!points.length) {
    return <div className="h-16 rounded-[16px] border border-border bg-panel" />;
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const spread = max - min || 1;
  const path = points
    .map((point, index) => {
      const x = points.length === 1 ? 0 : (index / (points.length - 1)) * 100;
      const y = 100 - ((point - min) / spread) * 100;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 100" className="h-16 w-full overflow-visible">
      <path d={path} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function CampaignRow({
  campaign,
  isExpanded,
  onToggle,
}: {
  campaign: CampaignViewModel;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const [resultData, setResultData] = useState<ExperimentResultResponse | null>(null);
  const [isResultLoading, setIsResultLoading] = useState(false);

  useEffect(() => {
    if (!isExpanded || typeof campaign.id !== "number") {
      return;
    }

    let cancelled = false;
    const cacheKey = `${OPTIMIZELY_RESULT_CACHE_KEY_PREFIX}-${campaign.id}`;

    try {
      const cached = window.localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as {
          data?: ExperimentResultResponse;
        };

        if (!cancelled && parsed.data) {
          setResultData(parsed.data);
        }
      }
    } catch {
      // Ignore bad cached result payloads.
    }

    async function loadResults() {
      setIsResultLoading(true);
      try {
        const response = await fetch(`/api/optimizely/experiments/${campaign.id}/results`, {
          cache: "no-store",
        });
        const data = (await response.json()) as ExperimentResultResponse;
        if (!cancelled) {
          setResultData(data);
          window.localStorage.setItem(cacheKey, JSON.stringify({ data }));
        }
      } catch {
        // Keep cached value if request fails.
      } finally {
        if (!cancelled) {
          setIsResultLoading(false);
        }
      }
    }

    void loadResults();

    return () => {
      cancelled = true;
    };
  }, [campaign.id, isExpanded]);

  return (
    <div className="rounded-[20px] border border-border bg-background-elevated px-4 py-3">
      <button type="button" onClick={onToggle} className="block w-full text-left">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold">{campaign.title}</div>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
              <span>Type: {campaign.type}</span>
              <span>Last update by: {campaign.owner}</span>
              <span>Days Running: {campaign.daysRunning}</span>
              <span>Audience: {campaign.audiences}</span>
              <span>Target: {campaign.targetSummary}</span>
            </div>
          </div>
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-panel-strong text-accent">
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
      </button>
      {isExpanded ? (
        <div className="mt-4">
          {isResultLoading ? <LoadingSpinner label="Loading experiment results..." /> : null}
          <div className="grid gap-2 md:grid-cols-2">
            <InfoPill
              label="Page reach"
              value={resultData?.pageReach ?? `${campaign.pageReach} sessions`}
            />
            <InfoPill
              label="Audience reach"
              value={resultData?.audienceReach ?? campaign.audienceReach}
            />
            <InfoPill
              label="Unique conv. sessions"
              value={resultData?.uniqueConversionSessions ?? campaign.uniqueConversionSessions}
            />
            <InfoPill
              label="CVR improvement"
              value={resultData?.conversionLift ?? campaign.conversionLift}
            />
            <InfoPill
              label="Confidence interval"
              value={resultData?.confidence ?? campaign.confidence}
            />
            <InfoPill
              label="Statistical sig."
              value={resultData?.significance ?? campaign.significance}
            />
            <InfoPill
              label="Updated at"
              value={
                campaign.lastUpdatedAt
                  ? new Date(campaign.lastUpdatedAt).toLocaleString("en-AU", {
                      year: "numeric",
                      month: "short",
                      day: "2-digit",
                      hour: "numeric",
                      minute: "2-digit",
                    })
                  : "Unavailable"
              }
            />
          </div>
          <div className="mt-3 rounded-[18px] border border-border bg-panel px-3 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
              Full targeting rule
            </div>
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words text-sm leading-6 text-muted">
              {campaign.fullTargeting}
            </pre>
          </div>
          {resultData?.message ? (
            <div className="mt-3 text-sm leading-6 text-muted">{resultData.message}</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function DashboardWidgetCard({
  widget,
  activeProfile,
  publicFeedCatalog,
  breakpoint,
}: WidgetCardProps) {
  const Icon = widgetIcons[widget.kind];
  const topFeed = publicFeedCatalog[0];
  const [clientNow, setClientNow] = useState<Date | null>(null);
  const [campaignTab, setCampaignTab] = useState<"running" | "paused" | "not_started">("running");
  const [activeControl, setActiveControl] = useState<
    "running" | "paused" | "not_started" | "owners" | "projects"
  >("running");
  const [expandedCampaigns, setExpandedCampaigns] = useState<Record<string, boolean>>({});
  const [selectedOwners, setSelectedOwners] = useState<string[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
  const [liveOptimizely, setLiveOptimizely] = useState<LiveOptimizelyResponse | null>(null);
  const [isOptimizelyLoading, setIsOptimizelyLoading] = useState(false);
  const [optimizelyUpdatedAt, setOptimizelyUpdatedAt] = useState<number | null>(null);
  const [searchConsoleData, setSearchConsoleData] = useState<GoogleSearchConsoleResponse | null>(null);
  const [ga4Data, setGa4Data] = useState<GoogleGa4Response | null>(null);
  const [isSearchConsoleLoading, setIsSearchConsoleLoading] = useState(false);
  const [isGa4Loading, setIsGa4Loading] = useState(false);
  const [searchConsoleUpdatedAt, setSearchConsoleUpdatedAt] = useState<number | null>(null);
  const [ga4UpdatedAt, setGa4UpdatedAt] = useState<number | null>(null);
  const isCompact = breakpoint === "sm";

  useEffect(() => {
    if (widget.kind !== "date") {
      return;
    }

    setClientNow(new Date());
    const interval = window.setInterval(() => {
      setClientNow(new Date());
    }, 60_000);

    return () => {
      window.clearInterval(interval);
    };
  }, [widget.kind]);

  useEffect(() => {
    if (widget.kind !== "searchConsole") {
      return;
    }

    let cancelled = false;
    const googleStatus =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("google")
        : null;
    const shouldForceGoogleRefresh = googleStatus === "connected";

    const cached = shouldForceGoogleRefresh
      ? null
      : getCachedPayload<GoogleSearchConsoleResponse>(SEARCH_CONSOLE_CACHE_KEY);
    if (cached?.data) {
      setSearchConsoleData(cached.data);
      setSearchConsoleUpdatedAt(cached.updatedAt ?? null);
    } else if (shouldForceGoogleRefresh) {
      window.localStorage.removeItem(SEARCH_CONSOLE_CACHE_KEY);
    }

    async function loadSearchConsole(forceRefresh = false) {
      setIsSearchConsoleLoading(true);
      try {
        const response = await fetch(
          `/api/google/search-console${forceRefresh ? "?refresh=1" : ""}`,
          { cache: "no-store" },
        );
        const data = (await response.json()) as GoogleSearchConsoleResponse;
        if (!cancelled) {
          const updatedAt = Date.now();
          setSearchConsoleData(data);
          setSearchConsoleUpdatedAt(updatedAt);
          window.localStorage.setItem(
            SEARCH_CONSOLE_CACHE_KEY,
            JSON.stringify({
              updatedAt,
              data,
            }),
          );
        }
      } finally {
        if (!cancelled) {
          setIsSearchConsoleLoading(false);
        }
      }
    }

    const shouldUseCache =
      typeof cached?.updatedAt === "number" &&
      Date.now() - cached.updatedAt < GOOGLE_WIDGET_CACHE_TTL_MS;

    if (!cached?.data || !shouldUseCache || shouldForceGoogleRefresh) {
      void loadSearchConsole(shouldForceGoogleRefresh);
    }

    return () => {
      cancelled = true;
    };
  }, [widget.kind]);

  useEffect(() => {
    if (widget.kind !== "ga4") {
      return;
    }

    let cancelled = false;
    const googleStatus =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("google")
        : null;
    const shouldForceGoogleRefresh = googleStatus === "connected";

    const cached = shouldForceGoogleRefresh ? null : getCachedPayload<GoogleGa4Response>(GA4_CACHE_KEY);
    if (cached?.data) {
      setGa4Data(cached.data);
      setGa4UpdatedAt(cached.updatedAt ?? null);
    } else if (shouldForceGoogleRefresh) {
      window.localStorage.removeItem(GA4_CACHE_KEY);
    }

    async function loadGa4(forceRefresh = false) {
      setIsGa4Loading(true);
      try {
        const response = await fetch(`/api/google/ga4${forceRefresh ? "?refresh=1" : ""}`, {
          cache: "no-store",
        });
        const data = (await response.json()) as GoogleGa4Response;
        if (!cancelled) {
          const updatedAt = Date.now();
          setGa4Data(data);
          setGa4UpdatedAt(updatedAt);
          window.localStorage.setItem(
            GA4_CACHE_KEY,
            JSON.stringify({
              updatedAt,
              data,
            }),
          );
        }
      } finally {
        if (!cancelled) {
          setIsGa4Loading(false);
        }
      }
    }

    const shouldUseCache =
      typeof cached?.updatedAt === "number" &&
      Date.now() - cached.updatedAt < GOOGLE_WIDGET_CACHE_TTL_MS;

    if (!cached?.data || !shouldUseCache || shouldForceGoogleRefresh) {
      void loadGa4(shouldForceGoogleRefresh);
    }

    return () => {
      cancelled = true;
    };
  }, [widget.kind]);

  useEffect(() => {
    if (widget.kind !== "optimizely") {
      return;
    }

    const cached = getCachedPayload<LiveOptimizelyResponse>(OPTIMIZELY_CACHE_KEY);
    if (cached?.data) {
      setLiveOptimizely(cached.data);
      setOptimizelyUpdatedAt(cached.updatedAt ?? null);
    }
  }, [widget.kind]);

  useEffect(() => {
    if (widget.kind !== "optimizely") {
      return;
    }

    const shouldUseCache =
      typeof optimizelyUpdatedAt === "number" &&
      Date.now() - optimizelyUpdatedAt < OPTIMIZELY_CACHE_TTL_MS;

    if (!liveOptimizely || !shouldUseCache) {
      void refreshOptimizelyData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widget.kind]);

  const refreshOptimizelyData = async (forceRefresh = false) => {
    setIsOptimizelyLoading(true);

    try {
      const response = await fetch(
        `/api/optimizely/experiments${forceRefresh ? "?refresh=1" : ""}`,
        { cache: "no-store" },
      );
      const data = (await response.json()) as LiveOptimizelyResponse;
      const updatedAt = Date.now();
      setLiveOptimizely(data);
      setOptimizelyUpdatedAt(updatedAt);
      window.localStorage.setItem(OPTIMIZELY_CACHE_KEY, JSON.stringify({ updatedAt, data }));
    } catch {
      // Keep last known good cache if refresh fails.
    } finally {
      setIsOptimizelyLoading(false);
    }
  };

  const effectiveCampaigns = useMemo<CampaignViewModel[]>(() => {
    if (liveOptimizely?.campaigns?.length) {
      return liveOptimizely.campaigns.map((campaign) => ({
        id: campaign.id,
        projectId: campaign.projectId,
        projectName: campaign.projectName,
        title: campaign.title,
        status: campaign.status,
        type: campaign.type,
        owner: campaign.owner,
        lastUpdatedAt: campaign.lastUpdatedAt,
        url: campaign.url,
        targetSummary: campaign.targetSummary,
        fullTargeting: campaign.fullTargeting,
        audiences: campaign.audiences.join(", "),
        daysRunning: `${campaign.daysRunning} days`,
        pageReach: "Unavailable",
        audienceReach: "Unavailable",
        uniqueConversionSessions: campaign.quickMetric ?? "Unavailable",
        conversionLift: "Unavailable",
        confidence: "Unavailable",
        significance: "Unavailable",
      }));
    }

    return [
      ...optimizelyCampaigns.running.map((campaign, index) => ({
        ...campaign,
        id: `demo-running-${index}`,
        projectId: 1,
        projectName: "Demo Project",
        status: "running",
        type: "personalization",
        lastUpdatedAt: null,
        targetSummary: campaign.url,
        fullTargeting: `Edit URL: ${campaign.url}\nRules: Demo targeting`,
      })),
      ...optimizelyCampaigns.paused.map((campaign, index) => ({
        ...campaign,
        id: `demo-paused-${index}`,
        projectId: 1,
        projectName: "Demo Project",
        status: "paused",
        type: "personalization",
        lastUpdatedAt: null,
        targetSummary: campaign.url,
        fullTargeting: `Edit URL: ${campaign.url}\nRules: Demo targeting`,
      })),
    ];
  }, [liveOptimizely]);

  const ownerOptions = useMemo(() => {
    if (liveOptimizely?.owners?.length) {
      return liveOptimizely.owners;
    }

    return [...new Set(effectiveCampaigns.map((campaign) => campaign.owner))];
  }, [effectiveCampaigns, liveOptimizely]);

  const projectOptions = useMemo(() => {
    if (liveOptimizely?.projects?.length) {
      return liveOptimizely.projects;
    }

    return [{ id: 1, name: "Demo Project" }];
  }, [liveOptimizely]);

  const visibleCampaigns = useMemo(() => {
    return effectiveCampaigns.filter((campaign) => {
      const statusMatch = campaign.status === campaignTab;
      const ownerMatch = !selectedOwners.length || selectedOwners.includes(campaign.owner);
      const projectMatch =
        !selectedProjects.length || selectedProjects.includes(campaign.projectId);
      return statusMatch && ownerMatch && projectMatch;
    });
  }, [campaignTab, effectiveCampaigns, selectedOwners, selectedProjects]);

  const filteredCampaignsExcludingStatus = useMemo(() => {
    return effectiveCampaigns.filter((campaign) => {
      const ownerMatch = !selectedOwners.length || selectedOwners.includes(campaign.owner);
      const projectMatch =
        !selectedProjects.length || selectedProjects.includes(campaign.projectId);
      return ownerMatch && projectMatch;
    });
  }, [effectiveCampaigns, selectedOwners, selectedProjects]);

  const runningCount = filteredCampaignsExcludingStatus.filter(
    (campaign) => campaign.status === "running",
  ).length;
  const pausedCount = filteredCampaignsExcludingStatus.filter(
    (campaign) => campaign.status === "paused",
  ).length;
  const notStartedCount = filteredCampaignsExcludingStatus.filter(
    (campaign) => campaign.status === "not_started",
  ).length;

  const toggleOwner = (owner: string) => {
    setSelectedOwners((current) =>
      current.includes(owner) ? current.filter((item) => item !== owner) : [...current, owner],
    );
  };

  const toggleProject = (projectId: number) => {
    setSelectedProjects((current) =>
      current.includes(projectId)
        ? current.filter((item) => item !== projectId)
        : [...current, projectId],
    );
  };

  const toggleCampaignExpanded = (campaignKey: string) => {
    setExpandedCampaigns((current) => ({
      ...current,
      [campaignKey]: !current[campaignKey],
    }));
  };

  return (
    <article className="flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] border border-border bg-panel-strong p-4 shadow-card backdrop-blur-xl">
      <div className="widget-drag-handle flex cursor-grab items-start justify-between gap-3 rounded-[20px]">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-accent-soft text-accent">
              <Icon size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-[1.9rem] leading-none font-normal tracking-[0.03em] sm:text-[2.15rem]">
                {widget.title}
              </h2>
              <p className="line-clamp-2 text-sm leading-6 text-muted">{widget.subtitle}</p>
            </div>
          </div>
        </div>
        <div className="shrink-0 rounded-full bg-foreground/[0.06] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
          {widget.category}
        </div>
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-hidden">
        {widget.kind === "date" ? (
          <div className="flex h-full flex-col justify-between gap-4">
            <div>
              <div className="text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
                {clientNow ? timeFormatter.format(clientNow) : "--:--"}
              </div>
              <div className="mt-2 text-base text-muted">
                {clientNow ? dateFormatter.format(clientNow) : "Loading date..."}
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <InfoPill label="Profile" value={activeProfile.name} />
              <InfoPill label="Focus" value="CRO review" />
            </div>
          </div>
        ) : null}

        {widget.kind === "weather" ? (
          <div className="flex h-full flex-col justify-between gap-4">
            <div className="grid gap-3">
              <div>
                <div className="text-sm uppercase tracking-[0.18em] text-muted">Sydney</div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="text-5xl font-semibold tracking-[-0.06em]">23°</div>
                  <CloudSun size={46} className="shrink-0 text-accent" />
                  <div className="text-sm leading-6 text-muted">
                    Mild with light coastal winds. Great candidate for `Open-Meteo` in v1.
                  </div>
                </div>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <InfoPill label="Feels like" value="24°" />
              <InfoPill label="Rain" value="10%" />
              <InfoPill label="Source" value={topFeed.title} />
            </div>
          </div>
        ) : null}

        {widget.kind === "searchConsole" ? (
          <div className="dashboard-scrollbar flex h-full min-h-0 flex-col gap-3 overflow-y-auto pr-1">
            {isSearchConsoleLoading ? <LoadingSpinner label="Loading Search Console..." /> : null}
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs uppercase tracking-[0.16em] text-muted">
                {formatCacheWindow(searchConsoleUpdatedAt, GOOGLE_WIDGET_CACHE_TTL_MS)}
              </div>
              <button
                type="button"
                onClick={async () => {
                  setIsSearchConsoleLoading(true);
                  try {
                    const response = await fetch("/api/google/search-console?refresh=1", {
                      cache: "no-store",
                    });
                    const data = (await response.json()) as GoogleSearchConsoleResponse;
                    const updatedAt = Date.now();
                    setSearchConsoleData(data);
                    setSearchConsoleUpdatedAt(updatedAt);
                    window.localStorage.setItem(
                      SEARCH_CONSOLE_CACHE_KEY,
                      JSON.stringify({ updatedAt, data }),
                    );
                  } finally {
                    setIsSearchConsoleLoading(false);
                  }
                }}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background-elevated text-muted transition hover:border-accent/40"
                aria-label="Refresh Search Console data"
                title="Refresh Search Console data"
              >
                <RefreshCw size={14} className={clsx(isSearchConsoleLoading && "animate-spin")} />
              </button>
            </div>
            {searchConsoleData?.authUrl ? (
              <div className="rounded-[20px] border border-border bg-background-elevated px-4 py-4">
                <div className="text-sm font-semibold">Connect Google to Search Console</div>
                <div className="mt-2 text-sm leading-6 text-muted">{searchConsoleData.message}</div>
                <a
                  href={searchConsoleData.authUrl}
                  className="mt-3 inline-flex rounded-full border border-border px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted transition hover:border-accent/40"
                >
                  Connect Google
                </a>
              </div>
            ) : searchConsoleData?.ready && searchConsoleData.summaries?.length ? (
              <>
                <div className="grid gap-2 sm:grid-cols-3">
                  <InfoPill label="Tracked properties" value={`${searchConsoleData.summaries.length}`} />
                  <InfoPill
                    label="Total clicks"
                    value={`${searchConsoleData.summaries.reduce((sum, item) => sum + (item.clicks ?? 0), 0)}`}
                  />
                  <InfoPill
                    label="Total impressions"
                    value={`${searchConsoleData.summaries.reduce((sum, item) => sum + (item.impressions ?? 0), 0)}`}
                  />
                </div>
                {searchConsoleData.summaries.map((summary) => (
                  <div
                    key={summary.property}
                    className="rounded-[20px] border border-border bg-background-elevated px-4 py-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold">{summary.property}</div>
                        <div className="mt-1 text-xs text-muted">{summary.origin}</div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {summary.coreWebVitalsUrl ? (
                          <a
                            href={summary.coreWebVitalsUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex rounded-full border border-border px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted transition hover:border-accent/40"
                          >
                            CWV
                          </a>
                        ) : null}
                        {summary.httpsUrl ? (
                          <a
                            href={summary.httpsUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex rounded-full border border-border px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted transition hover:border-accent/40"
                          >
                            HTTPS
                          </a>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-4">
                      <InfoPill label="Clicks" value={`${summary.clicks ?? 0}`} />
                      <InfoPill label="Impressions" value={`${summary.impressions ?? 0}`} />
                      <InfoPill label="CTR" value={`${((summary.ctr ?? 0) * 100).toFixed(2)}%`} />
                      <InfoPill label="Avg position" value={`${(summary.avgPosition ?? 0).toFixed(1)}`} />
                    </div>
                    <div className="mt-4 grid gap-3 lg:grid-cols-3">
                      <div className="rounded-[16px] border border-border bg-panel px-3 py-3">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                          LCP p75 trend
                        </div>
                        <div className="mt-1 text-[11px] leading-5 text-muted">
                          Largest Contentful Paint, the main loading-speed signal.
                        </div>
                        <div className="mt-2">
                          <TinyTrend values={summary.crux?.lcp ?? []} color="var(--accent)" />
                        </div>
                      </div>
                      <div className="rounded-[16px] border border-border bg-panel px-3 py-3">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                          INP p75 trend
                        </div>
                        <div className="mt-1 text-[11px] leading-5 text-muted">
                          Interaction to Next Paint, the responsiveness signal.
                        </div>
                        <div className="mt-2">
                          <TinyTrend values={summary.crux?.inp ?? []} color="#1e6f67" />
                        </div>
                      </div>
                      <div className="rounded-[16px] border border-border bg-panel px-3 py-3">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                          CLS p75 trend
                        </div>
                        <div className="mt-1 text-[11px] leading-5 text-muted">
                          Cumulative Layout Shift, the visual-stability signal.
                        </div>
                        <div className="mt-2">
                          <TinyTrend values={summary.crux?.cls ?? []} color="#6e4bb8" />
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 text-[11px] leading-5 text-muted">
                      Trend window: last 12 weekly points, each based on a 28-day rolling field-data window from CrUX.
                    </div>
                    <div className="mt-3 rounded-[16px] border border-border bg-panel px-3 py-3 text-sm leading-6 text-muted">
                      Property-level counts of `Good`, `Needs improvement`, and `Poor` URLs for
                      `Mobile` and `Desktop` are available in the Search Console UI, but Google
                      does not expose those same URL counts through the public Search Console or
                      CrUX APIs. Use the `CWV` button for the authoritative report in Google.
                    </div>
                    {!summary.hasCruxApiKey ? (
                      <div className="mt-3 text-sm leading-6 text-muted">
                        Add `GOOGLE_API_KEY` with the Chrome UX Report API enabled to populate Core Web Vitals charts.
                      </div>
                    ) : null}
                    {summary.error ? (
                      <div className="mt-3 text-sm leading-6 text-muted">{summary.error}</div>
                    ) : null}
                  </div>
                ))}
              </>
            ) : (
              <>
                <div className="grid gap-2 sm:grid-cols-3">
                  <InfoPill label="Tracked properties" value="3" />
                  <InfoPill label="Worst trend" value="INP drift" />
                  <InfoPill label="Priority" value="Commerce home + PLP" />
                </div>
                {cwvProperties.map((property) => (
                  <CwvPropertyCard key={property.domain} {...property} />
                ))}
              </>
            )}
          </div>
        ) : null}

        {widget.kind === "ga4" ? (
          <div className="dashboard-scrollbar flex h-full min-h-0 flex-col gap-4 overflow-y-auto pr-1">
            {isGa4Loading ? <LoadingSpinner label="Loading GA4..." /> : null}
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs uppercase tracking-[0.16em] text-muted">
                {formatCacheWindow(ga4UpdatedAt, GOOGLE_WIDGET_CACHE_TTL_MS)}
              </div>
              <button
                type="button"
                onClick={async () => {
                  setIsGa4Loading(true);
                  try {
                    const response = await fetch("/api/google/ga4?refresh=1", {
                      cache: "no-store",
                    });
                    const data = (await response.json()) as GoogleGa4Response;
                    const updatedAt = Date.now();
                    setGa4Data(data);
                    setGa4UpdatedAt(updatedAt);
                    window.localStorage.setItem(
                      GA4_CACHE_KEY,
                      JSON.stringify({ updatedAt, data }),
                    );
                  } finally {
                    setIsGa4Loading(false);
                  }
                }}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background-elevated text-muted transition hover:border-accent/40"
                aria-label="Refresh GA4 data"
                title="Refresh GA4 data"
              >
                <RefreshCw size={14} className={clsx(isGa4Loading && "animate-spin")} />
              </button>
            </div>
            {ga4Data?.authUrl ? (
              <div className="rounded-[20px] border border-border bg-background-elevated px-4 py-4">
                <div className="text-sm font-semibold">Connect Google to GA4</div>
                <div className="mt-2 text-sm leading-6 text-muted">{ga4Data.message}</div>
                <a
                  href={ga4Data.authUrl}
                  className="mt-3 inline-flex rounded-full border border-border px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted transition hover:border-accent/40"
                >
                  Connect Google
                </a>
              </div>
            ) : ga4Data?.ready && ga4Data.summaries?.length ? (
              <>
                <div className="grid gap-2 sm:grid-cols-4">
                  <InfoPill
                    label="Sessions"
                    value={`${ga4Data.summaries.reduce((sum, item) => sum + (item.sessions ?? 0), 0)}`}
                  />
                  <InfoPill
                    label="Engaged"
                    value={`${ga4Data.summaries.reduce((sum, item) => sum + (item.engagedSessions ?? 0), 0)}`}
                  />
                  <InfoPill
                    label="Conversions"
                    value={`${ga4Data.summaries.reduce((sum, item) => sum + (item.conversions ?? 0), 0)}`}
                  />
                  <InfoPill label="Properties" value={`${ga4Data.summaries.length}`} />
                </div>
                <LineTrend />
                <div className="space-y-3">
                  {ga4Data.summaries.map((summary) => (
                    <div
                      key={`${summary.label}-${summary.id}`}
                      className="rounded-[20px] border border-border bg-background-elevated px-4 py-4"
                    >
                      <div className="text-sm font-semibold">{summary.label}</div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-3">
                        <InfoPill label="Sessions" value={`${summary.sessions ?? 0}`} />
                        <InfoPill label="Engaged" value={`${summary.engagedSessions ?? 0}`} />
                        <InfoPill label="Conversions" value={`${summary.conversions ?? 0}`} />
                      </div>
                      {summary.error ? (
                        <div className="mt-3 text-sm leading-6 text-muted">{summary.error}</div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="grid gap-2 sm:grid-cols-4">
                  <InfoPill label="Campaign sessions" value="8.9K" />
                  <InfoPill label="Engaged sessions" value="6.1K" />
                  <InfoPill label="Conversions" value="428" />
                  <InfoPill label="CVR" value="4.8%" />
                </div>
                <LineTrend />
                <div className="rounded-[20px] border border-border bg-background-elevated px-4 py-4">
                  <div className="text-sm font-semibold">Planned GA4 shape</div>
                  <div className="mt-2 text-sm leading-6 text-muted">
                    The current card is set up for a proper campaign chart rather than filler bars:
                    sessions trend, engaged sessions, conversions, and experiment-linked segments. Once
                    we connect your property, you can react to the exact shape and density.
                  </div>
                </div>
              </>
            )}
          </div>
        ) : null}

        {widget.kind === "accessibility" ? (
          <div className="dashboard-scrollbar flex h-full min-h-0 flex-col gap-4 overflow-y-auto pr-1">
            <div className="grid gap-2 sm:grid-cols-4">
              <InfoPill label="Critical issues" value="3" />
              <InfoPill label="Serious" value="11" />
              <InfoPill label="Monitored flows" value="6" />
              <InfoPill label="Trend" value="Improving" />
            </div>
            <div className="rounded-[20px] border border-border bg-background-elevated px-4 py-4">
              <div className="text-sm font-semibold">Release-facing accessibility watch</div>
              <div className="mt-2 text-sm leading-6 text-muted">
                This card is ready for axeAuditor or a similar source so we can track regressions,
                top failing journeys, and release confidence alongside CRO work.
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <InfoPill label="Priority path" value="Checkout and plan compare" />
              <InfoPill label="Next step" value="Connect axeAuditor feed" />
            </div>
          </div>
        ) : null}

        {widget.kind === "optimizely" ? (
          <div className="relative h-full min-h-0">
            {isOptimizelyLoading ? (
              <WidgetLoadingOverlay
                label={
                  liveOptimizely
                    ? "Refreshing Optimizely data..."
                    : "Loading live Optimizely projects and experiments..."
                }
              />
            ) : null}

            <div className="dashboard-scrollbar flex h-full min-h-0 flex-col gap-4 overflow-y-auto pr-1">
            <div className={clsx("grid gap-2", isCompact ? "grid-cols-1" : "sm:grid-cols-5")}>
              <SummaryFilterPill
                label="Running"
                value={`${runningCount}`}
                  active={activeControl === "running"}
                  onClick={() => {
                    setCampaignTab("running");
                    setActiveControl("running");
                  }}
                />
              <SummaryFilterPill
                label="Paused"
                value={`${pausedCount}`}
                active={activeControl === "paused"}
                onClick={() => {
                  setCampaignTab("paused");
                  setActiveControl("paused");
                }}
              />
              <SummaryFilterPill
                label="Not Started"
                value={`${notStartedCount}`}
                active={activeControl === "not_started"}
                onClick={() => {
                  setCampaignTab("not_started");
                  setActiveControl("not_started");
                }}
              />
              <SummaryFilterPill
                label="Contributors"
                value={selectedOwners.length ? `${selectedOwners.length} selected` : `${ownerOptions.length}`}
                  active={activeControl === "owners"}
                  onClick={() => setActiveControl((current) => (current === "owners" ? campaignTab : "owners"))}
                />
                <SummaryFilterPill
                  label="Projects"
                  value={
                    selectedProjects.length
                      ? `${selectedProjects.length} selected`
                      : `${liveOptimizely?.counts?.projects ?? projectOptions.length}`
                  }
                  active={activeControl === "projects"}
                  onClick={() =>
                    setActiveControl((current) => (current === "projects" ? campaignTab : "projects"))
                  }
                />
              </div>

              {activeControl === "owners" ? (
                <div className="flex flex-wrap gap-2">
                  {ownerOptions.map((owner) => {
                    const active = selectedOwners.includes(owner);
                    return (
                      <button
                        key={owner}
                        type="button"
                        onClick={() => toggleOwner(owner)}
                        className={clsx(
                          "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition",
                          active
                            ? "border-accent bg-accent-soft text-foreground"
                            : "border-border bg-background-elevated text-muted hover:border-accent/40",
                        )}
                      >
                        <span>{owner}</span>
                        {active ? <Check size={14} className="text-accent" /> : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {activeControl === "projects" ? (
                <div className="flex flex-wrap gap-2">
                  {projectOptions.map((project) => {
                    const active = selectedProjects.includes(project.id);
                    return (
                      <button
                        key={project.id}
                        type="button"
                        onClick={() => toggleProject(project.id)}
                        className={clsx(
                          "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition",
                          active
                            ? "border-accent bg-accent-soft text-foreground"
                            : "border-border bg-background-elevated text-muted hover:border-accent/40",
                        )}
                      >
                        <span>{project.name}</span>
                        {active ? <Check size={14} className="text-accent" /> : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {liveOptimizely?.message?.trim() ? (
                <div className="rounded-[18px] border border-border bg-background-elevated px-3 py-3 text-sm leading-6 text-muted">
                  {liveOptimizely.message}
                </div>
              ) : null}

              <div className="flex items-center justify-between gap-3">
                <div className="text-xs uppercase tracking-[0.16em] text-muted">
                  {formatCacheWindow(optimizelyUpdatedAt, OPTIMIZELY_CACHE_TTL_MS)}
                </div>
                <button
                  type="button"
                  onClick={() => void refreshOptimizelyData(true)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background-elevated text-muted transition hover:border-accent/40"
                  aria-label="Refresh Optimizely data"
                  title="Refresh Optimizely data"
                >
                  <RefreshCw size={14} className={clsx(isOptimizelyLoading && "animate-spin")} />
                </button>
              </div>

              <div className="space-y-3">
                {visibleCampaigns.map((campaign) => (
                  <CampaignRow
                    key={`${campaignTab}-${campaign.projectId}-${campaign.id}`}
                    campaign={campaign}
                    isExpanded={
                      Boolean(expandedCampaigns[`${campaign.projectId}-${String(campaign.id)}`])
                    }
                    onToggle={() =>
                      toggleCampaignExpanded(`${campaign.projectId}-${String(campaign.id)}`)
                    }
                  />
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {widget.kind === "news" ? (
          <div className="dashboard-scrollbar h-full overflow-y-auto pr-1">
            <div className="space-y-3">
              {(activeProfile.id === "technology"
                ? [
                    {
                      title: "AI engineer workflows keep shifting toward agent tooling and eval stacks",
                      detail:
                        "A dedicated technology view can combine repo momentum, gist discoveries, and engineering news into one faster scan.",
                      href: "https://github.com/trending",
                    },
                    {
                      title:
                        "Frontend teams are watching compiler adoption, router convergence, and rendering tradeoffs",
                      detail:
                        "This card can evolve into curated feeds across React, build tooling, browser platform updates, and AI-assisted frontend work.",
                      href: "https://news.ycombinator.com/",
                    },
                    {
                      title: "Model releases and browser tooling updates continue reshaping engineering velocity",
                      detail:
                        "The next pass can split these into AI engineering news and frontend ecosystem news instead of one blended card.",
                      href: "https://github.blog/",
                    },
                  ]
                : activeProfile.id === "family-mode"
                  ? [
                      {
                        title: "NESA exam and syllabus updates worth watching this term",
                        detail:
                          "Useful for English, maths, commerce, law, business studies, and visual arts planning.",
                        href: "https://www.nsw.gov.au/education-and-training/nesa",
                      },
                      {
                        title: "WTT and ITTF calendars can drive practice planning around upcoming events",
                        detail:
                          "We can deepen this into official event links, draw tracking, and live score handoff.",
                        href: "https://worldtabletennis.com/",
                      },
                      {
                        title: "Study support can be grouped by subject rather than one generic learning feed",
                        detail:
                          "This will work better as expandable subject modules with direct links out to source material.",
                        href: "https://educationstandards.nsw.edu.au/",
                      },
                    ]
                  : [
                      {
                        title: "Retail search volatility settles after seasonal spikes",
                        detail: "A compact CRO news rail for executive awareness without taking over the board.",
                        href: "https://searchengineland.com/",
                      },
                      {
                        title: "Experimentation teams lean harder into server-side decisioning",
                        detail: "This area can be narrowed later to CRO and analytics sources only.",
                        href: "https://www.optimizely.com/insights/",
                      },
                      {
                        title: "AI summaries continue changing content click-through behavior",
                        detail: "Useful context for the intersection of SEO, content, and experimentation.",
                        href: "https://developers.google.com/search",
                      },
                    ]
              ).map((item) => (
                <details
                  key={item.title}
                  className="rounded-[18px] border border-border bg-background-elevated px-3 py-3"
                >
                  <summary className="cursor-pointer list-none text-sm font-semibold leading-6">
                    {item.title}
                  </summary>
                  <div className="mt-2 text-sm leading-6 text-muted">{item.detail}</div>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex rounded-full border border-border px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted transition hover:border-accent/40"
                  >
                    Open source
                  </a>
                </details>
              ))}
            </div>
          </div>
        ) : null}

        {widget.kind === "github" ? (
          <div className="dashboard-scrollbar h-full overflow-y-auto pr-1">
            <div className="space-y-3">
              {[
                ["vercel/ai", "AI SDK workflows and agent patterns moving quickly"],
                ["facebook/react", "Compiler, rendering, and DX signals worth tracking"],
                ["anthropics/claude-code", "Developer-agent repo momentum and workflow ideas"],
                ["modelcontextprotocol/typescript-sdk", "MCP ecosystem movement and integration patterns"],
              ].map(([repo, note]) => (
                <div
                  key={repo}
                  className="rounded-[18px] border border-border bg-background-elevated px-3 py-3"
                >
                  <div className="font-mono text-sm font-medium">{repo}</div>
                  <div className="mt-1 text-sm leading-6 text-muted">{note}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {widget.kind === "wtt" ? (
          <div className="dashboard-scrollbar flex h-full min-h-0 flex-col gap-4 overflow-y-auto pr-1">
            <div className="grid gap-2 sm:grid-cols-3">
              <InfoPill label="Live score" value="Match stream next" />
              <InfoPill label="Next WTT event" value="Champions board" />
              <InfoPill label="ITTF source" value="Official news" />
            </div>
            <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="overflow-hidden rounded-[20px] border border-border bg-background-elevated">
                <div className="h-36 bg-[radial-gradient(circle_at_top_left,_rgba(180,87,46,0.24),_transparent_35%),linear-gradient(135deg,_rgba(29,42,57,0.92),_rgba(29,42,57,0.68))]" />
                <div className="px-4 py-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                    WTT highlight
                  </div>
                  <div className="mt-2 text-lg font-semibold">Harimoto vs Calderano</div>
                  <div className="mt-2 text-sm leading-6 text-muted">
                    Live-score style spotlight with external handoff to the official WTT event page.
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <InfoPill label="Score" value="2 - 1" />
                    <InfoPill label="Game 4" value="8 - 6" />
                  </div>
                </div>
              </div>
              <div className="rounded-[20px] border border-border bg-background-elevated px-4 py-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                  Official links
                </div>
                <div className="mt-3 space-y-2">
                  {[
                    ["WTT Live", "https://worldtabletennis.com/"],
                    ["WTT Events", "https://worldtabletennis.com/events"],
                    ["ITTF News", "https://www.ittf.com/"],
                  ].map(([label, href]) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-[16px] border border-border px-3 py-3 text-sm font-medium transition hover:border-accent/40"
                    >
                      <span>{label}</span>
                      <span className="text-muted">Open</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {[
                {
                  title: "Upcoming events and draw-watch reminders",
                  detail: "A future version can merge WTT schedule data with ITTF articles and player watchlists.",
                },
                {
                  title: "Latest results and standout player movement",
                  detail: "This card is ready for article summaries and official result links.",
                },
                {
                  title: "Live score entry point for match-day checking",
                  detail: "Good candidate for a compact scoreboard row with external handoff to the official source.",
                },
              ].map((item) => (
                <details
                  key={item.title}
                  className="rounded-[18px] border border-border bg-background-elevated px-3 py-3"
                >
                  <summary className="cursor-pointer list-none text-sm font-semibold leading-6">
                    {item.title}
                  </summary>
                  <div className="mt-2 text-sm leading-6 text-muted">{item.detail}</div>
                </details>
              ))}
            </div>
          </div>
        ) : null}

        {widget.kind === "hsc" ? (
          <div className="dashboard-scrollbar h-full overflow-y-auto pr-1">
            <div className="space-y-3">
              {[
                "English essay scaffolds and text-response planning",
                "Mathematics revision pathways and worked examples",
                "Commerce, law, business studies, and visual arts support",
                "NESA exam hub, syllabus updates, and past paper shortcuts",
              ].map((item, index) => (
                <div
                  key={item}
                  className={clsx(
                    "rounded-[18px] border border-border bg-background-elevated px-3 py-3",
                    index === 0 && "bg-accent-soft",
                  )}
                >
                  <div className="text-sm font-semibold">{item}</div>
                  <div className="mt-1 text-sm leading-6 text-muted">
                    Start as curated resources, then evolve into recommendation widgets.
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}
