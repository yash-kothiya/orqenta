"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  deleteProduct,
  listProductCategories,
  listProductUnits,
  reactivateProduct,
} from "@/app/(app)/products/actions";
import { listTaxDefinitions } from "@/app/(app)/settings/actions";
import { ConfirmDialog, Detail } from "@/components/detail";
import { IfPermitted } from "@/components/permission-gated-action";
import { usePermission } from "@/hooks/use-permission";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { unwrap } from "@/lib/action-result";
import { formatMoney, taxDefinitionLabel } from "@/lib/format";
import { invalidate } from "@/lib/query-invalidation";
import type { Product } from "@/lib/types";

const codeName = (
  list: { code: string; name: string }[],
  code: string | null,
) => list.find((entry) => entry.code === code)?.name ?? code;

export function ProductDetail({ product }: { product: Product }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { can } = usePermission();

  const { data: units = [] } = useQuery({
    queryKey: ["product_units", "list"],
    queryFn: () => listProductUnits().then(unwrap),
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["product_categories", "list"],
    queryFn: () => listProductCategories().then(unwrap),
  });
  const { data: taxes = [] } = useQuery({
    queryKey: ["tax_definitions", "list"],
    queryFn: () => listTaxDefinitions().then(unwrap),
  });

  const remove = useMutation({
    mutationFn: () => deleteProduct(product.id).then(unwrap),
    onSuccess: async () => {
      await invalidate(queryClient, "products");
      toast.add({ title: `${product.name} deleted` });
      router.push("/products");
    },
  });

  const restore = useMutation({
    mutationFn: () => reactivateProduct(product.id).then(unwrap),
    onSuccess: async () => {
      await invalidate(queryClient, "products");
      toast.add({ title: `${product.name} reactivated` });
      // The row came from the server component above, so re-render it.
      router.refresh();
    },
  });

  const isActive = product.isActive;
  const tax = taxes.find((t) => t.id === product.taxDefinitionId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          Product {product.name}
          {!isActive && <Badge variant="secondary">Inactive</Badge>}
        </h1>
        <div className="flex gap-2">
          <IfPermitted resource="products" action="update">
            <Button
              variant="outline"
              render={<Link href={`/products/${product.id}/edit`} />}
            >
              <Pencil className="size-4" />
              Edit
            </Button>
          </IfPermitted>

          {!isActive && can("products", "update") && (
            <Button
              variant="secondary"
              disabled={restore.isPending}
              onClick={() => restore.mutate()}
            >
              <RotateCcw className="size-4" />
              Reactivate
            </Button>
          )}

          <IfPermitted resource="products" action="delete">
            <ConfirmDialog
              title="Delete product"
              description="Are you sure you want to delete this product?"
              onConfirm={() => remove.mutate()}
            />
          </IfPermitted>
        </div>
      </div>

      {(remove.error || restore.error) && (
        <Alert variant="destructive">
          <AlertTitle>{(remove.error ?? restore.error)?.message}</AlertTitle>
        </Alert>
      )}

      <Card className="grid gap-4 p-6 sm:grid-cols-2">
        <Detail label="Name" value={product.name} />
        <Detail label="Unit Price" value={formatMoney(product.unitPrice)} />
        <Detail label="Description" value={product.description} />
        <Detail label="SKU" value={product.sku} />
        <Detail label="Unit" value={codeName(units, product.unit)} />
        <Detail
          label="Category"
          value={codeName(categories, product.category)}
        />
        {tax && (
          <Detail label="Tax Definition" value={taxDefinitionLabel(tax)} />
        )}
      </Card>
    </div>
  );
}
