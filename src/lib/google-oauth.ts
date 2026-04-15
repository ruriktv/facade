import { cookies } from "next/headers";

export const GOOGLE_TOKEN_COOKIE = "facade_google_tokens";
export const GOOGLE_STATE_COOKIE = "facade_google_oauth_state";

const GOOGLE_AUTH_ROOT = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/webmasters.readonly",
  "https://www.googleapis.com/auth/analytics.readonly",
].join(" ");

function shouldUseSecureCookies() {
  return process.env.NODE_ENV === "production";
}

type GoogleTokenPayload = {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
  token_type?: string;
  scope?: string;
};

function base64UrlEncode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

export function getGoogleCookieOptions(maxAge?: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: shouldUseSecureCookies(),
    path: "/",
    ...(typeof maxAge === "number" ? { maxAge } : {}),
  };
}

export function serializeGoogleTokens(tokens: GoogleTokenPayload) {
  return base64UrlEncode(JSON.stringify(tokens));
}

export function getGoogleOauthConfig() {
  return {
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? "",
    redirectUri: process.env.GOOGLE_OAUTH_REDIRECT_URI ?? "",
  };
}

export function getGoogleAuthUrl(state: string) {
  const { clientId, redirectUri } = getGoogleOauthConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    scope: GOOGLE_SCOPES,
    state,
  });

  return `${GOOGLE_AUTH_ROOT}?${params.toString()}`;
}

export async function setGoogleOauthState(state: string) {
  const cookieStore = await cookies();
  cookieStore.set(GOOGLE_STATE_COOKIE, state, getGoogleCookieOptions(60 * 10));
}

export async function consumeGoogleOauthState() {
  const cookieStore = await cookies();
  const state = cookieStore.get(GOOGLE_STATE_COOKIE)?.value ?? null;
  cookieStore.delete(GOOGLE_STATE_COOKIE);
  return state;
}

export async function setGoogleTokens(tokens: GoogleTokenPayload) {
  const cookieStore = await cookies();
  cookieStore.set(
    GOOGLE_TOKEN_COOKIE,
    serializeGoogleTokens(tokens),
    getGoogleCookieOptions(60 * 60 * 24 * 30),
  );
}

export async function clearGoogleTokens() {
  const cookieStore = await cookies();
  cookieStore.delete(GOOGLE_TOKEN_COOKIE);
}

export async function readGoogleTokens() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(GOOGLE_TOKEN_COOKIE)?.value;
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(base64UrlDecode(raw)) as GoogleTokenPayload;
  } catch {
    return null;
  }
}

export async function exchangeGoogleCodeForTokens(code: string) {
  const { clientId, clientSecret, redirectUri } = getGoogleOauthConfig();
  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Google token exchange failed: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    token_type?: string;
    scope?: string;
  };

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
    token_type: data.token_type,
    scope: data.scope,
  } satisfies GoogleTokenPayload;
}

export async function refreshGoogleAccessToken(refreshToken: string) {
  const { clientId, clientSecret } = getGoogleOauthConfig();
  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Google token refresh failed: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
    token_type?: string;
    scope?: string;
  };

  return {
    access_token: data.access_token,
    refresh_token: refreshToken,
    expires_at: Date.now() + data.expires_in * 1000,
    token_type: data.token_type,
    scope: data.scope,
  } satisfies GoogleTokenPayload;
}

export async function getValidGoogleAccessToken() {
  const tokens = await readGoogleTokens();
  if (!tokens) {
    return null;
  }

  if (tokens.expires_at > Date.now() + 60_000) {
    return tokens.access_token;
  }

  if (!tokens.refresh_token) {
    return null;
  }

  const refreshed = await refreshGoogleAccessToken(tokens.refresh_token);
  await setGoogleTokens(refreshed);
  return refreshed.access_token;
}

export function parseSearchConsoleProperties() {
  return (process.env.GSC_SITE_URLS ?? process.env.GSC_SITE_URL ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function parseGa4Properties() {
  return (process.env.GA4_PROPERTY_IDS ?? process.env.GA4_PROPERTY_ID ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const separatorIndex = entry.lastIndexOf(":");
      if (separatorIndex === -1) {
        return { label: entry, id: entry };
      }

      return {
        label: entry.slice(0, separatorIndex).trim(),
        id: entry.slice(separatorIndex + 1).trim(),
      };
    });
}

export function hasGoogleOauthConfig() {
  const { clientId, clientSecret, redirectUri } = getGoogleOauthConfig();
  return Boolean(clientId && clientSecret && redirectUri);
}
