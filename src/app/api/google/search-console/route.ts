import { NextRequest, NextResponse } from "next/server";
import {
  getValidGoogleAccessToken,
  hasGoogleOauthConfig,
  parseSearchConsoleProperties,
} from "@/lib/google-oauth";

type SearchConsoleRow = {
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
};

type SearchConsoleTotals = {
  clicks: number;
  impressions: number;
  weightedCtr: number;
  weightedPosition: number;
};

type CruxHistoryResponse = {
  record?: {
    collectionPeriods?: Array<{
      firstDate?: { year?: number; month?: number; day?: number };
      endDate?: { year?: number; month?: number; day?: number };
    }>;
    metrics?: Record<
      string,
      {
        percentilesTimeseries?: {
          p75s?: Array<number | string | null>;
        };
      }
    >;
  };
};

type CachedRoutePayload = {
  expiresAt: number;
  data: unknown;
};

declare global {
  var __facadeSearchConsoleCache__: CachedRoutePayload | undefined;
}

const GOOGLE_ROUTE_CACHE_TTL_MS = 8 * 60 * 60 * 1000;

function deriveOriginFromProperty(property: string) {
  if (property.startsWith("http://") || property.startsWith("https://")) {
    return property.replace(/\/$/, "");
  }

  if (property.startsWith("sc-domain:")) {
    const domain = property.replace("sc-domain:", "").trim();
    return `https://www.${domain}`;
  }

  return property;
}

function buildSearchConsoleLinks(property: string) {
  const resourceId = encodeURIComponent(property);
  return {
    coreWebVitalsUrl: `https://search.google.com/search-console/core-web-vitals?resource_id=${resourceId}`,
    httpsUrl: `https://search.google.com/search-console/https?resource_id=${resourceId}`,
  };
}

async function fetchCruxHistory(origin: string, apiKey: string) {
  const response = await fetch(
    `https://chromeuxreport.googleapis.com/v1/records:queryHistoryRecord?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        origin,
        metrics: [
          "largest_contentful_paint",
          "interaction_to_next_paint",
          "cumulative_layout_shift",
        ],
        collectionPeriodCount: 12,
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`CrUX History API failed: ${response.status} ${await response.text()}`);
  }

  const payload = (await response.json()) as CruxHistoryResponse;
  const periods = payload.record?.collectionPeriods ?? [];
  const metrics = payload.record?.metrics ?? {};

  return {
    labels: periods.map((period) => {
      const end = period.endDate;
      if (!end?.year || !end?.month || !end?.day) {
        return "";
      }

      return `${end.year}-${String(end.month).padStart(2, "0")}-${String(end.day).padStart(2, "0")}`;
    }),
    lcp: metrics.largest_contentful_paint?.percentilesTimeseries?.p75s ?? [],
    inp: metrics.interaction_to_next_paint?.percentilesTimeseries?.p75s ?? [],
    cls: metrics.cumulative_layout_shift?.percentilesTimeseries?.p75s ?? [],
  };
}

export async function GET(request: NextRequest) {
  const properties = parseSearchConsoleProperties();
  const forceRefresh = request.nextUrl.searchParams.get("refresh") === "1";
  const googleApiKey = process.env.GOOGLE_API_KEY ?? process.env.CRUX_API_KEY ?? "";

  if (!hasGoogleOauthConfig()) {
    return NextResponse.json(
      {
        source: "google-search-console",
        ready: false,
        properties: [],
        message: "Missing Google OAuth configuration in the env file.",
      },
      { status: 200 },
    );
  }

  if (!properties.length) {
    return NextResponse.json(
      {
        source: "google-search-console",
        ready: false,
        properties: [],
        message: "Missing Search Console properties in GSC_SITE_URLS.",
      },
      { status: 200 },
    );
  }

  const accessToken = await getValidGoogleAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      {
        source: "google-search-console",
        ready: false,
        properties,
        authUrl: "/api/google/oauth/start",
        message: "Google authorization required before Search Console data can load.",
      },
      { status: 200 },
    );
  }

  const cached = globalThis.__facadeSearchConsoleCache__;
  if (!forceRefresh && cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.data);
  }

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 6);

  const summaries = await Promise.all(
    properties.map(async (property) => {
      const origin = deriveOriginFromProperty(property);
      const links = buildSearchConsoleLinks(property);
      let crux:
        | {
            labels: string[];
            lcp: Array<number | string | null>;
            inp: Array<number | string | null>;
            cls: Array<number | string | null>;
          }
        | null = null;

      try {
        const response = await fetch(
          `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              startDate: startDate.toISOString().slice(0, 10),
              endDate: endDate.toISOString().slice(0, 10),
              rowLimit: 25,
            }),
            cache: "no-store",
          },
        );

        if (!response.ok) {
          const text = await response.text();
          return {
            property,
            error: `${response.status} ${text}`,
          };
        }

        const payload = (await response.json()) as { rows?: SearchConsoleRow[] };
        const rows = payload.rows ?? [];

        const totals = rows.reduce<SearchConsoleTotals>(
          (accumulator, row) => ({
            clicks: accumulator.clicks + (row.clicks ?? 0),
            impressions: accumulator.impressions + (row.impressions ?? 0),
            weightedCtr: accumulator.weightedCtr + (row.ctr ?? 0) * (row.impressions ?? 0),
            weightedPosition:
              accumulator.weightedPosition + (row.position ?? 0) * (row.impressions ?? 0),
          }),
          { clicks: 0, impressions: 0, weightedCtr: 0, weightedPosition: 0 },
        );

        if (googleApiKey) {
          try {
            crux = await fetchCruxHistory(origin, googleApiKey);
          } catch {
            crux = null;
          }
        }

        return {
          property,
          origin,
          ...links,
          clicks: totals.clicks,
          impressions: totals.impressions,
          ctr: totals.impressions ? totals.weightedCtr / totals.impressions : 0,
          avgPosition: totals.impressions ? totals.weightedPosition / totals.impressions : 0,
          crux,
          hasCruxApiKey: Boolean(googleApiKey),
        };
      } catch (error) {
        return {
          property,
          origin,
          ...links,
          crux,
          hasCruxApiKey: Boolean(googleApiKey),
          error: error instanceof Error ? error.message : "Unknown Search Console error",
        };
      }
    }),
  );

  const payload = {
    source: "google-search-console",
    ready: true,
    properties,
    message: googleApiKey
      ? "Search Console metrics and CrUX-based Core Web Vitals loaded."
      : "Search Console metrics loaded. Add GOOGLE_API_KEY with Chrome UX Report API enabled to power Core Web Vitals charts.",
    summaries,
  };

  globalThis.__facadeSearchConsoleCache__ = {
    expiresAt: Date.now() + GOOGLE_ROUTE_CACHE_TTL_MS,
    data: payload,
  };

  return NextResponse.json(payload);
}
