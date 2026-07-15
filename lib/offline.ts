import * as FileSystem from "expo-file-system/legacy";

const CONTENT_DIR = `${FileSystem.documentDirectory}keeplink/content/`;

async function ensureDirs() {
  await FileSystem.makeDirectoryAsync(CONTENT_DIR, { intermediates: true });
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
