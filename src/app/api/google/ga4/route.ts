import { NextRequest, NextResponse } from "next/server";
import {
  getValidGoogleAccessToken,
  hasGoogleOauthConfig,
  parseGa4Properties,
} from "@/lib/google-oauth";

type Ga4Row = {
  metricValues?: Array<{ value?: string }>;
};

type CachedRoutePayload = {
  expiresAt: number;
  data: unknown;
};

declare global {
  var __facadeGa4Cache__: CachedRoutePayload | undefined;
}

const GOOGLE_ROUTE_CACHE_TTL_MS = 8 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const properties = parseGa4Properties();
  const forceRefresh = request.nextUrl.searchParams.get("refresh") === "1";

  if (!hasGoogleOauthConfig()) {
    return NextResponse.json(
      {
        source: "google-analytics-4",
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
        source: "google-analytics-4",
        ready: false,
        properties: [],
        message: "Missing GA4 properties in GA4_PROPERTY_IDS.",
      },
      { status: 200 },
    );
  }

  const accessToken = await getValidGoogleAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      {
        source: "google-analytics-4",
        ready: false,
        properties,
        authUrl: "/api/google/oauth/start",
        message: "Google authorization required before GA4 data can load.",
      },
      { status: 200 },
    );
  }

  const cached = globalThis.__facadeGa4Cache__;
  if (!forceRefresh && cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.data);
  }

  const summaries = await Promise.all(
    properties.map(async (property) => {
      try {
        const response = await fetch(
          `https://analyticsdata.googleapis.com/v1beta/properties/${property.id}:runReport`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
              metrics: [
                { name: "sessions" },
                { name: "engagedSessions" },
                { name: "conversions" },
              ],
            }),
            cache: "no-store",
          },
        );

        if (!response.ok) {
          const text = await response.text();
          return {
            label: property.label,
            id: property.id,
            error: `${response.status} ${text}`,
          };
        }

        const payload = (await response.json()) as { rows?: Ga4Row[] };
        const metricValues = payload.rows?.[0]?.metricValues ?? [];

        return {
          label: property.label,
          id: property.id,
          sessions: Number(metricValues[0]?.value ?? 0),
          engagedSessions: Number(metricValues[1]?.value ?? 0),
          conversions: Number(metricValues[2]?.value ?? 0),
        };
      } catch (error) {
        return {
          label: property.label,
          id: property.id,
          error: error instanceof Error ? error.message : "Unknown GA4 error",
        };
      }
    }),
  );

  const payload = {
    source: "google-analytics-4",
    ready: true,
    properties,
    message: "GA4 properties loaded.",
    summaries,
  };

  globalThis.__facadeGa4Cache__ = {
    expiresAt: Date.now() + GOOGLE_ROUTE_CACHE_TTL_MS,
    data: payload,
  };

  return NextResponse.json(payload);
}
