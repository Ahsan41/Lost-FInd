import Image from "next/image";
import type { AdminFoundItem, ClaimRequest, ClaimStatus } from "@/types/item";
import { formatDate } from "@/lib/format";
import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/admin/status-badge";

interface AdminClaimDetailsProps {
  claim: ClaimRequest;
  item: AdminFoundItem;
  onClose: () => void;
  onRequestStatus: (status: ClaimStatus) => void;
  onRequestReturn: () => void;
}

export function AdminClaimDetails({
  claim,
  item,
  onClose,
  onRequestStatus,
  onRequestReturn,
}: AdminClaimDetailsProps) {
  return (
    <Modal onClose={onClose} title={`Claim from ${claim.claimant.name}`}>
      <div className="admin-modal-content">
        <div className="admin-linked-item">
          <div className="admin-linked-image">
            <Image
              alt={`${item.name} original item image`}
              fill
              sizes="52px"
              src={item.image}
              unoptimized
            />
          </div>
          <div className="admin-linked-copy">
            <small>CLAIM FOR FOUND ITEM</small>
            <strong>{item.name}</strong>
            <span>{item.category} · {item.location}</span>
          </div>
          <StatusBadge status={item.reviewStatus} />
        </div>
        <div className="admin-detail-heading admin-claim-heading">
          <div>
            <h2 className="admin-modal-title">{claim.claimant.name}</h2>
            <p className="admin-modal-description">Request submitted {formatDate(claim.submittedAt)}</p>
          </div>
          <StatusBadge status={claim.status} />
        </div>
        <div className="admin-detail-grid">
          <div className="admin-detail-cell">
            <small>Claimant email</small>
            <a href={`mailto:${claim.claimant.email}`}>{claim.claimant.email}</a>
          </div>
          <div className="admin-detail-cell">
            <small>Claimant phone</small>
            <a href={`tel:${claim.claimant.phone}`}>{claim.claimant.phone}</a>
          </div>
          <div className="admin-detail-cell admin-detail-cell-wide">
            <small>What they lost</small>
            <strong>{claim.lostItemDescription}</strong>
          </div>
          <div className="admin-detail-cell admin-detail-cell-wide">
            <small>Ownership details provided</small>
            <strong>{claim.ownershipProof}</strong>
          </div>
          {claim.supportingImage && (
            <div className="admin-detail-cell admin-detail-cell-wide">
              <small>Supporting image</small>
              <div className="admin-supporting-image">
                <Image alt="Claimant-provided ownership evidence" fill sizes="(max-width: 620px) 80vw, 460px" src={claim.supportingImage} unoptimized />
              </div>
            </div>
          )}
        </div>
        {claim.status === "Pending" && (
          <div className="admin-modal-actions">
            <button className="button button-danger" onClick={() => onRequestStatus("Rejected")} type="button">Reject claim</button>
            <button className="button button-primary" onClick={() => onRequestStatus("Approved")} type="button"><Icon name="check" />Approve claim</button>
          </div>
        )}
        {claim.status === "Approved" && item.reviewStatus !== "Returned" && (
          <div className="admin-modal-actions">
            <button className="button button-primary" onClick={onRequestReturn} type="button">Mark item returned</button>
          </div>
        )}
      </div>
    </Modal>
  );
}
