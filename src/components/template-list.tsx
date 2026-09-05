"use client";

import { FilePlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import { TEMPLATES } from "@/lib/mock-data";

// ponytail: templates are uploaded/installed server-side (§6 install/uploadTemplate)
// and the port has no template route beyond this list, so the name is plain text
// and the button says so. Link it once a detail/upload page exists.
const notWired = () =>
  toast.add({
    title: "Template upload is not wired yet",
    description: "This lands with the §6 server actions.",
  });

export function TemplateList() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Templates</h1>
          <p className="text-sm text-muted-foreground">
            Manage invoice HTML templates.
          </p>
        </div>
        <Button className="w-full sm:w-auto" onClick={notWired}>
          <FilePlus className="size-4" />
          New Template
        </Button>
      </div>

      {TEMPLATES.length === 0 ? (
        <Card className="items-center py-12 text-center">
          <p className="text-muted-foreground">No templates found.</p>
        </Card>
      ) : (
        <>
          {/* Mobile: one card per template. */}
          <div className="flex flex-col gap-3 sm:hidden">
            {TEMPLATES.map((template) => (
              <Card key={template.id} className="gap-1 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{template.name}</span>
                  {template.isDefault && <Badge variant="ghost">Default</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">
                  {template.description ?? "No description"}
                </p>
              </Card>
            ))}
          </div>

          <Card className="hidden gap-0 py-0 sm:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="px-4">Name</TableHead>
                  <TableHead className="px-4">Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {TEMPLATES.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="px-4 font-medium">
                      <span className="flex items-center gap-2">
                        {template.name}
                        {template.isDefault && (
                          <Badge variant="ghost">Default</Badge>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 text-muted-foreground">
                      {template.description ?? "No description"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  );
}
