import Navigation from '@/components/navigation'
import { FooterCTA } from '@/components/footer-cta'

export default function ContactContent() {
  return (
    <main className="min-h-screen w-full max-w-full overflow-x-hidden bg-background">
      <Navigation />
      <div className="pt-24 sm:pt-28 pb-12 sm:pb-20">
        <FooterCTA headingLevel="h1" />
      </div>
    </main>
  )
}
