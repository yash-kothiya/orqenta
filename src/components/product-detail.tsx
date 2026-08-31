"use client";

import { Pencil, RotateCcw, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { formatMoney } from "@/lib/format";
import {
  type MockProduct,
  PRODUCT_CATEGORIES,
  PRODUCT_UNITS,
  TAX_DEFINITIONS,
  taxLabel,
} from "@/lib/mock-data";

const codeName = (
  list: { code: string; name: string }[],
  code: string | null,
) => list.find((entry) => entry.code === code)?.name ?? code;

export function ProductDetail({ product }: { product: MockProduct }) {
  const router = useRouter();
  // ponytail: local until §6.3 mutations land — reactivate only flips the badge.
  const [isActive, setIsActive] = useState(product.isActive);

  const tax = TAX_DEFINITIONS.find((t) => t.id === product.taxDefinitionId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          Product {product.name}
          {!isActive && <Badge variant="secondary">Inactive</Badge>}
        </h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            render={<Link href={`/products/${product.id}/edit`} />}
          >
            <Pencil className="size-4" />
            Edit
          </Button>

          {!isActive && (
            <Button
              variant="secondary"
              onClick={() => {
                setIsActive(true);
                toast.add({ title: `${product.name} reactivated` });
              }}
            >
              <RotateCcw className="size-4" />
              Reactivate
            </Button>
          )}

          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button variant="destructive">
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete product</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this product?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={() => {
                    toast.add({ title: `${product.name} deleted` });
                    router.push("/products");
                  }}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Card className="grid gap-4 p-6 sm:grid-cols-2">
        <Detail label="Name" value={product.name} />
        <Detail label="Unit Price" value={formatMoney(product.unitPrice)} />
        <Detail label="Description" value={product.description} />
        <Detail label="SKU" value={product.sku} />
        <Detail label="Unit" value={codeName(PRODUCT_UNITS, product.unit)} />
        <Detail
          label="Category"
          value={codeName(PRODUCT_CATEGORIES, product.category)}
        />
        {tax && <Detail label="Tax Definition" value={taxLabel(tax)} />}
      </Card>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-medium whitespace-pre-wrap">{value || "—"}</span>
    </div>
  );
}
