import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "포트폴리오 | 크로스보더 마케팅 캠페인 실적",
  description:
    "코리너스가 수행한 크로스보더 인플루언서 마케팅 캠페인 포트폴리오. K-뷰티, K-패션, K-푸드 등 다양한 브랜드의 해외 진출 성공 사례를 확인하세요.",
  alternates: { canonical: "/portfolio" },
  openGraph: {
    title: "포트폴리오 | 코리너스 KOREANERS",
    description:
      "크로스보더 인플루언서 마케팅 캠페인 성공 사례. K-뷰티, K-패션, K-푸드 브랜드의 해외 진출 실적.",
  },
};

export default function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
