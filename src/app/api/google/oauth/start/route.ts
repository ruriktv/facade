import { NextResponse } from "next/server";
import {
  GOOGLE_STATE_COOKIE,
  getGoogleAuthUrl,
  getGoogleCookieOptions,
  hasGoogleOauthConfig,
} from "@/lib/google-oauth";

export async function GET() {
  if (!hasGoogleOauthConfig()) {
    return NextResponse.json(
      {
        ready: false,
        message: "Missing Google OAuth configuration in the env file.",
      },
      { status: 500 },
    );
  }

  const state = crypto.randomUUID();
  const response = NextResponse.redirect(getGoogleAuthUrl(state));
  response.cookies.set(GOOGLE_STATE_COOKIE, state, getGoogleCookieOptions(60 * 10));
  return response;
}
