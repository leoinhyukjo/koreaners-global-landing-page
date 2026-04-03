import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "크리에이터 | 일본 인플루언서 네트워크",
  description:
    "코리너스와 함께하는 일본 크리에이터 네트워크. 뷰티, 패션, 라이프스타일 분야의 일본 인플루언서를 만나보세요.",
  alternates: { canonical: "/creator" },
  openGraph: {
    title: "크리에이터 | 코리너스 KOREANERS",
    description:
      "뷰티, 패션, 라이프스타일 분야 일본 인플루언서 네트워크.",
  },
};

export default function CreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
