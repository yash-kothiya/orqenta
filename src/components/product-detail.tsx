"use client";

import { Pencil, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DeleteConfirm, Detail } from "@/components/detail";
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

          <DeleteConfirm
            title="Delete product"
            description="Are you sure you want to delete this product?"
            onConfirm={() => {
              toast.add({ title: `${product.name} deleted` });
              router.push("/products");
            }}
          />
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
