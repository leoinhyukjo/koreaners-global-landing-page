import { NextRequest, NextResponse } from "next/server";
import { notion } from "@/lib/notion/client";
import {
  getTitle,
  getRichText,
  getSelect,
  getMultiSelect,
  getStatus,
  getPeople,
  getRelationIds,
  getDate,
} from "@/lib/notion/extractors";
import { getJpyToKrwRate } from "@/lib/exchange-rate";
import { authenticateSync } from "@/lib/sync-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 60;

// ─── Types ────────────────────────────────────────────────────

interface SyncResult {
  synced: number;
  errors: string[];
  exchangeRate: number;
}

// ─── Notion property helpers (number — null 허용) ──────────────

/* eslint-disable @typescript-eslint/no-explicit-any */
function getNumberOrNull(props: any, key: string): number | null {
  const prop = props?.[key];
  if (!prop || prop.type !== "number") return null;
  return prop.number ?? null;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ─── Fetch All Pages from Notion DB (cursor pagination) ────────

/* eslint-disable @typescript-eslint/no-explicit-any */
async function fetchAllPages(): Promise<any[]> {
  const allPages: any[] = [];
  let cursor: string | undefined = undefined;

  do {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_PROJECT_DB_ID!,
      ...(cursor ? { start_cursor: cursor } : {}),
    });

    allPages.push(...(response.results ?? []));
    cursor = response.has_more
      ? (response.next_cursor ?? undefined)
      : undefined;
  } while (cursor);

  return allPages;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ─── POST Handler ─────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Parse body
  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    // Body might be empty (auth via header only) — that's fine
  }

  // Authenticate
  const auth = authenticateSync(
    request,
    typeof body?.secret === "string" ? body.secret : undefined,
  );
  if (!auth.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Validate environment
  if (!process.env.NOTION_PROJECT_DB_ID) {
    return NextResponse.json(
      { error: "NOTION_PROJECT_DB_ID is not configured" },
      { status: 500 },
    );
  }

  const result: SyncResult = { synced: 0, errors: [], exchangeRate: 0 };

  try {
    console.log("[sync/projects] Starting project sync...");

    // 1. 환율 조회
    const exchangeRate = await getJpyToKrwRate();
    result.exchangeRate = exchangeRate;
    console.log(`[sync/projects] JPY→KRW rate: ${exchangeRate}`);

    // 2. Fetch all pages from Notion DB
    const allPages = await fetchAllPages();
    console.log(
      `[sync/projects] Found ${allPages.length} pages in Notion DB`,
    );

    // 3. 1차 패스: id→name Map 구축 (상위 항목 이름 매핑용)
    const idToName = new Map<string, string>();
    for (const page of allPages) {
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      const name = getTitle((page as any).properties, "프로젝트 이름");
      idToName.set(page.id, name);
    }

    // 4. Create Supabase admin client
    const supabase = createAdminClient();

    // 5. 2차 패스: 각 페이지 처리 및 upsert
    for (const page of allPages) {
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      const props = (page as any).properties;
      const projectName = getTitle(props, "프로젝트 이름") || page.id;

      try {
        console.log(`[sync/projects] Processing: "${projectName}"`);

        const notionId = page.id;

        // 상위 항목 relation → parent_notion_id (첫 번째만)
        const parentRelationIds = getRelationIds(props, "상위 항목");
        const parentNotionId =
          parentRelationIds.length > 0 ? parentRelationIds[0] : null;

        // 상위 항목 이름으로 brand_name 매핑
        const brandName = parentNotionId
          ? (idToName.get(parentNotionId) ?? null)
          : null;

        // Upsert to Supabase
        const { error: upsertError } = await supabase
          .from("projects")
          .upsert(
            {
              notion_id: notionId,
              name: getTitle(props, "프로젝트 이름"),
              parent_notion_id: parentNotionId,
              brand_name: brandName,
              status: getStatus(props, "상태"),
              priority: getSelect(props, "우선순위"),
              team: getMultiSelect(props, "팀"),
              project_type: getMultiSelect(props, "종류"),
              assignee_names: getPeople(props, "담당자"),
              contract_krw: getNumberOrNull(
                props,
                "계약 금액 (KRW, VAT 제외)",
              ),
              contract_jpy: getNumberOrNull(
                props,
                "계약 금액 (JPY, VAT 제외)",
              ),
              advance_payment_krw: getNumberOrNull(
                props,
                "선금 입금액 (KRW)",
              ),
              advance_payment_jpy: getNumberOrNull(
                props,
                "선금 입금액 (JPY)",
              ),
              creator_settlement_krw: getNumberOrNull(
                props,
                "크리에이터 정산 금액 (KRW)",
              ),
              creator_settlement_jpy: getNumberOrNull(
                props,
                "크리에이터 정산 금액 (JPY)",
              ),
              client_settlement: getSelect(props, "정산_클라이언트"),
              creator_settlement_status: getSelect(
                props,
                "정산_크리에이터",
              ),
              contract_status: getSelect(props, "계약서"),
              estimate_status: getSelect(props, "견적서"),
              tax_invoice_status: getSelect(props, "세금계산서 발행"),
              start_date: getDate(props, "시작일"),
              end_date: getDate(props, "종료일"),
              note: getRichText(props, "비고"),
              influencer_info: getRichText(props, "진행 인플루언서"),
              settlement_progress: getRichText(props, "정산 진행률"),
            },
            { onConflict: "notion_id" },
          );

        if (upsertError) {
          console.error(
            `[sync/projects] Upsert failed for "${projectName}":`,
            upsertError.message,
          );
          result.errors.push(`"${projectName}": ${upsertError.message}`);
          continue;
        }

        result.synced++;
        console.log(`[sync/projects] Synced: "${projectName}"`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(
          `[sync/projects] Error processing "${projectName}":`,
          message,
        );
        result.errors.push(`"${projectName}": ${message}`);
      }
    }

    console.log(
      `[sync/projects] Sync complete. Synced: ${result.synced}, Errors: ${result.errors.length}, Rate: ${result.exchangeRate}`,
    );

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[sync/projects] Fatal error:", message);
    return NextResponse.json(
      {
        synced: result.synced,
        errors: [...result.errors, `Fatal: ${message}`],
        exchangeRate: result.exchangeRate,
      },
      { status: 500 },
    );
  }
}
