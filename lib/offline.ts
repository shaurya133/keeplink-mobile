import * as FileSystem from "expo-file-system/legacy";
import type { CachedLinkMeta } from "./types";

const BASE_DIR = `${FileSystem.documentDirectory}keeplink/`;

function contentDir(userId: string) {
  return `${BASE_DIR}${userId}/content/`;
}

function metaDir(userId: string) {
  return `${BASE_DIR}${userId}/meta/`;
}

async function ensureDirs(userId: string) {
  await FileSystem.makeDirectoryAsync(contentDir(userId), { intermediates: true });
  await FileSystem.makeDirectoryAsync(metaDir(userId), { intermediates: true });
}

// ── Content caching ──────────────────────────────────────────────

export async function cacheContent(userId: string, linkId: string, content: string): Promise<void> {
  await ensureDirs(userId);
  await FileSystem.writeAsStringAsync(`${contentDir(userId)}${linkId}.txt`, content);
}

export async function loadContent(userId: string, linkId: string): Promise<string | null> {
  const path = `${contentDir(userId)}${linkId}.txt`;
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) return null;
  return FileSystem.readAsStringAsync(path);
}

export async function isCached(userId: string, linkId: string): Promise<boolean> {
  const info = await FileSystem.getInfoAsync(`${contentDir(userId)}${linkId}.txt`);
  return info.exists;
}

export async function deleteCache(userId: string, linkId: string): Promise<void> {
  const contentPath = `${contentDir(userId)}${linkId}.txt`;
  const metaPath = `${metaDir(userId)}${linkId}.json`;
  const contentInfo = await FileSystem.getInfoAsync(contentPath);
  if (contentInfo.exists) await FileSystem.deleteAsync(contentPath);
  const metaInfo = await FileSystem.getInfoAsync(metaPath);
  if (metaInfo.exists) await FileSystem.deleteAsync(metaPath);
}

// ── Metadata caching ────────────────────────────────────────────

export async function cacheLinkMeta(userId: string, linkId: string, meta: CachedLinkMeta): Promise<void> {
  await ensureDirs(userId);
  await FileSystem.writeAsStringAsync(
    `${metaDir(userId)}${linkId}.json`,
    JSON.stringify(meta)
  );
}

export async function listCachedLinks(userId: string): Promise<CachedLinkMeta[]> {
  const dir = metaDir(userId);
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) return [];

  const files = await FileSystem.readDirectoryAsync(dir);
  const metas: CachedLinkMeta[] = [];

  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    try {
      const raw = await FileSystem.readAsStringAsync(`${dir}${file}`);
      metas.push(JSON.parse(raw));
    } catch {
      // skip corrupt files
    }
  }

  return metas.sort((a, b) => (b.savedAt ?? 0) - (a.savedAt ?? 0));
}

// ── Cleanup ─────────────────────────────────────────────────────

export async function clearUserCache(userId: string): Promise<void> {
  const dir = `${BASE_DIR}${userId}/`;
  const info = await FileSystem.getInfoAsync(dir);
  if (info.exists) await FileSystem.deleteAsync(dir, { idempotent: true });
}

// ── Helpers ─────────────────────────────────────────────────────

export function splitSentences(text: string): string[] {
  const raw = text.match(/[^.!?]+[.!?]+["']?\s*/g) ?? [text];
  return raw.map((s) => s.trim()).filter(Boolean);
}

export function splitIntoParagraphs(text: string): string[][] {
  let blocks: string[];
  if (text.includes("\n\n")) {
    blocks = text.split(/\n\n+/).map((p) => p.replace(/\s+/g, " ").trim()).filter(Boolean);
  } else {
    const sentences = splitSentences(text);
    blocks = [];
    let current = "";
    for (const s of sentences) {
      current += s + " ";
      if (current.length >= 300) {
        blocks.push(current.trim());
        current = "";
      }
    }
    if (current.trim()) blocks.push(current.trim());
  }
  return blocks.map(splitSentences);
}
