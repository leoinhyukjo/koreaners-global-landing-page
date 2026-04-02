import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "서비스 소개 | 크로스보더 인플루언서 마케팅 & 시딩 & 콘텐츠 제작",
  description:
    "코리너스의 크로스보더 마케팅 서비스: 인플루언서 캠페인, 대량 시딩, 콘텐츠 제작, 데이터 기반 리포팅. 30만 커뮤니티와 100+ 미디어 네트워크를 활용한 크로스보더 마케팅.",
  alternates: { canonical: "/service" },
  openGraph: {
    title: "서비스 소개 | 코리너스 KOREANERS",
    description:
      "크로스보더 인플루언서 마케팅, 시딩, 콘텐츠 제작, 데이터 리포팅까지. 마케팅 전 과정을 운영합니다.",
  },
};

export default function ServiceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
