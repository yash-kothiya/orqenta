import { Badge } from "@/components/ui/badge";
import type { InvoiceStatus } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

// §10 status badge colours: draft muted, sent blue, paid green, complete
// secondary, overdue destructive, voided neutral.
const STYLES: Record<InvoiceStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  sent: {
    label: "Sent",
    className: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  },
  complete: {
    label: "Complete",
    className: "bg-secondary text-secondary-foreground",
  },
  paid: {
    label: "Paid",
    className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  },
  overdue: {
    label: "Overdue",
    className: "bg-destructive/15 text-destructive",
  },
  voided: {
    label: "Voided",
    className: "bg-muted text-muted-foreground line-through",
  },
};

export function StatusBadge({
  status,
  className,
}: {
  status: InvoiceStatus;
  className?: string;
}) {
  const { label, className: tone } = STYLES[status];

  return (
    <Badge
      variant="secondary"
      className={cn("border-transparent", tone, className)}
    >
      {label}
    </Badge>
  );
}
