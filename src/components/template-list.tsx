"use client";

import { useQuery } from "@tanstack/react-query";
import { FilePlus } from "lucide-react";
import Link from "next/link";
import { listTemplates } from "@/app/(app)/templates/actions";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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


export function TemplateList() {
  const {
    data: templatesList = [],
    isPending,
    error,
  } = useQuery({
    queryKey: ["templates", "list"],
    queryFn: async () => {
      try {
        const result = await listTemplates();
        if (!result.ok) {
          console.error("Failed to load templates:", result.error);
          throw new Error(result.error || "Failed to load templates");
        }
        return result.data;
      } catch (err) {
        console.error("Template list error:", err);
        throw err;
      }
    },
    retry: false,
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
          <AlertTitle>{(error as Error).message}</AlertTitle>
        </Alert>
      </div>
    );
  }

  if (templatesList.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <Header />
        <Card className="items-center py-12 text-center">
          <p className="text-muted-foreground">No templates found.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Header />

      {/* Mobile: one card per template. */}
      <div className="flex flex-col gap-3 sm:hidden">
        {templatesList.map((template) => (
          <Card key={template.id} className="gap-1 px-4 py-3">
            <div className="flex items-center gap-2">
              <Link
                href={`/templates/${template.id}`}
                className="font-medium hover:underline"
              >
                {template.name}
              </Link>
              {template.isDefault && <Badge variant="ghost">Default</Badge>}
            </div>
          </Card>
        ))}
      </div>

      <Card className="hidden gap-0 py-0 sm:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="px-4">Name</TableHead>
              <TableHead className="w-32 px-4">Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templatesList.map((template) => (
              <TableRow key={template.id}>
                <TableCell className="px-4 font-medium">
                  <Link
                    href={`/templates/${template.id}`}
                    className="flex items-center gap-2 hover:underline"
                  >
                    {template.name}
                    {template.isDefault && (
                      <Badge variant="ghost">Default</Badge>
                    )}
                  </Link>
                </TableCell>
                <TableCell className="w-32 px-4 text-muted-foreground">
                  {template.templateType}
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
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Templates</h1>
        <p className="text-sm text-muted-foreground">
          Manage invoice HTML templates.
        </p>
      </div>
      <Button className="w-full sm:w-auto" render={<Link href="/templates/new" />}>
        <FilePlus className="size-4" />
        New Template
      </Button>
    </div>
  );
}
