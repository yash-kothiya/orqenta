"use client";

import { useEffect, useRef } from "react";
import { renderTemplate } from "@/lib/template";
import { SAMPLE_INVOICE_CONTEXT } from "@/lib/sample-invoice-context";

export function TemplatePreview({ html }: { html: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!iframeRef.current || !html) return;

    try {
      const rendered = renderTemplate(html, SAMPLE_INVOICE_CONTEXT);
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(rendered);
        doc.close();
      }
    } catch (err) {
      console.error("Template preview error:", err);
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(
          `<html><body style="font-family: system-ui; padding: 20px; color: #dc2626;">
            <h2>Preview Error</h2>
            <pre>${String(err)}</pre>
          </body></html>`
        );
        doc.close();
      }
    }
  }, [html]);

  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm font-medium text-muted-foreground">Preview</div>
      <div className="border rounded-lg overflow-hidden bg-white">
        <iframe
          ref={iframeRef}
          className="w-full bg-white"
          style={{
            height: "600px",
            border: "none",
          }}
          title="Template preview"
        />
      </div>
    </div>
  );
}
