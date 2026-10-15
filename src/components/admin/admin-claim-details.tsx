import Image from "next/image";
import type { AdminFoundItem, ClaimRequest, ClaimStatus } from "@/types/item";
import { formatDate } from "@/lib/format";
import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import { StatusTag } from "@/components/ui/status-tag";

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
    <Modal onClose={onClose} title={`Claim from ${claim.claimant.name}`} wide>
      <div className="sheet-record">
        <div className="record-head">
          <div>
            <p className="kicker kicker-accent">Ownership claim</p>
            <h2>{claim.claimant.name}</h2>
            <p>Submitted {formatDate(claim.submittedAt)}</p>
          </div>
          <StatusTag pill status={claim.status} />
        </div>

        <div className="claim-subject">
          <div className="claim-subject-media">
            {item.image && (
              <Image alt={`${item.name} original item image`} fill sizes="56px" src={item.image} unoptimized />
            )}
          </div>
          <div className="claim-subject-copy">
            <small>Claim for found item</small>
            <strong>{item.name}</strong>
            <span>{item.category} · {item.location}</span>
          </div>
          <StatusTag status={item.reviewStatus} />
        </div>

        <dl className="facts">
          <div>
            <dt>Claimant email</dt>
            <dd><a href={`mailto:${claim.claimant.email}`}>{claim.claimant.email}</a></dd>
          </div>
          <div>
            <dt>Claimant phone</dt>
            <dd><a href={`tel:${claim.claimant.phone}`}>{claim.claimant.phone}</a></dd>
          </div>
          <div className="facts-wide">
            <dt>What they say they lost</dt>
            <dd className="facts-quote">{claim.lostItemDescription}</dd>
          </div>
          <div className="facts-wide">
            <dt>Ownership detail provided</dt>
            <dd className="facts-quote">{claim.ownershipProof}</dd>
          </div>
          <div className="facts-wide">
            <dt>Finder’s description, for comparison</dt>
            <dd>{item.description}</dd>
          </div>
          {claim.supportingImage && (
            <div className="facts-wide">
              <dt>Supporting image</dt>
              <dd>
                <div className="evidence">
                  <Image alt="Claimant-provided ownership evidence" fill sizes="(max-width: 640px) 90vw, 560px" src={claim.supportingImage} unoptimized />
                </div>
              </dd>
            </div>
          )}
        </dl>

        {claim.status === "Pending" && (
          <div className="modal-actions">
            <span className="modal-actions-note">Approving shares contact details with both people.</span>
            <button className="button button-danger" onClick={() => onRequestStatus("Rejected")} type="button">Reject claim</button>
            <button className="button button-primary" onClick={() => onRequestStatus("Approved")} type="button"><Icon name="check" />Approve claim</button>
          </div>
        )}
        {claim.status === "Approved" && item.reviewStatus !== "Returned" && (
          <div className="modal-actions">
            <span className="modal-actions-note">Once the hand-over has happened, close the entry.</span>
            <button className="button button-primary" onClick={onRequestReturn} type="button">Mark item returned</button>
          </div>
        )}
      </div>
    </Modal>
  );
}
