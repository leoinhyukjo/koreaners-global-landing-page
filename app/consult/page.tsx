// app/consult/page.tsx
import type { Metadata } from "next";
import { ConsultContent } from "@/components/consult/consult-content";

export const metadata: Metadata = {
  title: "무료 상담 신청 | 일본 인플루언서 마케팅",
  description:
    "일본 인플루언서 마케팅 무료 상담. 크리에이터 네트워크 220명+, 누적 협업 브랜드 185개+의 코리너스가 캠페인 전 과정을 운영합니다.",
  robots: { index: false, follow: false },
};

export default function ConsultPage() {
  return <ConsultContent />;
}
