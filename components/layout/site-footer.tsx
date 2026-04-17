import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t bg-secondary/30 mt-12">
      <div className="container py-12 grid gap-8 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-block h-8 w-8 rounded-md bg-primary" aria-hidden />
            <span className="font-display font-bold">Pell City Trailer Rentals</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Camp trailers and flatbed rentals in Pell City, Alabama. Book online, pick up
            locally.
          </p>
        </div>
        <div>
          <h4 className="font-display font-semibold mb-3 text-sm">Rent</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/fleet?type=camp_trailer" className="hover:text-foreground">Camp trailers</Link></li>
            <li><Link href="/fleet?type=flatbed" className="hover:text-foreground">Flatbed trailers</Link></li>
            <li><Link href="/fleet" className="hover:text-foreground">All trailers</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display font-semibold mb-3 text-sm">Company</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/about" className="hover:text-foreground">About</Link></li>
            <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display font-semibold mb-3 text-sm">Policies</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/legal/rental-agreement" className="hover:text-foreground">Rental agreement</Link></li>
            <li><Link href="/legal/cancellation" className="hover:text-foreground">Cancellation policy</Link></li>
            <li><Link href="/legal/terms" className="hover:text-foreground">Terms of service</Link></li>
            <li><Link href="/legal/privacy" className="hover:text-foreground">Privacy</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t">
        <div className="container py-6 text-xs text-muted-foreground flex flex-col sm:flex-row gap-2 justify-between">
          <span>© {new Date().getFullYear()} Pell City Trailer Rentals. All rights reserved.</span>
          <span>Pell City, St. Clair County, Alabama</span>
        </div>
      </div>
    </footer>
  );
}
