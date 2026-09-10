"use client";

import { Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/detail";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type ManagedRow = { id: string } & Record<string, string>;

export type ManagedField = {
  key: string;
  label: string;
  required?: boolean;
  props?: React.ComponentProps<typeof Input>;
};

/**
 * §10.15's tax-definition, category and unit managers — the same
 * table + add/edit form three times over, so it is one component.
 *
 * Each edit is one call rather than a replacement array: the rows are server
 * rows now, and handing back a whole list would mean diffing it to work out
 * which action to run.
 */
export function ItemManager({
  title,
  fields,
  rows,
  onCreate,
  onUpdate,
  onDelete,
  usage,
  busy = false,
}: {
  title: string;
  fields: ManagedField[];
  rows: ManagedRow[];
  onCreate: (values: Record<string, string>) => void;
  onUpdate: (id: string, values: Record<string, string>) => void;
  onDelete: (id: string) => void;
  /** Rows in use cannot be deleted; the count is shown instead (§10.15). */
  usage?: (row: ManagedRow) => number;
  busy?: boolean;
}) {
  const blank = Object.fromEntries(fields.map((f) => [f.key, ""]));
  const [draft, setDraft] = useState<Record<string, string>>(blank);
  const [editingId, setEditingId] = useState<string | null>(null);

  const incomplete = fields.some((f) => f.required && !draft[f.key]?.trim());

  const reset = () => {
    setDraft(blank);
    setEditingId(null);
  };

  const submit = () => {
    if (incomplete) return;
    if (editingId) onUpdate(editingId, draft);
    else onCreate(draft);
    reset();
  };

  return (
    <div className="flex flex-col gap-4">
      <h3 className="font-medium">{title}</h3>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing defined yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              {fields.map((f) => (
                <TableHead key={f.key}>{f.label}</TableHead>
              ))}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const inUse = usage?.(row) ?? 0;
              return (
                <TableRow key={row.id}>
                  {fields.map((f) => (
                    <TableCell key={f.key}>{row[f.key] || "—"}</TableCell>
                  ))}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Edit ${row[fields[0].key]}`}
                        onClick={() => {
                          setEditingId(row.id);
                          setDraft(
                            Object.fromEntries(
                              fields.map((f) => [f.key, row[f.key] ?? ""]),
                            ),
                          );
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      {inUse > 0 ? (
                        <span className="text-xs text-muted-foreground">
                          In use ({inUse})
                        </span>
                      ) : (
                        <ConfirmDialog
                          title={`Delete ${row[fields[0].key]}`}
                          description="Are you sure? This action cannot be undone."
                          onConfirm={() => onDelete(row.id)}
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Delete ${row[fields[0].key]}`}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          }
                        />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((f) => (
          <Field key={f.key}>
            <FieldLabel htmlFor={`${title}-${f.key}`}>
              {f.required ? `${f.label} *` : f.label}
            </FieldLabel>
            <Input
              id={`${title}-${f.key}`}
              value={draft[f.key] ?? ""}
              onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
              {...f.props}
            />
          </Field>
        ))}
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={submit}
          disabled={incomplete || busy}
        >
          {editingId ? (
            <Save className="size-4" />
          ) : (
            <Plus className="size-4" />
          )}
          {editingId ? "Save" : "Add"}
        </Button>
        {editingId && (
          <Button variant="ghost" onClick={reset}>
            <X className="size-4" />
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
