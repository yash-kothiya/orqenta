import {
  FileText,
  LayoutGrid,
  LogOut,
  Package,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/products", label: "Products", icon: Package },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/logout", label: "Logout", icon: LogOut },
];

export function SiteHeader() {
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-lg font-semibold"
        >
          Orqenta
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
