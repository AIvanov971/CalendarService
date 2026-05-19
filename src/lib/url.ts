import { headers } from "next/headers";

export async function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }

  const headerStore = await headers();
  const host = headerStore.get("host") ?? "localhost:3000";
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";

  return `${protocol}://${host}`;
}

export function buildFeedUrl(baseUrl: string, token: string) {
  return `${baseUrl}/api/feeds/${token}/calendar.ics`;
}

export function buildWebcalUrl(feedUrl: string) {
  return feedUrl.replace(/^https?:\/\//, "webcal://");
}
