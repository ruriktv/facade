import { NextResponse } from "next/server";

export async function GET() {
  const property = process.env.GSC_SITE_URL;
  const hasAuth =
    Boolean(process.env.GOOGLE_CLIENT_EMAIL) && Boolean(process.env.GOOGLE_PRIVATE_KEY);

  return NextResponse.json({
    source: "google-search-console",
    ready: Boolean(property && hasAuth),
    property: property ?? null,
    message: hasAuth
      ? "Credentials detected. Replace this stub with a real Search Console query."
      : "Missing Google service account credentials in the local env file.",
    metrics: {
      clicks: 14230,
      impressions: 420340,
      ctr: 0.0338,
      avgPosition: 9.4,
    },
  });
}
