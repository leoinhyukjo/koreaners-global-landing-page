import type { SupabaseClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

const BUCKET = "website-assets";
const IMAGE_PREFIX = "blog-images";

export async function downloadBuffer(
  url: string,
): Promise<{ buf: Buffer; contentType: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download image: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get("content-type") ?? "";
  return { buf, contentType };
}

function hashBuffer(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex");
}

function guessExtension(url: string, contentType?: string): string {
  try {
    const pathname = new URL(url).pathname;
    const match = pathname.match(/\.(\w+)$/);
    if (match) return match[1].toLowerCase();
  } catch {
    // Invalid URL — fall through to content-type
  }

  const map: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/svg+xml": "svg",
  };
  if (contentType && map[contentType]) return map[contentType];

  return "png";
}

export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Upload image buffer to Supabase Storage with hash-based deduplication.
 */
export async function uploadToSupabase(
  supabase: SupabaseClient,
  buf: Buffer,
  originalUrl: string,
  contentType: string,
): Promise<string> {
  const hash = hashBuffer(buf);
  const ext = guessExtension(originalUrl, contentType);
  const path = `${IMAGE_PREFIX}/${hash}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, buf, {
    contentType: `image/${ext === "jpg" ? "jpeg" : ext}`,
    upsert: true,
  });

  if (error) throw error;

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return urlData.publicUrl;
}

/**
 * Resolve a Notion image (file or external) to a permanent URL.
 * Notion-hosted files are downloaded and re-uploaded to Supabase Storage.
 */
export async function resolveImageUrl(
  supabase: SupabaseClient,
  imageBlock: {
    type: "file" | "external";
    file?: { url: string };
    external?: { url: string };
  },
): Promise<string> {
  if (imageBlock.type === "external") {
    const url = imageBlock.external?.url ?? "";
    return isSafeUrl(url) ? url : "";
  }

  const tempUrl = imageBlock.file?.url ?? "";
  if (!tempUrl) return "";

  try {
    const { buf, contentType } = await downloadBuffer(tempUrl);
    return await uploadToSupabase(supabase, buf, tempUrl, contentType);
  } catch (err) {
    console.warn(
      "[image-upload] Upload failed, falling back to original URL:",
      err instanceof Error ? err.message : err,
    );
    return tempUrl;
  }
}
