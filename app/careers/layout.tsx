import type { Metadata } from "next";
import { Client } from "@notionhq/client";

export const metadata: Metadata = {
  title: "채용 | 코리너스와 함께 성장하세요",
  description:
    "코리너스 채용 정보. 일본 마케팅, 크로스보더 비즈니스에 관심 있는 인재를 찾습니다.",
  alternates: { canonical: "/careers" },
  openGraph: {
    title: "채용 | 코리너스 KOREANERS",
    description: "코리너스 채용 정보. 크로스보더 마케팅 인재를 찾습니다.",
  },
};

export const revalidate = 60;

type OpenRole = {
  id: string;
  title: string;
  startDate: string | null;
  note: string;
  applyUrl: string | null;
  jdUrl: string | null;
};

async function getOpenRoles(): Promise<OpenRole[]> {
  if (
    !process.env.NOTION_CAREERS_TOKEN ||
    !process.env.NOTION_CAREERS_DATASOURCE_ID
  ) {
    return [];
  }
  try {
    const notion = new Client({ auth: process.env.NOTION_CAREERS_TOKEN });
    const response = await notion.dataSources.query({
      data_source_id: process.env.NOTION_CAREERS_DATASOURCE_ID,
      filter: {
        property: "채용현황",
        select: { equals: "채용중" },
      },
    });
    return response.results.map((page: any) => {
      const props = page.properties;
      const title =
        props["공고명"]?.title?.[0]?.plain_text ??
        props["Name"]?.title?.[0]?.plain_text ??
        "";
      const startDate = props["채용개시일"]?.date?.start ?? null;
      const note =
        props["비고"]?.rich_text?.[0]?.plain_text ??
        props["Note"]?.rich_text?.[0]?.plain_text ??
        "";
      const applyUrl: string | null = props["지원 링크"]?.url ?? null;
      const rawJdUrl: string | null = props["JD"]?.url ?? null;
      const jdUrl = rawJdUrl
        ? rawJdUrl
            .replace(
              "https://www.notion.so/",
              "https://descriptive-wallflower-afd.notion.site/",
            )
            .split("?")[0]
        : null;
      return { id: page.id, title, startDate, note, applyUrl, jdUrl };
    });
  } catch (error: any) {
    console.error(
      "[Careers layout] Notion fetch failed:",
      error?.message ?? error,
    );
    return [];
  }
}

function buildJobPostingLd(roles: OpenRole[]) {
  return roles.map((role) => ({
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: role.title,
    description:
      role.note ||
      `${role.title} — 코리너스(KOREANERS) 크로스보더 인플루언서 마케팅 에이전시 포지션. 상세 JD와 지원 링크를 공고 페이지에서 확인해주세요.`,
    datePosted: role.startDate ?? new Date().toISOString().slice(0, 10),
    hiringOrganization: {
      "@type": "Organization",
      name: "코리너스 KOREANERS",
      sameAs: "https://www.koreaners.co",
      logo: "https://www.koreaners.co/icon-512.png",
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressCountry: "KR",
        addressRegion: "Seoul",
      },
    },
    employmentType: "FULL_TIME",
    applicantLocationRequirements: {
      "@type": "Country",
      name: "KR",
    },
    directApply: false,
    ...(role.applyUrl ? { url: role.applyUrl } : {}),
    identifier: {
      "@type": "PropertyValue",
      name: "KOREANERS",
      value: role.id,
    },
  }));
}

export default async function CareersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const roles = await getOpenRoles();
  const ldJson = buildJobPostingLd(roles);
  return (
    <>
      {ldJson.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ldJson) }}
        />
      )}
      {children}
    </>
  );
}
