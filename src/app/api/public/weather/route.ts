import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    source: "open-meteo",
    ready: true,
    message: "This public endpoint can be upgraded to live weather without API keys.",
    location: "Sydney",
    current: {
      temperatureC: 23,
      apparentTemperatureC: 24,
      precipitationProbability: 10,
      summary: "Mild with light coastal winds",
    },
  });
}
