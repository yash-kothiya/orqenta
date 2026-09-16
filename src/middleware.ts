import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { hasPermission, type Resource } from "@/lib/types";

// Map page routes to required resource permissions
const pageResourceMap: Record<string, { resource: Resource; action: "read" | "create" }> = {
  "/invoices": { resource: "invoices", action: "read" },
  "/customers": { resource: "customers", action: "read" },
  "/products": { resource: "products", action: "read" },
  "/templates": { resource: "templates", action: "read" },
  "/users": { resource: "users", action: "read" },
  "/settings": { resource: "settings", action: "read" },
};

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip public routes
  if (pathname.startsWith("/login") || pathname.startsWith("/unauthorized")) {
    return NextResponse.next();
  }

  // Extract the main path (e.g., "/invoices" from "/invoices/123")
  // pathname is like "/invoices/123" or "/customers" (without the (app) folder notation)
  const pathParts = pathname.split("/").filter(Boolean); // ["invoices", "123"] or ["customers"]
  const mainPath = "/" + (pathParts[0] || "dashboard");

  // Check if this path requires permission
  const requiredPermission = pageResourceMap[mainPath];

  // Get session user
  const user = await getSessionUser();
  if (!user) {
    // Redirect to login if not authenticated
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If this path requires permission, check it
  if (requiredPermission) {
    const hasAccess = hasPermission(
      user,
      requiredPermission.resource,
      requiredPermission.action,
    );

    if (!hasAccess) {
      // Redirect to 403 unauthorized page
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/(app)/:path*",
  ],
};
