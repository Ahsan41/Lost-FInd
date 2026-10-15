import Image from "next/image";
import Link from "next/link";
import type { AdminFoundItem, AdminItemStatus, ClaimRequest } from "@/types/item";
import { formatDate, referenceNumber } from "@/lib/format";
import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import { StatusTag } from "@/components/ui/status-tag";

interface AdminItemDetailsProps {
  item: AdminFoundItem;
  /** Claims made on this item, so the sheet can say what is riding on it. */
  claims?: ClaimRequest[];
  onClose: () => void;
  onRequestStatus: (status: AdminItemStatus) => void;
}

export function AdminItemDetails({
  item,
  claims = [],
  onClose,
  onRequestStatus,
}: AdminItemDetailsProps) {
  const pending = claims.filter((claim) => claim.status === "Pending").length;
  const approved = claims.filter((claim) => claim.status === "Approved").length;
  const rejected = claims.filter((claim) => claim.status === "Rejected").length;

  return (
    <Modal onClose={onClose} title={`${item.name} report details`}>
      <div className="sheet-record">
        <div className="record-head">
          <div>
            <p className="kicker kicker-accent">{item.category}<span className="kicker-ref">{referenceNumber(item.id)}</span></p>
            <h2>{item.name}</h2>
            <p>{item.location}</p>
          </div>
          <StatusTag pill status={item.reviewStatus} />
        </div>

        <div className="record-photo">
          {item.image ? (
            <Image
              alt={`${item.name} original image for admin review`}
              fill
              sizes="(max-width: 640px) 100vw, 540px"
              src={item.image}
              unoptimized
            />
          ) : (
            <span className="item-image-placeholder"><Icon name="image" />No image provided</span>
          )}
        </div>

        <dl className="facts">
          <div className="facts-wide">
            <dt>Description</dt>
            <dd>{item.description}</dd>
          </div>
          <div>
            <dt>Found on</dt>
            <dd>{formatDate(item.foundDate)}</dd>
          </div>
          <div>
            <dt>Report submitted</dt>
            <dd>{formatDate(item.submittedAt)}</dd>
          </div>
          <div>
            <dt>Public status</dt>
            <dd><StatusTag status={item.status} /></dd>
          </div>
          <div>
            <dt>Claims on this entry</dt>
            <dd>
              {claims.length === 0
                ? "None yet."
                : <>
                    {claims.length} {claims.length === 1 ? "claim" : "claims"}
                    {" · "}{pending} pending, {approved} approved, {rejected} rejected.{" "}
                    <Link href="/admin/claims">Open claims</Link>
                  </>}
            </dd>
          </div>
          <div>
            <dt>Reporter</dt>
            <dd>{item.reporter.name}</dd>
          </div>
          <div>
            <dt>Reporter email</dt>
            <dd><a href={`mailto:${item.reporter.email}`}>{item.reporter.email}</a></dd>
          </div>
          <div>
            <dt>Reporter phone</dt>
            <dd><a href={`tel:${item.reporter.phone}`}>{item.reporter.phone}</a></dd>
          </div>
        </dl>

        {item.reviewStatus === "Pending review" && (
          <div className="modal-actions">
            <span className="modal-actions-note">Approving lists this report in the public register.</span>
            <button className="button button-danger" onClick={() => onRequestStatus("Rejected")} type="button">Reject report</button>
            <button className="button button-primary" onClick={() => onRequestStatus("Approved")} type="button"><Icon name="check" />Approve report</button>
          </div>
        )}
        {item.reviewStatus === "Rejected" && (
          <div className="modal-actions">
            <span className="modal-actions-note">This report is not listed publicly.</span>
            <button className="button button-primary" onClick={() => onRequestStatus("Approved")} type="button"><Icon name="check" />Approve report</button>
          </div>
        )}
        {item.reviewStatus === "Approved" && (
          <div className="modal-actions">
            <span className="modal-actions-note">
              {approved > 0 ? "A claim is approved. Use this once the hand-over has happened." : "Use this once the item has been handed back."}
            </span>
            <button className="button button-primary" onClick={() => onRequestStatus("Returned")} type="button">Mark as returned</button>
          </div>
        )}
      </div>
    </Modal>
  );
}
