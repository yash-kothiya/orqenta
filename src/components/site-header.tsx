import {
  FileText,
  LayoutGrid,
  LogOut,
  Menu,
  Package,
  Settings,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ThemeToggle, ThemeToggleMenuItem } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/dashboard" className="flex shrink-0 items-center">
          {/*
            Both marks ship and CSS picks one, rather than reading useTheme() —
            that would make this a client component and flash the wrong logo
            before hydration.
          */}
          <Image
            src="/logo/light.svg"
            alt="Orqenta"
            width={35}
            height={35}
            priority
            className="h-10 w-auto dark:hidden"
          />
          <Image
            src="/logo/dark.svg"
            alt=""
            aria-hidden
            width={35}
            height={35}
            priority
            className="hidden h-10 w-auto dark:block"
          />
        </Link>

        {/* Desktop: horizontal links, tightened a step before they'd wrap. */}
        <nav className="hidden items-center gap-4 text-sm md:flex lg:gap-6">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground"
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
          <ThemeToggle />
        </nav>

        {/* Mobile: the same items flattened into one dropdown (§9). */}
        <div className="flex items-center md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" aria-label="Open menu" />
              }
            >
              <Menu className="size-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {nav.map(({ href, label, icon: Icon }) => (
                <DropdownMenuItem key={href} render={<Link href={href} />}>
                  <Icon className="size-4" />
                  {label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <ThemeToggleMenuItem />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
