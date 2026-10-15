import Image from "next/image";
import type { AdminFoundItem, AdminItemStatus } from "@/types/item";
import { formatDate } from "@/lib/format";
import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import { StatusTag } from "@/components/ui/status-tag";

interface AdminItemDetailsProps {
  item: AdminFoundItem;
  onClose: () => void;
  onRequestStatus: (status: AdminItemStatus) => void;
}

export function AdminItemDetails({
  item,
  onClose,
  onRequestStatus,
}: AdminItemDetailsProps) {
  return (
    <Modal onClose={onClose} title={`${item.name} report details`}>
      <div className="sheet-record">
        <div className="record-head">
          <div>
            <p className="kicker kicker-accent">{item.category}</p>
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
          <div>
            <dt>Reporter WhatsApp</dt>
            <dd>
              {item.reporter.whatsapp ? (
                <a href={`https://wa.me/${item.reporter.whatsapp.replace(/\D/g, "")}`} rel="noreferrer" target="_blank">
                  {item.reporter.whatsapp}
                </a>
              ) : (
                <span className="table-muted">Not provided</span>
              )}
            </dd>
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
            <span className="modal-actions-note">Use this once the item has been handed back.</span>
            <button className="button button-primary" onClick={() => onRequestStatus("Returned")} type="button">Mark as returned</button>
          </div>
        )}
      </div>
    </Modal>
  );
}
