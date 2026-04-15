import { NextResponse } from "next/server";

export async function GET() {
  const propertyId = process.env.GA4_PROPERTY_ID;
  const hasAuth =
    Boolean(process.env.GOOGLE_CLIENT_EMAIL) && Boolean(process.env.GOOGLE_PRIVATE_KEY);

  return NextResponse.json({
    source: "google-analytics-4",
    ready: Boolean(propertyId && hasAuth),
    propertyId: propertyId ?? null,
    message: hasAuth
      ? "Credentials detected. Replace this stub with a real GA4 Data API query."
      : "Missing Google service account credentials in the local env file.",
    metrics: {
      sessions: 8921,
      conversions: 428,
      conversionRate: 0.048,
      activeCampaigns: 6,
    },
  });
}
