import type { AdminItemStatus, ClaimStatus, ItemStatus } from "@/types/item";
import { Icon } from "@/components/ui/icon";

export type AnyStatus = ItemStatus | AdminItemStatus | ClaimStatus;

type Tone = "open" | "done" | "rejected" | "review";

/**
 * Every status string the backend returns maps to one of four tones. Each tone
 * has a colour and a glyph, so a status is never communicated by colour alone:
 *   open      hollow circle   Waiting for owner, Pending (claim)
 *   review    dashed circle   Pending review (report not yet listed)
 *   done      filled check    Approved, Reunited, Returned
 *   rejected  filled cross    Rejected
 */
const tones: Record<AnyStatus, Tone> = {
  "Waiting for owner": "open",
  Pending: "open",
  "Pending review": "review",
  Approved: "done",
  Reunited: "done",
  Returned: "done",
  Rejected: "rejected",
};

interface StatusTagProps {
  status: AnyStatus;
  /** Adds a tinted background; used in dense tables. */
  pill?: boolean;
}

export function StatusTag({ status, pill = false }: StatusTagProps) {
  const tone = tones[status];
  return (
    <span className={`status status-${tone}${pill ? " status-pill" : ""}`}>
      <span aria-hidden="true" className="status-glyph">
        {tone === "done" && <Icon name="check" />}
        {tone === "rejected" && <Icon name="close" />}
      </span>
      {status}
    </span>
  );
}
