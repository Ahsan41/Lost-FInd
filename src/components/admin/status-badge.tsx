import type { AdminItemStatus, ClaimStatus } from "@/types/item";

type StatusBadgeProps = { status: AdminItemStatus | ClaimStatus };

export function StatusBadge({ status }: StatusBadgeProps) {
  const className = status.toLowerCase().replace(/\s+/g, "-");
  return <span className={`admin-status admin-status-${className}`}>{status}</span>;
}
