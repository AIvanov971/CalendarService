import { headers } from "next/headers";

function normalizeBaseUrl(value: string) {
  const trimmed = value.trim().replace(/\/$/, "");

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function protocolForHost(host: string, forwardedProto: string | null) {
  if (forwardedProto) {
    return forwardedProto;
  }

  return host.startsWith("localhost") || host.startsWith("127.0.0.1")
    ? "http"
    : "https";
}

export async function getBaseUrl() {
  const headerStore = await headers();
  const host =
    headerStore.get("x-forwarded-host") ??
    headerStore.get("host") ??
    null;

  if (host) {
    return `${protocolForHost(
      host,
      headerStore.get("x-forwarded-proto")
    )}://${host}`;
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return normalizeBaseUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  }

  if (process.env.VERCEL_URL) {
    return normalizeBaseUrl(process.env.VERCEL_URL);
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return normalizeBaseUrl(process.env.NEXT_PUBLIC_APP_URL);
  }

  return "http://localhost:3000";
}

export function buildFeedUrl(baseUrl: string, token: string) {
  return `${baseUrl}/api/feeds/${token}/calendar.ics`;
}

export function buildSubscriberUrl(baseUrl: string, token: string) {
  return `${baseUrl}/s/${token}`;
}

export function buildWebcalUrl(feedUrl: string) {
  return feedUrl.replace(/^https?:\/\//, "webcal://");
}
