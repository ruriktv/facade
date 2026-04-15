import { NextRequest, NextResponse } from "next/server";
import {
  exchangeGoogleCodeForTokens,
  GOOGLE_STATE_COOKIE,
  GOOGLE_TOKEN_COOKIE,
  getGoogleCookieOptions,
  hasGoogleOauthConfig,
  serializeGoogleTokens,
} from "@/lib/google-oauth";

export async function GET(request: NextRequest) {
  if (!hasGoogleOauthConfig()) {
    return NextResponse.redirect(new URL("/?google=missing-config", request.url));
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const storedState = request.cookies.get(GOOGLE_STATE_COOKIE)?.value ?? null;

  if (error) {
    const response = NextResponse.redirect(
      new URL(`/?google=${encodeURIComponent(error)}`, request.url),
    );
    response.cookies.delete(GOOGLE_STATE_COOKIE);
    return response;
  }

  if (!code || !state || !storedState || state !== storedState) {
    const response = NextResponse.redirect(new URL("/?google=state-mismatch", request.url));
    response.cookies.delete(GOOGLE_STATE_COOKIE);
    response.cookies.delete(GOOGLE_TOKEN_COOKIE);
    return response;
  }

  try {
    const tokens = await exchangeGoogleCodeForTokens(code);
    const response = NextResponse.redirect(new URL("/?google=connected", request.url));
    response.cookies.delete(GOOGLE_STATE_COOKIE);
    response.cookies.set(
      GOOGLE_TOKEN_COOKIE,
      serializeGoogleTokens(tokens),
      getGoogleCookieOptions(60 * 60 * 24 * 30),
    );
    return response;
  } catch {
    const response = NextResponse.redirect(new URL("/?google=token-exchange-failed", request.url));
    response.cookies.delete(GOOGLE_STATE_COOKIE);
    response.cookies.delete(GOOGLE_TOKEN_COOKIE);
    return response;
  }
}
