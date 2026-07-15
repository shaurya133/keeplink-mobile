import * as FileSystem from "expo-file-system/legacy";

const BASE = `${FileSystem.documentDirectory}keeplink/`;
const CONTENT_DIR = `${BASE}content/`;
const HIGHLIGHTS_DIR = `${BASE}highlights/`;

async function ensureDirs() {
  await FileSystem.makeDirectoryAsync(CONTENT_DIR, { intermediates: true });
  await FileSystem.makeDirectoryAsync(HIGHLIGHTS_DIR, { intermediates: true });
}

// ── Content caching ──────────────────────────────────────────────

export async function cacheContent(linkId: string, content: string): Promise<void> {
  await ensureDirs();
  await FileSystem.writeAsStringAsync(`${CONTENT_DIR}${linkId}.txt`, content);
}

export async function loadContent(linkId: string): Promise<string | null> {
  const path = `${CONTENT_DIR}${linkId}.txt`;
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) return null;
  return FileSystem.readAsStringAsync(path);
}

export async function isCached(linkId: string): Promise<boolean> {
  const info = await FileSystem.getInfoAsync(`${CONTENT_DIR}${linkId}.txt`);
  return info.exists;
}

export async function deleteCache(linkId: string): Promise<void> {
  const path = `${CONTENT_DIR}${linkId}.txt`;
  const info = await FileSystem.getInfoAsync(path);
  if (info.exists) await FileSystem.deleteAsync(path);
}

// ── Highlights ───────────────────────────────────────────────────

export interface HighlightEntry {
  linkId: string;
  title: string;
  domain: string;
  sentences: string[];
}

export async function saveHighlights(
  linkId: string,
  sentences: string[],
  meta?: { title: string | null; domain: string }
): Promise<void> {
  await ensureDirs();
  // Load existing to preserve metadata if not passed
  const existing = await loadHighlightEntry(linkId);
  const entry: HighlightEntry = {
    linkId,
    title: meta?.title ?? existing?.title ?? "",
    domain: meta?.domain ?? existing?.domain ?? "",
    sentences,
  };
  await FileSystem.writeAsStringAsync(
    `${HIGHLIGHTS_DIR}${linkId}.json`,
    JSON.stringify(entry)
  );
}

async function loadHighlightEntry(linkId: string): Promise<HighlightEntry | null> {
  const path = `${HIGHLIGHTS_DIR}${linkId}.json`;
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) return null;
  try {
    const raw = await FileSystem.readAsStringAsync(path);
    const parsed = JSON.parse(raw);
    // Support legacy format (plain array)
    if (Array.isArray(parsed)) return { linkId, title: "", domain: "", sentences: parsed };
    return parsed as HighlightEntry;
  } catch {
    return null;
  }
}

export async function loadHighlights(linkId: string): Promise<string[]> {
  const entry = await loadHighlightEntry(linkId);
  return entry?.sentences ?? [];
}

export async function loadAllHighlights(): Promise<HighlightEntry[]> {
  await ensureDirs();
  const files = await FileSystem.readDirectoryAsync(HIGHLIGHTS_DIR);
  const entries: HighlightEntry[] = [];
  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const linkId = file.replace(".json", "");
    const entry = await loadHighlightEntry(linkId);
    if (entry && entry.sentences.length > 0) entries.push(entry);
  }
  return entries;
}

// ── Helpers ──────────────────────────────────────────────────────

export function splitSentences(text: string): string[] {
  const raw = text.match(/[^.!?]+[.!?]+["']?\s*/g) ?? [text];
  return raw.map((s) => s.trim()).filter(Boolean);
}

export function splitIntoParagraphs(text: string): string[][] {
  // Returns array of paragraphs, each paragraph is an array of sentences
  let blocks: string[];
  if (text.includes("\n\n")) {
    blocks = text.split(/\n\n+/).map((p) => p.replace(/\s+/g, " ").trim()).filter(Boolean);
  } else {
    // Group sentences into ~300-char paragraphs
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
