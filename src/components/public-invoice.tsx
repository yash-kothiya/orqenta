"use client";

import { ChevronDown, Download, ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/toast";

// ponytail: the XML profiles and the PDF print both need the server (§11), so
// they say so instead of pretending. The HTML render route is real.
const needsServer = (what: string) => () =>
  toast.add({
    title: `${what} is not wired yet`,
    description: "This lands with the §11 render routes.",
  });

const XML_FORMATS = [
  "Standard UBL XML",
  "UBL 2.1 (PEPPOL)",
  "FacturX / ZUGFeRD 2.2",
];

export function PublicInvoice({ token }: { token: string }) {
  const base = `/api/public/invoices/${token}`;
  const html = `${base}/html`;

  return (
    <div className="min-h-full flex-1 bg-muted/40 px-4 py-8 sm:px-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-light">Invoice</h1>

          <div className="flex items-center gap-1 self-start rounded-full border bg-background p-1 shadow-sm sm:self-auto">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="sm" className="rounded-full" />
                }
              >
                <FileText className="size-4" />
                XML Data
                <ChevronDown className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Format</DropdownMenuLabel>
                {XML_FORMATS.map((format) => (
                  <DropdownMenuItem key={format} onClick={needsServer(format)}>
                    {format}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Separator orientation="vertical" className="mx-1 h-6" />

            <Button
              variant="ghost"
              size="icon"
              aria-label="Open in new tab"
              className="rounded-full"
              render={
                // biome-ignore lint/a11y/useAnchorContent: the Button supplies the icon.
                <a href={html} target="_blank" rel="noreferrer" />
              }
            >
              <ExternalLink className="size-4" />
            </Button>

            <Button
              size="sm"
              className="rounded-full"
              render={
                // biome-ignore lint/a11y/useAnchorContent: the Button supplies it
                <a href={`${base}/pdf`} download />
              }
            >
              <Download className="size-4" />
              Download PDF
            </Button>
          </div>
        </div>

        <iframe
          src={html}
          title="Invoice"
          className="w-full rounded-xl border bg-white"
          style={{ minHeight: "75vh" }}
        />
      </div>
    </div>
  );
}
