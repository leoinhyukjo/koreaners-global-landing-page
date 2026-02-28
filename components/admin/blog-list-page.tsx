"use client";

import { useEffect, useState } from "react";
import { ExternalLink, FileText, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import type { BlogPost } from "@/lib/supabase";
import { resolveThumbnailSrc } from "@/lib/thumbnail";

export function BlogListPage() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  useEffect(() => {
    fetchBlogPosts();
  }, []);

  async function fetchBlogPosts() {
    try {
      setLoading(true);

      const { data, error: supabaseError } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (supabaseError) {
        console.error(
          "[Admin Blog] 에러: " + (supabaseError?.message || "알 수 없는 에러"),
        );
        throw supabaseError;
      }

      const posts = Array.isArray(data) ? data : [];
      setBlogPosts(posts);
    } catch (err: any) {
      const errorMessage = err?.message || "알 수 없는 에러";
      console.error("[Admin Blog] 에러: " + errorMessage);
      alert("블로그 포스트를 불러오는데 실패했습니다: " + errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    setSyncResult(null);

    try {
      const res = await fetch("/api/sync/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (!res.ok) {
        setSyncResult(`동기화 실패: ${data.error || res.statusText}`);
        return;
      }

      const errorCount = data.errors?.length ?? 0;
      if (errorCount > 0) {
        setSyncResult(
          `${data.synced}개 동기화 완료, ${errorCount}개 오류 발생`,
        );
      } else {
        setSyncResult(`${data.synced}개 포스트가 동기화되었습니다.`);
      }

      // 동기화 성공 후 목록 새로고침
      await fetchBlogPosts();
    } catch (err: any) {
      setSyncResult(`동기화 중 오류: ${err?.message || "알 수 없는 에러"}`);
    } finally {
      setSyncing(false);
    }
  }

  const STORAGE_BUCKET = "website-assets";

  /** 썸네일 표시용 URL: Supabase 전체 URL이면 그대로, 스토리지 경로면 getPublicUrl 사용 */
  function getThumbnailDisplaySrc(post: BlogPost): string {
    const raw = post.thumbnail_url?.trim();
    if (!raw) return "";
    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
    const path = raw.replace(/^\/+/, "").replace(/^public\//, "");
    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    return data?.publicUrl ?? resolveThumbnailSrc(raw);
  }

  return (
    <div className="space-y-6">
      {/* Page header — matches dashboard pattern */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-neutral-50">블로그 관리</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Notion에서 작성한 블로그 포스트를 동기화하고 관리합니다
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="https://www.notion.so/2f501ca3e4808082aae4f046911ccf9b"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-neutral-800 px-3 py-2 text-sm text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-neutral-50"
          >
            <ExternalLink className="h-4 w-4" />
            <span className="hidden sm:inline">Notion</span>
          </a>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-2 rounded-lg bg-neutral-800 px-3 py-2 text-sm text-neutral-50 transition-colors hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw
              className={`h-4 w-4 shrink-0 ${syncing ? "animate-spin" : ""}`}
            />
            <span>{syncing ? "동기화 중..." : "Notion 동기화"}</span>
          </button>
        </div>
      </div>

      {/* Sync result banner */}
      {syncResult && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            syncResult.includes("실패") || syncResult.includes("오류")
              ? "border-red-500/30 bg-red-500/10 text-red-400"
              : "border-green-500/30 bg-green-500/10 text-green-400"
          }`}
        >
          {syncResult}
        </div>
      )}

      {/* Content */}
      {loading ? (
        /* Loading skeleton */
        <div className="space-y-4">
          <div className="hidden md:block">
            <div className="rounded-lg border border-neutral-800 bg-neutral-900 overflow-hidden">
              <div className="px-4 py-3 border-b border-neutral-800">
                <div className="h-4 w-48 animate-pulse rounded bg-neutral-800" />
              </div>
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 px-4 py-3 border-b border-neutral-800 last:border-b-0"
                >
                  <div className="h-10 w-14 animate-pulse rounded bg-neutral-800 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-800" />
                    <div className="h-3 w-1/3 animate-pulse rounded bg-neutral-800" />
                  </div>
                  <div className="h-5 w-16 animate-pulse rounded-full bg-neutral-800" />
                </div>
              ))}
            </div>
          </div>
          <div className="md:hidden space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-lg bg-neutral-800"
              />
            ))}
          </div>
        </div>
      ) : blogPosts.length === 0 ? (
        /* Empty state */
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 py-16">
          <div className="flex flex-col items-center justify-center text-neutral-500">
            <FileText className="mb-3 h-10 w-10" />
            <p className="text-sm">아직 블로그 포스트가 없습니다</p>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block">
            <div className="rounded-lg border border-neutral-800 bg-neutral-900 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-800">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-400">
                      썸네일
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-400">
                      제목
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-400">
                      카테고리
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-400">
                      상태
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-400">
                      생성일
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-400">
                      보기
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {blogPosts.map((post) => {
                    const thumbSrc = getThumbnailDisplaySrc(post);
                    return (
                      <tr
                        key={post.id}
                        className="transition-colors hover:bg-neutral-800/50"
                      >
                        <td className="px-4 py-3">
                          {thumbSrc ? (
                            <>
                              <img
                                src={thumbSrc}
                                alt=""
                                className="h-10 w-14 object-cover rounded border border-neutral-800 bg-neutral-800"
                                onError={(e) => {
                                  const t = e.currentTarget;
                                  t.onerror = null;
                                  t.style.display = "none";
                                  const fallback =
                                    t.nextElementSibling as HTMLElement;
                                  if (fallback) {
                                    fallback.classList.remove("hidden");
                                  }
                                }}
                              />
                              <span className="hidden text-xs text-neutral-500">
                                없음
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-neutral-500">
                              없음
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 max-w-[280px]">
                          <span
                            className="block truncate text-sm text-neutral-50"
                            title={post.title}
                          >
                            {post.title}
                          </span>
                          <code className="mt-0.5 block truncate rounded bg-neutral-800 px-1.5 py-0.5 text-xs text-neutral-500">
                            {post.slug}
                          </code>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-300">
                            {post.category}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {post.published ? (
                            <span className="rounded-full bg-green-400/10 px-2 py-0.5 text-xs text-green-400">
                              발행됨
                            </span>
                          ) : (
                            <span className="rounded-full bg-yellow-400/10 px-2 py-0.5 text-xs text-yellow-400">
                              임시저장
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-400">
                          {new Date(post.created_at).toLocaleDateString(
                            "ko-KR",
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <a
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-neutral-50"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden">
            <div className="rounded-lg border border-neutral-800 bg-neutral-900 divide-y divide-neutral-800">
              {blogPosts.map((post) => {
                const thumbSrc = getThumbnailDisplaySrc(post);
                return (
                  <div
                    key={post.id}
                    className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-neutral-800/50"
                  >
                    {thumbSrc ? (
                      <img
                        src={thumbSrc}
                        alt=""
                        className="h-10 w-14 shrink-0 object-cover rounded border border-neutral-800 bg-neutral-800"
                        onError={(e) => {
                          const t = e.currentTarget;
                          t.onerror = null;
                          t.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="h-10 w-14 shrink-0 rounded border border-neutral-800 bg-neutral-800 flex items-center justify-center text-xs text-neutral-500">
                        없음
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p
                        className="truncate text-sm text-neutral-50"
                        title={post.title}
                      >
                        {post.title}
                      </p>
                      <p className="mt-0.5 text-xs text-neutral-500">
                        {post.category} ·{" "}
                        {new Date(post.created_at).toLocaleDateString("ko-KR")}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {post.published ? (
                          <span className="rounded-full bg-green-400/10 px-2 py-0.5 text-xs text-green-400">
                            발행됨
                          </span>
                        ) : (
                          <span className="rounded-full bg-yellow-400/10 px-2 py-0.5 text-xs text-yellow-400">
                            임시저장
                          </span>
                        )}
                      </div>
                    </div>
                    <a
                      href={`/blog/${post.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-neutral-50"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
