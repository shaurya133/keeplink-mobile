import Constants from "expo-constants";
import { getToken } from "./auth";

const BASE_URL =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  "http://localhost:3000";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  // Auth
  requestMagicLink: (email: string) =>
    request<{ ok: boolean }>("/api/auth/mobile-request", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  verifyToken: (email: string, code: string) =>
    request<{ token: string; userId: string }>("/api/auth/mobile-verify", {
      method: "POST",
      body: JSON.stringify({ email, code }),
    }),

  // Links
  getLinks: (params?: { status?: string; tag?: string; q?: string }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.tag) qs.set("tag", params.tag);
    if (params?.q) qs.set("q", params.q);
    const query = qs.toString();
    return request<import("./types").LinkWithTags[]>(
      `/api/links${query ? `?${query}` : ""}`
    );
  },

  createLink: (url: string) =>
    request<import("./types").LinkWithTags>("/api/links", {
      method: "POST",
      body: JSON.stringify({ url }),
    }),

  markRead: (id: string) =>
    request<{ ok: boolean }>(`/api/links/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ action: "markRead" }),
    }),

  markUnread: (id: string) =>
    request<{ ok: boolean }>(`/api/links/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ action: "markUnread" }),
    }),

  archiveLink: (id: string) =>
    request<{ ok: boolean }>(`/api/links/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ action: "archive" }),
    }),

  deleteLink: (id: string) =>
    request<{ ok: boolean }>(`/api/links/${id}`, { method: "DELETE" }),

  addTag: (linkId: string, name: string) =>
    request<{ id: string; name: string }>(`/api/links/${linkId}/tags`, {
      method: "POST",
      body: JSON.stringify({ name }),
    }),

  removeTag: (linkId: string, tagId: string) =>
    request<{ ok: boolean }>(
      `/api/links/${linkId}/tags?tagId=${tagId}`,
      { method: "DELETE" }
    ),

  getLink: (id: string) =>
    request<import("./types").LinkWithTags>(`/api/links/${id}`),

  getTags: () =>
    request<import("./types").TagWithCount[]>("/api/tags"),

  deleteAccount: () =>
    request<{ ok: boolean }>("/api/account", { method: "DELETE" }),

  getHighlights: (linkId: string) =>
    request<{ id: string; text: string }[]>(`/api/highlights?linkId=${linkId}`),

  getAllHighlights: () =>
    request<{ id: string; text: string; linkId: string; link: { title: string | null; domain: string } }[]>(
      "/api/highlights"
    ),

  addHighlight: (linkId: string, text: string) =>
    request<{ id: string; text: string }>("/api/highlights", {
      method: "POST",
      body: JSON.stringify({ linkId, text }),
    }),

  deleteHighlight: (id: string) =>
    request<{ ok: boolean }>(`/api/highlights/${id}`, { method: "DELETE" }),
};
