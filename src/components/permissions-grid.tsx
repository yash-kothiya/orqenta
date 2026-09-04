"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  actionLabel,
  GRID_ACTIONS,
  permKey,
  RESOURCE_ACTIONS,
  RESOURCES,
  resourceLabel,
} from "@/lib/permissions";

/**
 * ponytail: permissions stay a flat list of `perm.{resource}.{action}` keys the
 * whole way through, so nothing ever has to split them back apart at the last
 * dot — the server action can do that once when it writes user_permissions.
 */
const ALL_KEYS = RESOURCES.flatMap((r) =>
  RESOURCE_ACTIONS[r].map((a) => permKey(r, a)),
);

export function PermissionsGrid({
  value,
  onChange,
  disabled,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}) {
  const toggle = (key: string, checked: boolean) =>
    onChange(checked ? [...value, key] : value.filter((k) => k !== key));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={() => onChange(ALL_KEYS)}
        >
          Select All
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={() => onChange([])}
        >
          Clear All
        </Button>
      </div>

      <div className="max-h-96 overflow-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="px-4">Resource</TableHead>
              {GRID_ACTIONS.map((action) => (
                <TableHead key={action} className="px-2 text-center">
                  {actionLabel(action)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {RESOURCES.map((resource) => (
              <TableRow key={resource}>
                <TableCell className="px-4 font-medium whitespace-nowrap">
                  {resourceLabel(resource)}
                </TableCell>
                {GRID_ACTIONS.map((action) => {
                  const key = permKey(resource, action);
                  const applies = RESOURCE_ACTIONS[resource].includes(action);
                  return (
                    <TableCell key={action} className="px-2 text-center">
                      {applies ? (
                        <Checkbox
                          id={key}
                          name={key}
                          className="mx-auto"
                          disabled={disabled}
                          checked={value.includes(key)}
                          onCheckedChange={(checked) => toggle(key, checked)}
                          aria-label={`${resourceLabel(resource)} ${action}`}
                        />
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
