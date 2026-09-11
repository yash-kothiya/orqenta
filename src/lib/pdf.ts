/**
 * §11 — print a rendered invoice to A4.
 *
 * The HTML is handed straight to the page rather than fetched back over HTTP:
 * the document is already built, and re-requesting the route would mean
 * replaying the caller's session cookie into a browser we control.
 */
import puppeteer, { type Browser } from "puppeteer";

/**
 * One browser for the process. Launching Chrome costs a second or two, which
 * is the whole request budget for a download.
 *
 * ponytail: no pool. Pages are cheap and one browser serves them; add one the
 * day concurrent exports actually queue.
 */
const cache = globalThis as typeof globalThis & { orqentaBrowser?: Browser };

async function browser() {
  if (cache.orqentaBrowser?.connected) return cache.orqentaBrowser;

  try {
    cache.orqentaBrowser = await puppeteer.launch({
      // Alpine and most containers ship their own chromium; point at it rather
      // than shipping a second copy inside the image.
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    });
  } catch (cause) {
    // A missing browser is a setup problem, not a bad invoice: say which.
    throw new Error(
      "PDF export needs a Chrome binary. Run `npx puppeteer browsers install chrome`, or set PUPPETEER_EXECUTABLE_PATH to an existing one.",
      { cause },
    );
  }

  return cache.orqentaBrowser;
}

export async function htmlToPdf(html: string, baseUrl?: string) {
  // Relative asset paths — an uploaded logo, say — have nothing to resolve
  // against once the document is set directly, so give them an origin.
  const document = baseUrl
    ? html.replace(/<head>/i, `<head><base href="${baseUrl}/" />`)
    : html;

  const page = await (await browser()).newPage();
  try {
    await page.setContent(document, { waitUntil: "load" });
    const bytes = await page.pdf({
      format: "A4",
      printBackground: true,
      // The template owns its margins through @page; a second set here would
      // stack with them and shrink the content box.
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });

    // page.pdf hands back a Uint8Array over a possibly-shared buffer, which is
    // not a BlobPart; copying into a plain one settles it and costs a memcpy.
    return new Blob([new Uint8Array(bytes).slice().buffer], {
      type: "application/pdf",
    });
  } finally {
    await page.close();
  }
}

/** The filename a browser saves the download as. */
export const pdfHeaders = (invoiceNumber: string) => ({
  "content-type": "application/pdf",
  "content-disposition": `attachment; filename="${invoiceNumber.replace(/[^\w.-]/g, "_")}.pdf"`,
  "cache-control": "no-store",
});
