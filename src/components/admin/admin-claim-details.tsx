import Image from "next/image";
import type { AdminFoundItem, ClaimRequest, ClaimStatus } from "@/types/item";
import { formatDate, referenceNumber } from "@/lib/format";
import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import { StatusTag } from "@/components/ui/status-tag";

interface AdminClaimDetailsProps {
  claim: ClaimRequest;
  item: AdminFoundItem;
  onClose: () => void;
  onRequestStatus: (status: ClaimStatus) => void;
  onRequestReturn: () => void;
  /** Other claims on the same item that are still pending. */
  pendingSiblings?: number;
}

/** The review sheet: finder's record on the left, claimant's statement on the right, decision underneath. */
export function AdminClaimDetails({
  claim,
  item,
  onClose,
  onRequestStatus,
  onRequestReturn,
  pendingSiblings = 0,
}: AdminClaimDetailsProps) {
  return (
    <Modal onClose={onClose} title={`Claim from ${claim.claimant.name}`} wide>
      <div className="sheet-record">
        <div className="record-head">
          <div>
            <p className="kicker kicker-accent">Ownership claim<span className="kicker-ref">{referenceNumber(item.id)}</span></p>
            <h2>{claim.claimant.name}</h2>
            <p>Submitted {formatDate(claim.submittedAt)}</p>
          </div>
          <StatusTag pill status={claim.status} />
        </div>

        <div className="compare">
          <section aria-label="Finder's record" className="compare-side">
            <p className="compare-side-label">Finder’s record</p>
            <div className="compare-photo">
              {item.image ? (
                <Image alt={`${item.name} original item image`} fill sizes="(max-width: 760px) 100vw, 420px" src={item.image} unoptimized />
              ) : (
                <span className="item-image-placeholder"><Icon name="image" />No image provided</span>
              )}
            </div>
            <dl className="facts facts-stack">
              <div>
                <dt>Item</dt>
                <dd>{item.name} <StatusTag status={item.reviewStatus} /></dd>
              </div>
              <div>
                <dt>Description</dt>
                <dd>{item.description}</dd>
              </div>
              <div>
                <dt>Found</dt>
                <dd>{item.location} · {formatDate(item.foundDate)}</dd>
              </div>
              <div>
                <dt>Reported by</dt>
                <dd>{item.reporter.name}</dd>
              </div>
            </dl>
          </section>

          <section aria-label="Claimant's statement" className="compare-side">
            <p className="compare-side-label">Claimant’s statement</p>
            <dl className="facts facts-stack">
              <div>
                <dt>Contact</dt>
                <dd>
                  <a href={`mailto:${claim.claimant.email}`}>{claim.claimant.email}</a>
                  {" · "}
                  <a href={`tel:${claim.claimant.phone}`}>{claim.claimant.phone}</a>
                </dd>
              </div>
              <div>
                <dt>What they say they lost</dt>
                <dd className="facts-quote">{claim.lostItemDescription}</dd>
              </div>
              <div>
                <dt>Ownership detail provided</dt>
                <dd className="facts-quote">{claim.ownershipProof}</dd>
              </div>
              {claim.supportingImage && (
                <div>
                  <dt>Supporting image</dt>
                  <dd>
                    <div className="evidence">
                      <Image alt="Claimant-provided ownership evidence" fill sizes="(max-width: 760px) 90vw, 420px" src={claim.supportingImage} unoptimized />
                    </div>
                  </dd>
                </div>
              )}
            </dl>
          </section>
        </div>

        {claim.status === "Pending" && (
          <div className="modal-actions">
            <span className="modal-actions-note">
              Approving emails both people each other’s contact details
              {pendingSiblings > 0 && ` and rejects the ${pendingSiblings === 1 ? "other pending claim" : `other ${pendingSiblings} pending claims`}`}.
            </span>
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
