"use client";

import Image from "next/image";
import type { FoundItem } from "@/types/item";
import { formatDate } from "@/lib/format";
import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";

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
      <div className="details-layout">
        <div className="details-image-wrap">
          <Image
            alt={item.name}
            className="details-image"
            fill
            sizes="(max-width: 840px) 100vw, 45vw"
            src={item.image}
            unoptimized
          />
          <span className="item-status">
            <span className="item-status-dot" />
            {item.status}
          </span>
        </div>
        <div className="details-copy">
          <span className="details-category">{item.category}</span>
          <h2 className="modal-title">{item.name}</h2>
          <p className="details-description">{item.description}</p>
          <div className="details-facts">
            <div className="details-fact">
              <Icon name="pin" />
              <span><small>Found at</small>{item.location}</span>
            </div>
            <div className="details-fact">
              <Icon name="calendar" />
              <span><small>Date found</small>{formatDate(item.foundDate)}</span>
            </div>
            <div className="details-fact">
              <Icon name="shield" />
              <span><small>Handled with care</small>Held safely while we look for its owner</span>
            </div>
          </div>
          {item.status === "Reunited" ? (
            <div className="item-returned-message" role="status">
              <Icon name="check-circle" />This item has already been reunited with its owner.
            </div>
          ) : (
            <button className="button button-primary" onClick={onClaim} type="button">
              This is mine <Icon name="arrow-right" />
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
