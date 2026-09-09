"use client";

import { CircleCheck, Save, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ColorPicker } from "@/components/color-picker";
import { ItemManager, type ManagedRow } from "@/components/item-manager";
import { type Option, SelectInput } from "@/components/select-input";
import { TemplateList } from "@/components/template-list";
import { ThemeToggle } from "@/components/theme-toggle";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_UNITS,
  PRODUCTS,
  TAX_DEFINITIONS,
  TEMPLATES,
} from "@/lib/mock-data";
import {
  type BoolKey,
  DATE_FORMATS,
  NUMBER_FORMATS,
  NUMBER_TOKENS,
  POSTAL_CITY_FORMATS,
  previewInvoiceNumber,
  ROUNDING_MODES,
  SECTIONS,
  SETTING_DEFAULTS,
  type Settings,
  type TextKey,
  XML_PROFILES,
} from "@/lib/settings";
import { cn } from "@/lib/utils";

/** A logo is either a served path, a remote URL or an inline data image. */
const LOGO_RE = /^(https?:\/\/|\/|data:image\/)/;

const toRows = (items: { code: string; name: string }[]): ManagedRow[] =>
  items.map((i) => ({ id: i.code, code: i.code, name: i.name }));

/** `canEdit` is settings:update, resolved from the session by the page (§10.15). */
export function SettingsForm({ canEdit }: { canEdit: boolean }) {
  const router = useRouter();
  const params = useSearchParams();

  // §10.15: the Templates entry only appears once templates exist.
  const sections = SECTIONS.filter(
    (s) => s.id !== "templates" || TEMPLATES.length > 0,
  );
  const active =
    sections.find((s) => s.id === params.get("section")) ?? sections[0];

  const [values, setValues] = useState<Settings>(SETTING_DEFAULTS);
  const [saved, setSaved] = useState(false);
  const [categories, setCategories] = useState(toRows(PRODUCT_CATEGORIES));
  const [units, setUnits] = useState(toRows(PRODUCT_UNITS));
  const [taxDefs, setTaxDefs] = useState<ManagedRow[]>(
    TAX_DEFINITIONS.map((t) => ({
      id: t.id,
      code: t.code,
      name: t.name ?? "",
      percent: String(t.percent),
      countryCode: "",
    })),
  );

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    setSaved(false);
  };

  // Rendered by call, not as <Component />, so typing never remounts the input.
  const text = (
    key: TextKey,
    label: string,
    props?: React.ComponentProps<typeof Input>,
  ) => (
    <Field>
      <FieldLabel htmlFor={key}>{label}</FieldLabel>
      <Input
        id={key}
        name={key}
        value={values[key]}
        onChange={(e) => set(key, e.target.value)}
        {...props}
      />
    </Field>
  );

  const area = (key: TextKey, label: string) => (
    <Field>
      <FieldLabel htmlFor={key}>{label}</FieldLabel>
      <Textarea
        id={key}
        name={key}
        rows={3}
        value={values[key]}
        onChange={(e) => set(key, e.target.value)}
      />
    </Field>
  );

  const choice = (key: TextKey, label: string, options: Option[]) => (
    <Field>
      <FieldLabel htmlFor={key}>{label}</FieldLabel>
      <SelectInput
        id={key}
        value={values[key]}
        onValueChange={(v) => set(key, v)}
        options={options}
      />
    </Field>
  );

  const check = (key: BoolKey, label: string, description?: string) => (
    <Field orientation="horizontal" className="w-fit">
      <Checkbox
        id={key}
        name={key}
        checked={values[key]}
        onCheckedChange={(checked) => set(key, checked)}
      />
      <FieldContent>
        <FieldLabel htmlFor={key}>
          <FieldTitle>{label}</FieldTitle>
        </FieldLabel>
        {description && <FieldDescription>{description}</FieldDescription>}
      </FieldContent>
    </Field>
  );

  const logoInvalid = values.logo !== "" && !LOGO_RE.test(values.logo);

  const readLogo = (file: File | undefined) => {
    if (!file) return;
    // ponytail: the §6 write path swaps a `data:image/…` value for its served
    // path, so the browser only has to get the bytes into the field.
    const reader = new FileReader();
    reader.onload = () => set("logo", String(reader.result));
    reader.readAsDataURL(file);
  };

  const panel = () => {
    switch (active.id) {
      case "company":
        return (
          <div className="grid gap-4 sm:grid-cols-2">
            {text("companyName", "Company Name")}
            {text("currency", "Currency")}
            <div className="sm:col-span-2">
              {area("companyAddress", "Company Address")}
            </div>
            {text("companyCity", "City")}
            {text("companyPostalCode", "Postal Code")}
            {text("companyEmail", "Email", { type: "email" })}
            {text("companyPhone", "Phone")}
            {text("companyTaxId", "Tax ID")}
            {text("companyCountryCode", "Country Code", {
              placeholder: "US",
              maxLength: 2,
            })}
          </div>
        );

      case "branding":
        return (
          <div className="flex flex-col gap-4">
            <Field>
              <FieldLabel htmlFor="templateId">Template</FieldLabel>
              {/* `default` is the sentinel for the empty templateId — Select has no empty value. */}
              <SelectInput
                id="templateId"
                value={values.templateId || "default"}
                onValueChange={(v) =>
                  set("templateId", v === "default" ? "" : v)
                }
                options={[
                  { value: "default", label: "Default" },
                  ...TEMPLATES.map((t) => ({ value: t.id, label: t.name })),
                ]}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="highlight">Highlight Color</FieldLabel>
              <ColorPicker
                id="highlight"
                value={values.highlight}
                onChange={(v) => set("highlight", v)}
              />
            </Field>

            <Field data-invalid={logoInvalid}>
              <FieldLabel htmlFor="logo">Logo URL or Path</FieldLabel>
              <Input
                id="logo"
                name="logo"
                placeholder="https://… or /uploads/logos/…"
                value={values.logo}
                onChange={(e) => set("logo", e.target.value)}
                aria-invalid={logoInvalid}
              />
              {logoInvalid ? (
                <FieldError>Invalid URL or data format</FieldError>
              ) : (
                <FieldDescription>Optional</FieldDescription>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="logo-file">Upload Logo</FieldLabel>
              <Input
                id="logo-file"
                type="file"
                accept="image/*"
                onChange={(e) => readLogo(e.target.files?.[0])}
              />
            </Field>

            {values.logo && !logoInvalid && (
              // biome-ignore lint/performance/noImgElement: data: URLs never reach the Image optimizer.
              <img
                src={values.logo}
                alt="Logo preview"
                className="h-16 w-auto self-start rounded-md border bg-card object-contain p-2"
              />
            )}
          </div>
        );

      case "appearance":
        return (
          <Field orientation="horizontal" className="w-fit">
            <FieldContent>
              <FieldTitle>Theme</FieldTitle>
              <FieldDescription>
                Switch between the light and dark palette.
              </FieldDescription>
            </FieldContent>
            <ThemeToggle />
          </Field>
        );

      case "formatting":
        return (
          <div className="grid gap-4 sm:grid-cols-2">
            {choice("dateFormat", "Date Format", DATE_FORMATS)}
            {choice("numberFormat", "Number Format", NUMBER_FORMATS)}
            <div className="sm:col-span-2">
              {choice(
                "postalCityFormat",
                "Postal/City Format",
                POSTAL_CITY_FORMATS,
              )}
            </div>
          </div>
        );

      // ponytail: the /templates list is already the whole panel — reused as is.
      case "templates":
        return <TemplateList />;

      case "payments":
        return (
          <div className="flex flex-col gap-4">
            {check(
              "allowProtectedInvoiceChanges",
              "Allow editing and deleting sent/paid invoices",
            )}
            {area("paymentMethods", "Payment Methods")}
            {area("bankAccount", "Bank Account")}
            {area("paymentTerms", "Payment Terms")}
            {area("defaultNotes", "Default Notes")}
          </div>
        );

      case "tax":
        return (
          <div className="flex flex-col gap-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {text("taxLabel", "Tax Label", { placeholder: "VAT" })}
              {text("defaultTaxRate", "Default Tax Rate", {
                type: "number",
                step: "0.01",
                min: 0,
              })}
              {choice("defaultRoundingMode", "Rounding Mode", ROUNDING_MODES)}
            </div>
            {check("defaultPricesIncludeTax", "Default Prices Include Tax")}
            <Separator />
            <ItemManager
              title="Tax Definitions"
              rows={taxDefs}
              onChange={setTaxDefs}
              fields={[
                { key: "code", label: "Tax code", required: true },
                { key: "name", label: "Display name", required: true },
                {
                  key: "percent",
                  label: "Tax Rate (%)",
                  required: true,
                  props: { type: "number", step: "0.01", min: 0 },
                },
                {
                  key: "countryCode",
                  label: "Country code",
                  props: { maxLength: 2, placeholder: "US" },
                },
              ]}
            />
          </div>
        );

      case "products":
        return (
          <div className="grid gap-8 lg:grid-cols-2">
            <ItemManager
              title="Product Categories"
              rows={categories}
              onChange={setCategories}
              usage={(row) =>
                PRODUCTS.filter((p) => p.category === row.code).length
              }
              fields={[
                { key: "code", label: "Category Code", required: true },
                { key: "name", label: "Category Name", required: true },
              ]}
            />
            <ItemManager
              title="Product Units"
              rows={units}
              onChange={setUnits}
              usage={(row) =>
                PRODUCTS.filter((p) => p.unit === row.code).length
              }
              fields={[
                { key: "code", label: "Unit Code", required: true },
                { key: "name", label: "Unit Name", required: true },
              ]}
            />
          </div>
        );

      case "numbering":
        return (
          <div className="flex flex-col gap-4">
            {check(
              "invoiceNumberingEnabled",
              "Enable Automatic Invoice Numbering",
            )}
            {text("invoiceNumberPattern", "Invoice Number Pattern", {
              placeholder: "INV-{YYYY}-{SEQ}",
            })}
            <div className="rounded-2xl border p-4 text-sm">
              <p className="mb-2 font-medium">Next number</p>
              <code className="font-mono">{previewInvoiceNumber(values)}</code>
            </div>
            <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
              {NUMBER_TOKENS.map(([token, help]) => (
                <div key={token} className="flex gap-2">
                  <dt className="font-mono text-muted-foreground">{token}</dt>
                  <dd className="text-muted-foreground">{help}</dd>
                </div>
              ))}
            </dl>
          </div>
        );

      case "xml":
        return (
          <div className="flex flex-col gap-4">
            {choice("xmlProfileId", "XML Profile ID", XML_PROFILES)}
            {check("embedXmlInPdf", "Embed XML in PDF")}
            {check("embedXmlInHtml", "Embed XML in HTML")}
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      {!canEdit && (
        <Alert>
          <TriangleAlert />
          <AlertTitle>
            You do not have permission to modify settings.
          </AlertTitle>
        </Alert>
      )}

      {saved && (
        <Alert>
          <CircleCheck />
          <AlertTitle>Settings saved</AlertTitle>
          <AlertDescription>
            Mock only — the payload was logged to the console.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-[13rem_1fr]">
        <div>
          <div className="md:hidden">
            <SelectInput
              ariaLabel="Settings section"
              value={active.id}
              onValueChange={(id) => router.push(`/settings?section=${id}`)}
              options={sections.map((s) => ({ value: s.id, label: s.label }))}
            />
          </div>
          <nav className="hidden flex-col gap-1 md:flex">
            {sections.map(({ id, label, icon: Icon }) => (
              <Link
                key={id}
                href={`/settings?section=${id}`}
                className={cn(
                  "flex items-center gap-2 rounded-2xl px-3 py-2 text-sm transition-colors",
                  id === active.id
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* A native fieldset disables every input in the panel at once. */}
        <fieldset disabled={!canEdit} className="flex min-w-0 flex-col gap-6">
          {panel()}
          <div>
            <Button
              onClick={() => {
                // ponytail: no server action yet — §6 updateSettings replaces this.
                console.log("settings payload", values);
                setSaved(true);
              }}
            >
              <Save className="size-4" />
              Save Settings
            </Button>
          </div>
        </fieldset>
      </div>
    </div>
  );
}
