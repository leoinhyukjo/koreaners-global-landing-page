export function Footer() {
  return (
    <footer className="py-12 border-t border-border bg-background">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-2xl font-bold">
            <span className="text-primary">KOREANERS</span>
            <span className="text-foreground"> GLOBAL</span>
          </div>
          <div className="text-muted-foreground text-sm text-center md:text-right">
            © 2025 Koreaners Global. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  )
}
