import type { Metadata } from "next";

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

export default function CareersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
