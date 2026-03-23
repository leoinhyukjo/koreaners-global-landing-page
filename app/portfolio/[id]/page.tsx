export const dynamic = "force-dynamic";

import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Portfolio } from "@/lib/supabase";
import Navigation from "@/components/navigation";
import { safeJsonLdStringify } from "@/lib/json-ld";
import { resolveThumbnailSrc, toAbsoluteUrl } from "@/lib/thumbnail";
import { PortfolioDetailView } from "@/components/portfolio/portfolio-detail-view";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getPortfolio(id: string): Promise<Portfolio | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("portfolios")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("[Portfolio Detail] 에러:", error.message);
      return null;
    }
    return data;
  } catch (err: any) {
    console.error("[Portfolio Detail] 에러:", err?.message);
    return null;
  }
}

async function getOtherPortfolios(excludeId: string): Promise<Portfolio[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("portfolios")
      .select("*")
      .neq("id", excludeId)
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(3);

    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const portfolio = await getPortfolio(id);

  if (!portfolio) {
    return {
      title: "포트폴리오를 찾을 수 없습니다",
      description: "요청하신 포트폴리오를 찾을 수 없습니다.",
    };
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.koreaners.co";
  const ogImage = portfolio.thumbnail_url
    ? toAbsoluteUrl(siteUrl, resolveThumbnailSrc(portfolio.thumbnail_url))
    : `${siteUrl}/images/logo.png`;

  return {
    title: portfolio.title,
    description: portfolio.summary || `${portfolio.title} - ${portfolio.client_name}`,
    openGraph: {
      title: portfolio.title,
      description: portfolio.summary || `${portfolio.title} - ${portfolio.client_name}`,
      type: "article",
      publishedTime: portfolio.published_at ?? portfolio.created_at,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: portfolio.title,
      description: portfolio.summary || `${portfolio.title} - ${portfolio.client_name}`,
      images: [ogImage],
    },
    alternates: {
      canonical: `${siteUrl}/portfolio/${id}`,
    },
  };
}

export default async function PortfolioDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [portfolio, otherPortfolios] = await Promise.all([
    getPortfolio(id),
    getOtherPortfolios(id),
  ]);

  if (!portfolio) {
    notFound();
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.koreaners.co";

  // JSON-LD: CreativeWork + BreadcrumbList
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      name: portfolio.title,
      description: portfolio.summary || `${portfolio.title} - ${portfolio.client_name}`,
      image: portfolio.thumbnail_url || undefined,
      datePublished: portfolio.published_at ?? portfolio.created_at,
      author: { "@id": "https://www.koreaners.co/#organization" },
      publisher: { "@id": "https://www.koreaners.co/#organization" },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": `${siteUrl}/portfolio/${id}`,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "홈",
          item: siteUrl,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Portfolio",
          item: `${siteUrl}/portfolio`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: portfolio.title,
        },
      ],
    },
  ];

  return (
    <main className="min-h-screen relative overflow-hidden bg-background">
      <Navigation />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(jsonLd) }}
      />
      <PortfolioDetailView
        portfolio={portfolio}
        otherPortfolios={otherPortfolios}
      />
    </main>
  );
}
