import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "문의하기 | 일본 마케팅 상담",
  description:
    "일본 시장 진출, 인플루언서 마케팅, 시딩 캠페인 등 크로스보더 마케팅에 대해 무료로 상담받으세요.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "문의하기 | 코리너스 KOREANERS",
    description:
      "일본 마케팅 무료 상담. 인플루언서 캠페인, 시딩, 콘텐츠 제작 문의.",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
