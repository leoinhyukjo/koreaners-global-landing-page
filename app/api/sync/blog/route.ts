import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { notion } from "@/lib/notion/client";
import { blocksToHtml } from "@/lib/notion/blocks-to-html";
import { parseFaqsFromBlocks } from "@/lib/notion/parse-faqs";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 60;

// ─── Types ────────────────────────────────────────────────────

interface SyncResult {
  synced: number;
  errors: string[];
}

// ─── Auth ─────────────────────────────────────────────────────

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

async function authenticate(
  request: NextRequest,
  body: unknown,
): Promise<boolean> {
  const secret = process.env.SYNC_SECRET;

  // 1. Check Authorization header
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader) {
      const [scheme, token] = authHeader.split(" ");
      if (scheme === "Bearer" && token && safeEqual(token, secret)) return true;
    }
  }

  // 2. Check request body secret
  if (
    secret &&
    body &&
    typeof body === "object" &&
    "secret" in body &&
    typeof (body as { secret: string }).secret === "string" &&
    safeEqual((body as { secret: string }).secret, secret)
  ) {
    return true;
  }

  // 3. Allow same-origin requests (admin page calls from browser)
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = request.headers.get("host");
  if (host) {
    const allowedOrigin = `https://${host}`;
    if (origin === allowedOrigin || referer?.startsWith(allowedOrigin)) {
      return true;
    }
    // Also allow localhost for development
    if (
      origin?.startsWith("http://localhost") ||
      referer?.startsWith("http://localhost")
    ) {
      return true;
    }
  }

  if (!secret) {
    console.error("[sync/blog] SYNC_SECRET environment variable is not set");
  }

  return false;
}

// ─── Notion Property Extractors ───────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */

function getTitle(properties: any, key: string): string {
  const prop = properties[key];
  if (!prop || prop.type !== "title") return "";
  return (prop.title ?? []).map((rt: any) => rt.plain_text ?? "").join("");
}

function getRichText(properties: any, key: string): string {
  const prop = properties[key];
  if (!prop || prop.type !== "rich_text") return "";
  return (prop.rich_text ?? []).map((rt: any) => rt.plain_text ?? "").join("");
}

function getSelect(properties: any, key: string): string | null {
  const prop = properties[key];
  if (!prop || prop.type !== "select") return null;
  return prop.select?.name ?? null;
}

function getMultiSelectFirst(properties: any, key: string): string {
  const prop = properties[key];
  if (!prop || prop.type !== "multi_select") return "";
  const options: any[] = prop.multi_select ?? [];
  return options.length > 0 ? (options[0].name ?? "") : "";
}

function getUrl(properties: any, key: string): string | null {
  const prop = properties[key];
  if (!prop || prop.type !== "url") return null;
  return prop.url ?? null;
}

function getDate(properties: any, key: string): string | null {
  const prop = properties[key];
  if (!prop || prop.type !== "date") return null;
  return prop.date?.start ?? null;
}

// ─── Slug Generation ──────────────────────────────────────────

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "") // Keep letters (any script), numbers, spaces, hyphens
    .replace(/\s+/g, "-") // Spaces → hyphens
    .replace(/-+/g, "-") // Collapse multiple hyphens
    .replace(/^-+|-+$/g, "") // Trim hyphens from edges
    .slice(0, 200); // Limit length
}

// ─── Fetch All Blocks (with pagination) ───────────────────────

async function fetchAllBlocks(pageId: string): Promise<any[]> {
  const allBlocks: any[] = [];
  let cursor: string | undefined = undefined;

  do {
    const response: any = await notion.blocks.children.list({
      block_id: pageId,
      page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {}),
    });

    allBlocks.push(...(response.results ?? []));
    cursor = response.has_more ? response.next_cursor : undefined;
  } while (cursor);

  return allBlocks;
}

// ─── Fetch All Pages from Notion DB (with pagination) ─────────

async function fetchAllPages(): Promise<any[]> {
  const allPages: any[] = [];
  let cursor: string | undefined = undefined;

  do {
    const response = await notion.dataSources.query({
      data_source_id: process.env.NOTION_BLOG_DB_ID!,
      ...(cursor ? { start_cursor: cursor } : {}),
    });

    allPages.push(...(response.results ?? []));
    cursor = response.has_more
      ? (response.next_cursor ?? undefined)
      : undefined;
  } while (cursor);

  return allPages;
}

// ─── Process Single Post ──────────────────────────────────────

