"use client";

import Image from "next/image";
import type { FoundItem } from "@/types/item";
import { formatDate } from "@/lib/format";
import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import { StatusTag } from "@/components/ui/status-tag";

interface ItemDetailsModalProps {
  item: FoundItem;
  onClaim: () => void;
  onClose: () => void;
}

export function ItemDetailsModal({
  item,
  onClaim,
  onClose,
}: ItemDetailsModalProps) {
  return (
    <Modal onClose={onClose} title={`${item.name} details`} wide>
      <div className="record">
        <div className="record-media">
          {item.image ? (
            <Image
              alt={item.name}
              fill
              sizes="(max-width: 760px) 100vw, 420px"
              src={item.image}
              unoptimized
            />
          ) : (
            <span className="item-image-placeholder"><Icon name="image" />No photo on file</span>
          )}
        </div>
        <div className="record-body">
          <div className="record-topline">
            <span className="kicker kicker-accent">{item.category}</span>
            <StatusTag status={item.status} />
          </div>
          <h2 className="record-title">{item.name}</h2>
          <p className="record-description">{item.description}</p>
          <dl className="record-facts">
            <div>
              <dt>Found at</dt>
              <dd>{item.location}</dd>
            </div>
            <div>
              <dt>Date found</dt>
              <dd>{formatDate(item.foundDate)}</dd>
            </div>
            <div>
              <dt>Held by</dt>
              <dd>The person who reported it, until an administrator approves a claim.</dd>
            </div>
          </dl>
          {item.status === "Reunited" ? (
            <p className="record-closed" role="status">
              <Icon name="check-circle" />This item has already been reunited with its owner.
            </p>
          ) : (
            <div className="record-actions">
              <button className="button button-primary" onClick={onClaim} type="button">
                This is mine <Icon name="arrow-right" />
              </button>
              <p className="record-actions-note">
                You will be asked for a detail only the owner would know. It is never shown publicly.
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
