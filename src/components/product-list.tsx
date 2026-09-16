"use client";

import { useQuery } from "@tanstack/react-query";
import { PackagePlus } from "lucide-react";
import Link from "next/link";
import { listProducts } from "@/app/(app)/products/actions";
import { IfPermitted } from "@/components/permission-gated-action";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { unwrap } from "@/lib/action-result";
import { formatMoney } from "@/lib/format";

export function ProductList() {
  const {
    data: products = [],
    isPending,
    error,
  } = useQuery({
    queryKey: ["products", "list"],
    queryFn: () => listProducts().then(unwrap),
  });

  if (isPending) {
    return (
      <div className="flex flex-col gap-6">
        <Header />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <Header />
        <Alert variant="destructive">
          <AlertTitle>{error.message}</AlertTitle>
        </Alert>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <Header />
        <Card className="items-center gap-4 py-12 text-center">
          <p className="text-muted-foreground">No products yet.</p>
          <IfPermitted resource="products" action="create">
            <Button render={<Link href="/products/new" />}>
              Create your first product
            </Button>
          </IfPermitted>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Header />

      {/* Mobile: one card per product. */}
      <div className="flex flex-col gap-3 sm:hidden">
        {products.map((product) => (
          <Card key={product.id} className="gap-2 px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <Link
                href={`/products/${product.id}`}
                className="font-medium hover:underline"
              >
                {product.name}
              </Link>
              <span className="whitespace-nowrap">
                {formatMoney(product.unitPrice)}
              </span>
            </div>
            {product.description && (
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {product.description}
              </p>
            )}
          </Card>
        ))}
      </div>

      <Card className="hidden gap-0 py-0 sm:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="px-4">Name</TableHead>
              <TableHead className="px-4">Description</TableHead>
              <TableHead className="w-24 px-4 text-right">Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="px-4 font-medium">
                  <Link
                    href={`/products/${product.id}`}
                    className="hover:underline"
                  >
                    {product.name}
                  </Link>
                </TableCell>
                <TableCell
                  className="max-w-[24rem] truncate px-4 text-muted-foreground"
                  title={product.description ?? undefined}
                >
                  {product.description ?? "—"}
                </TableCell>
                <TableCell className="w-24 whitespace-nowrap px-4 text-right">
                  {formatMoney(product.unitPrice)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function Header() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-2xl font-semibold">Products</h1>
      <IfPermitted resource="products" action="create">
        <Button
          className="w-full sm:w-auto"
          render={<Link href="/products/new" />}
        >
          <PackagePlus className="size-4" />
          New Product
        </Button>
      </IfPermitted>
    </div>
  );
}
