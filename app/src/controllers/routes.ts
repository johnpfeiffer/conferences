import { DEFAULT_EVENT_ID } from "../data/events";
import type { Event } from "../models/event";

export type AppRoute =
  | { kind: "event"; eventId: string }
  | { kind: "session"; eventId: string; sessionId: string }
  | { kind: "not-found" };

const DEPLOYED_SLUG = "conferences";

const decodeSegment = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export function conferenceOptionLabel({ name, date }: Pick<Event, "name" | "date">) {
  return `${name} · ${date}`;
}

export function appBasePath(pathname = typeof window === "undefined" ? "/" : window.location.pathname) {
  const firstSegment = pathname.split("/").filter(Boolean)[0];
  return firstSegment === DEPLOYED_SLUG ? `/${DEPLOYED_SLUG}` : "";
}

export function parseAppRoute(pathname: string): AppRoute {
  const base = appBasePath(pathname);
  const relative = (base ? pathname.slice(base.length) : pathname).replace(/\/+$/, "") || "/";

  if (relative === "/") return { kind: "event", eventId: DEFAULT_EVENT_ID };

  const legacyTalk = relative.match(/^\/talk\/([^/]+)$/);
  if (legacyTalk) {
    return {
      kind: "session",
      eventId: DEFAULT_EVENT_ID,
      sessionId: decodeSegment(legacyTalk[1]),
    };
  }

  const eventSession = relative.match(/^\/events\/([^/]+)\/talk\/([^/]+)$/);
  if (eventSession) {
    return {
      kind: "session",
      eventId: decodeSegment(eventSession[1]),
      sessionId: decodeSegment(eventSession[2]),
    };
  }

  const eventLanding = relative.match(/^\/events\/([^/]+)$/);
  if (eventLanding) {
    return { kind: "event", eventId: decodeSegment(eventLanding[1]) };
  }

  return { kind: "not-found" };
}

export function eventPath(eventId: string, base = appBasePath()) {
  return eventId === DEFAULT_EVENT_ID ? `${base}/` || "/" : `${base}/events/${eventId}`;
}

export function sessionPath(eventId: string, sessionId: string, base = appBasePath()) {
  return eventId === DEFAULT_EVENT_ID
    ? `${base}/talk/${sessionId}`
    : `${base}/events/${eventId}/talk/${sessionId}`;
}