async function processPost(
  page: any,
  supabase: ReturnType<typeof createAdminClient>,
): Promise<{
  slug: string;
  title: string;
  category: string;
  thumbnail_url: string | null;
  summary: string | null;
  content: string;
  published: boolean;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  faqs: { question: string; answer: string }[] | null;
}> {
  const props = page.properties;

  // Extract properties
  const title = getTitle(props, "이름");
  const rawSlug = getRichText(props, "슬러그");
  const slug = rawSlug || generateSlug(title);
  const statusSelect = getSelect(props, "상태");
  const published = statusSelect === "발행";
  const category = getMultiSelectFirst(props, "카테고리");
  const summary = getRichText(props, "요약") || null;
  const thumbnailUrl = getUrl(props, "썸네일");
  const metaTitle = getRichText(props, "Meta Title") || null;
  const metaDescription = getRichText(props, "Meta Description") || null;
  const publishDate = getDate(props, "발행일");
  const createdAt = publishDate ?? page.created_time;

  // Fetch all blocks for the page
  const blocks = await fetchAllBlocks(page.id);

  // Convert blocks to HTML (pass supabase for image uploads)
  const content = await blocksToHtml(blocks, supabase);

  // Parse FAQs from blocks
  const faqs = parseFaqsFromBlocks(blocks);

  return {
    slug,
    title,
    category,
    thumbnail_url: thumbnailUrl,
    summary,
    content,
    published,
    meta_title: metaTitle,
    meta_description: metaDescription,
    created_at: createdAt,
    faqs: faqs.length > 0 ? faqs : null,
  };
}

// ─── POST Handler ─────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Parse body
  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    // Body might be empty (auth via header only) — that's fine
  }

  // Authenticate
  if (!(await authenticate(request, body))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Validate environment
  if (!process.env.NOTION_BLOG_DB_ID) {
    return NextResponse.json(
      { error: "NOTION_BLOG_DB_ID is not configured" },
      { status: 500 },
    );
  }

  const result: SyncResult = { synced: 0, errors: [] };

  try {
    console.log("[sync/blog] Starting blog sync...");

    // 1. Fetch all pages from Notion DB
    const allPages = await fetchAllPages();
    console.log(`[sync/blog] Found ${allPages.length} pages in Notion DB`);

    // 2. Filter: only sync pages with status "발행" or "리뷰" (skip drafts)
    const pages = allPages.filter((page) => {
      const status = getSelect(page.properties, "상태");
      return status === "발행" || status === "리뷰";
    });
    console.log(`[sync/blog] ${pages.length} pages to sync (발행/리뷰 only)`);

    // 3. Create Supabase admin client (service role, bypasses RLS)
    const supabase = createAdminClient();

    // 4. Process each page
    for (const page of pages) {
      const pageTitle = getTitle(page.properties, "이름") || page.id;

      try {
        console.log(`[sync/blog] Processing: "${pageTitle}"`);
        const postData = await processPost(page, supabase);

        if (!postData.slug) {
          result.errors.push(`"${pageTitle}": empty slug after generation`);
          continue;
        }

        // 4. Upsert to Supabase
        const { error: upsertError } = await supabase.from("blog_posts").upsert(
          {
            title: postData.title,
            slug: postData.slug,
            category: postData.category,
            thumbnail_url: postData.thumbnail_url,
            summary: postData.summary,
            content: postData.content,
            published: postData.published,
            meta_title: postData.meta_title,
            meta_description: postData.meta_description,
            created_at: postData.created_at,
            faqs: postData.faqs,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "slug" },
        );

        if (upsertError) {
          console.error(
            `[sync/blog] Upsert failed for "${pageTitle}":`,
            upsertError.message,
          );
          result.errors.push(`"${pageTitle}": ${upsertError.message}`);
          continue;
        }

        result.synced++;
        console.log(
          `[sync/blog] Synced: "${pageTitle}" (slug: ${postData.slug})`,
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[sync/blog] Error processing "${pageTitle}":`, message);
        result.errors.push(`"${pageTitle}": ${message}`);
      }
    }

    console.log(
      `[sync/blog] Sync complete. Synced: ${result.synced}, Errors: ${result.errors.length}`,
    );

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[sync/blog] Fatal error:", message);
    return NextResponse.json(
      {
        synced: result.synced,
        errors: [...result.errors, `Fatal: ${message}`],
      },
      { status: 500 },
    );
  }
}
