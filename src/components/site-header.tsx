import {
  Ellipsis,
  FileText,
  LayoutGrid,
  LayoutTemplate,
  LogOut,
  Menu,
  Package,
  Settings,
  UserCog,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { logout } from "@/app/(auth)/login/actions";
import { ThemeToggle, ThemeToggleMenuItem } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { hasPermission, type Resource, type SessionUser } from "@/lib/types";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutGrid;
  /** Hidden unless the session can read it; the dashboard is for everyone. */
  resource?: Resource;
};

/** §9: three links stay in the bar, the rest move into More once they'd wrap. */
const primary: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  {
    href: "/invoices",
    label: "Invoices",
    icon: FileText,
    resource: "invoices",
  },
  {
    href: "/customers",
    label: "Customers",
    icon: Users,
    resource: "customers",
  },
];

const more: NavItem[] = [
  { href: "/products", label: "Products", icon: Package, resource: "products" },
  {
    href: "/templates",
    label: "Templates",
    icon: LayoutTemplate,
    resource: "templates",
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    resource: "settings",
  },
  { href: "/users", label: "Users", icon: UserCog, resource: "users" },
];

const visible = (items: NavItem[], user: SessionUser | null) =>
  user
    ? items.filter(
        (i) => !i.resource || hasPermission(user, i.resource, "read"),
      )
    : [];

/** `user` is null on the signed-out 404, which gets the bar with no links. */
export function SiteHeader({ user = null }: { user?: SessionUser | null }) {
  const mainLinks = visible(primary, user);
  const moreLinks = visible(more, user);

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
          {mainLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground"
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className="flex items-center gap-2 whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground"
                />
              }
            >
              <Ellipsis className="size-4" />
              More
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {moreLinks.map(({ href, label, icon: Icon }) => (
                <DropdownMenuItem key={href} render={<Link href={href} />}>
                  <Icon className="size-4" />
                  {label}
                </DropdownMenuItem>
              ))}
              {user && <DropdownMenuSeparator />}
              {user && <LogoutItem />}
            </DropdownMenuContent>
          </DropdownMenu>
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
              {[...mainLinks, ...moreLinks].map(
                ({ href, label, icon: Icon }) => (
                  <DropdownMenuItem key={href} render={<Link href={href} />}>
                    <Icon className="size-4" />
                    {label}
                  </DropdownMenuItem>
                ),
              )}
              <DropdownMenuSeparator />
              {user && <LogoutItem />}
              <ThemeToggleMenuItem />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

/** A form, not a link: signing out is a write, and GET would let an <img> do it. */
function LogoutItem() {
  return (
    <form action={logout} className="contents">
      {/* A button sizes to its content even as a flex item, so it needs w-full
          to match the plain <div> items around it. */}
      <DropdownMenuItem className="w-full" render={<button type="submit" />}>
        <LogOut className="size-4" />
        Logout
      </DropdownMenuItem>
    </form>
  );
}
