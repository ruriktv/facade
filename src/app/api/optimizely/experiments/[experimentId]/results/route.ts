import { NextResponse } from "next/server";

const API_ROOT = "https://api.optimizely.com/v2";

type ExperimentResultsApiResponse = {
  confidence_threshold?: number;
  reach?: {
    total_count?: number;
    treatment_reach?: number;
    baseline_reach?: number;
  };
  metrics?: Array<{
    name?: string;
    results?: Record<
      string,
      {
        is_baseline?: boolean;
        samples?: number;
        value?: number;
        rate?: number;
        lift?: {
          is_significant?: boolean;
          significance?: number;
          lift_status?: string;
        };
      }
    >;
  }>;
};

function getHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ experimentId: string }> },
) {
  const token = process.env.OPTIMIZELY_API_TOKEN;
  const { experimentId } = await context.params;

  if (!token) {
    return NextResponse.json(
      {
        ready: false,
        message: "Missing Optimizely API token.",
        experimentId: Number(experimentId),
      },
      { status: 200 },
    );
  }

  const response = await fetch(`${API_ROOT}/experiments/${experimentId}/results`, {
    headers: getHeaders(token),
    cache: "no-store",
  });

  if (response.status === 204) {
    return NextResponse.json({
      ready: false,
      message: "No experiment results are available yet for this experiment.",
      experimentId: Number(experimentId),
      pageReach: "Unavailable",
      audienceReach: "Unavailable",
      uniqueConversionSessions: "Unavailable",
      conversionLift: "Unavailable",
      confidence: "Unavailable",
      significance: "Unavailable",
    });
  }

  if (response.status === 202) {
    return NextResponse.json({
      ready: false,
      message: "Optimizely is still processing results for this experiment. Try again shortly.",
      experimentId: Number(experimentId),
      pageReach: "Processing",
      audienceReach: "Processing",
      uniqueConversionSessions: "Processing",
      conversionLift: "Processing",
      confidence: "Processing",
      significance: "Processing",
    });
  }

  if (!response.ok) {
    const body = await response.text();
    return NextResponse.json(
      {
        ready: false,
        message: `Failed to load experiment results: ${response.status} ${body}`,
        experimentId: Number(experimentId),
        pageReach: "Unavailable",
        audienceReach: "Unavailable",
        uniqueConversionSessions: "Unavailable",
        conversionLift: "Unavailable",
        confidence: "Unavailable",
        significance: "Unavailable",
      },
      { status: 500 },
    );
  }

  const data = (await response.json()) as ExperimentResultsApiResponse;
  const primaryMetric = data.metrics?.[0];
  const resultEntries = primaryMetric?.results ? Object.values(primaryMetric.results) : [];
  const bestVariation = resultEntries.find((entry) => !entry.is_baseline) ?? null;

  const conversionLift =
    typeof bestVariation?.lift?.significance === "number"
      ? `${(bestVariation.lift.significance * 100).toFixed(1)}%`
      : "Unavailable";

  return NextResponse.json({
    ready: true,
    message: primaryMetric?.name ? `Primary metric: ${primaryMetric.name}` : "Experiment results loaded.",
    experimentId: Number(experimentId),
    pageReach:
      typeof data.reach?.total_count === "number"
        ? `${data.reach.total_count.toLocaleString("en-AU")} sessions`
        : "Unavailable",
    audienceReach:
      typeof data.reach?.treatment_reach === "number"
        ? `${(data.reach.treatment_reach * 100).toFixed(2)}%`
        : "Unavailable",
    uniqueConversionSessions:
      typeof bestVariation?.value === "number"
        ? `${bestVariation.value.toLocaleString("en-AU")}`
        : "Unavailable",
    conversionLift,
    confidence:
      typeof data.confidence_threshold === "number"
        ? `${(data.confidence_threshold * 100).toFixed(0)}% threshold`
        : "Unavailable",
    significance:
      typeof bestVariation?.lift?.is_significant === "boolean"
        ? bestVariation.lift.is_significant
          ? "Significant"
          : "Not significant"
        : "Unavailable",
  });
}
