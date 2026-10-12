import Image from "next/image";
import type { AdminFoundItem, AdminItemStatus } from "@/types/item";
import { formatDate } from "@/lib/format";
import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/admin/status-badge";

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
      <div className="admin-modal-content">
        <div className="admin-item-detail-media">
          {item.image ? (
            <Image
              alt={`${item.name} original image for admin review`}
              fill
              sizes="(max-width: 620px) 100vw, 560px"
              src={item.image}
              unoptimized
            />
          ) : <span className="admin-no-image">No image provided</span>}
        </div>
        <div className="admin-detail-heading">
          <div>
            <h2 className="admin-modal-title">{item.name}</h2>
            <p className="admin-modal-description">{item.category} · {item.location}</p>
          </div>
          <StatusBadge status={item.reviewStatus} />
        </div>
        <div className="admin-detail-grid">
          <div className="admin-detail-cell admin-detail-cell-wide">
            <small>Description</small>
            <strong>{item.description}</strong>
          </div>
          <div className="admin-detail-cell">
            <small>Found on</small>
            <strong>{formatDate(item.foundDate)}</strong>
          </div>
          <div className="admin-detail-cell">
            <small>Report submitted</small>
            <strong>{formatDate(item.submittedAt)}</strong>
          </div>
          <div className="admin-detail-cell">
            <small>Reporter</small>
            <strong>{item.reporter.name}</strong>
          </div>
          <div className="admin-detail-cell">
            <small>Reporter email</small>
            <a href={`mailto:${item.reporter.email}`}>{item.reporter.email}</a>
          </div>
          <div className="admin-detail-cell">
            <small>Reporter phone</small>
            <a href={`tel:${item.reporter.phone}`}>{item.reporter.phone}</a>
          </div>
        </div>
        {item.reviewStatus === "Pending review" && (
          <div className="admin-modal-actions">
            <button className="button button-danger" onClick={() => onRequestStatus("Rejected")} type="button">Reject report</button>
            <button className="button button-primary" onClick={() => onRequestStatus("Approved")} type="button"><Icon name="check" />Approve report</button>
          </div>
        )}
        {item.reviewStatus === "Rejected" && (
          <div className="admin-modal-actions">
            <button className="button button-primary" onClick={() => onRequestStatus("Approved")} type="button"><Icon name="check" />Approve report</button>
          </div>
        )}
        {item.reviewStatus === "Approved" && (
          <div className="admin-modal-actions">
            <button className="button button-primary" onClick={() => onRequestStatus("Returned")} type="button">Mark as returned</button>
          </div>
        )}
      </div>
    </Modal>
  );
}
